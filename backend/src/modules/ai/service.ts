import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { collaboratorService } from "../collaborator/service.js";
import { InternalServerError, PaymentRequiredError } from "../shared/errors.js";
import { userRepository } from "../user/repository.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import { parseAiResponse } from "./parser.js";
import type { AiGenerateResult } from "./types.js";

class AiService {
  /**
   * Handle an AI generate command:
   *  1. Assert that the user has write access (OWNER or EDITOR only).
   *  2. Strip the "/ai " prefix from the raw command.
   *  3. Build the refined prompt.
   *  4. Call Gemini Flash 3.6.
   *  5. Parse and validate the response.
   *  6. Return { elements, prompt, rawCommand }.
   */
  async handleCommand(
    boardId: string,
    userId: string,
    rawCommand: string,
    viewport?: { x: number; y: number; w: number; h: number },
    existingElements?: any[],
    onStream?: (chunk: string) => void
  ): Promise<AiGenerateResult> {
    await collaboratorService.assertBoardWriteAccess(boardId, userId);

    if (!env.GEMINI_API_KEY) {
      throw new InternalServerError("Gemini API key is not configured.");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new InternalServerError("User not found.");
    }

    if (user.isGuest && user.aiPromptsUsed >= 5) {
      throw new PaymentRequiredError("limit_reached");
    }

    const userPrompt = buildUserPrompt(rawCommand, viewport, existingElements);

    // Initialize the new GoogleGenAI client
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const resultStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    let fullText = "";
    let isJson = false;
    let isFirstChunk = true;

    for await (const chunk of resultStream) {
      const text = chunk.text;
      if (!text) continue;

      fullText += text;

      if (isFirstChunk) {
        isFirstChunk = false;
        const trimmed = fullText.trimStart();
        if (trimmed.startsWith("{") || trimmed.startsWith("```json")) {
          isJson = true;
        }
      }

      if (!isJson && onStream) {
        onStream(text);
      }
    }

    let elements: any[] = [];
    if (isJson) {
      // Clean up markdown block if the LLM outputted it
      let cleanJson = fullText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json\n?/, "");
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.replace(/\n?```$/, "");
      }

      const viewportSafe = viewport || { x: 0, y: 0, w: 1000, h: 800 };
      elements = parseAiResponse(cleanJson, viewportSafe, existingElements);
    }

    if (user.isGuest) {
      await userRepository.incrementAiPrompts(userId);
    }

    // --- Logging ---
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        boardId,
        userId,
        rawCommand,
        refinedPrompt: userPrompt,
        llmRawOutput: fullText,
        finalElements: elements,
      };
      
      const logPath = path.join(process.cwd(), "logs", "ai-execution.log");
      await fs.appendFile(logPath, JSON.stringify(logEntry, null, 2) + "\n\n=========================================\n\n");
    } catch (err) {
      console.error("Failed to write to AI execution log:", err);
    }

    return {
      elements,
      prompt: userPrompt,
      rawCommand,
    };
  }
}

export const aiService = new AiService();

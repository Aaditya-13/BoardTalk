import { GoogleGenAI } from "@google/genai";

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
    existingElements?: any[]
  ): Promise<AiGenerateResult> {
    await collaboratorService.assertBoardWriteAccess(boardId, userId);

    if (!env.GEMINI_API_KEY) {
      throw new InternalServerError("Gemini API key is not configured.");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new InternalServerError("User not found.");
    }

    if (user.isGuest && user.aiPromptsUsed >= 3) {
      throw new PaymentRequiredError("limit_reached");
    }

    const userPrompt = buildUserPrompt(rawCommand, viewport, existingElements);

    // Initialize the new GoogleGenAI client
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "[]";

    const elements = parseAiResponse(responseText);

    if (user.isGuest) {
      await userRepository.incrementAiPrompts(userId);
    }

    return {
      elements,
      prompt: userPrompt,
      rawCommand,
    };
  }
}

export const aiService = new AiService();

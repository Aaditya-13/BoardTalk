import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../../config/env.js";
import { collaboratorService } from "../collaborator/service.js";
import { InternalServerError } from "../shared/errors.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt.js";
import { parseAiResponse } from "./parser.js";
import type { AiGenerateResult } from "./types.js";

class AiService {
  /**
   * Handle an AI generate command:
   *  1. Assert that the user has write access (OWNER or EDITOR only).
   *  2. Strip the "/ai " prefix from the raw command.
   *  3. Build the refined prompt.
   *  4. Call Gemini Flash 2.5.
   *  5. Parse and validate the response.
   *  6. Return { elements, prompt, rawCommand }.
   */
  async handleCommand(
    boardId: string,
    userId: string,
    rawCommand: string
  ): Promise<AiGenerateResult> {
    await collaboratorService.assertBoardWriteAccess(boardId, userId);

    if (!env.GEMINI_API_KEY) {
      throw new InternalServerError("Gemini API key is not configured.");
    }

    const userPrompt = buildUserPrompt(rawCommand);

    // Initialise the model with the static system instruction per-request
    // so the prompt module stays decoupled from the client singleton.
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    const elements = parseAiResponse(responseText);

    return {
      elements,
      prompt: userPrompt,
      rawCommand,
    };
  }
}

export const aiService = new AiService();

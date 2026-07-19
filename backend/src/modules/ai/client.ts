import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../../config/env.js";
import { InternalServerError } from "../shared/errors.js";

export function createGeminiModel(systemInstruction?: string) {
  if (!env.GEMINI_API_KEY) {
    throw new InternalServerError("Gemini API key is not configured.");
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });
}

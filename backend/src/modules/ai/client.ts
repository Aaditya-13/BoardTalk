import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../../config/env.js";

// ---------------------------------------------------------------------------
// Gemini client singleton.
// Model: gemini-2.5-flash — fast, multimodal, supports system instructions.
// ---------------------------------------------------------------------------

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: undefined, // injected per-request in the service
});

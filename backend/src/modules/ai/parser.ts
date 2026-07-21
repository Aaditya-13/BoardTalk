import { randomUUID } from "node:crypto";

import { boardElementArraySchema } from "./schema.js";
import { BadRequestError } from "../shared/errors.js";
import type { BoardElement } from "./types.js";

// ---------------------------------------------------------------------------
// Canvas bounds for coordinate clamping
// ---------------------------------------------------------------------------
const CANVAS_MAX_X = 100000;
const CANVAS_MAX_Y = 100000;
const CANVAS_MIN = -100000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Extract, validate, and sanitise Gemini's text response into BoardElement[].
 *
 * Steps:
 *  1. Strip optional markdown code fences (```json … ```)
 *  2. Parse JSON
 *  3. Validate each element against BoardElementSchema (Zod)
 *  4. Assign stable UUIDs (server-side — never trust Gemini's ids)
 *  5. Clamp coordinates to canvas bounds
 */
export function parseAiResponse(raw: string): BoardElement[] {
  // --- 1. Strip code fences if Gemini wrapped the output ---
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // --- 2. Parse JSON ---
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new BadRequestError(
      "AI returned invalid JSON. Please try a different command."
    );
  }

  // --- 3. Validate against schema ---
  const result = boardElementArraySchema.safeParse(parsed);

  if (!result.success) {
    throw new BadRequestError(
      "AI response did not match the expected element schema. Please try again."
    );
  }

  // --- 4 & 5. Assign UUIDs and clamp coordinates ---
  return result.data.map((el): BoardElement => ({
    ...el,
    id: randomUUID(),
    x: clamp(el.x, CANVAS_MIN, CANVAS_MAX_X),
    y: clamp(el.y, CANVAS_MIN, CANVAS_MAX_Y),
    width: Math.max(1, el.width),
    height: Math.max(1, el.height),
  }));
}

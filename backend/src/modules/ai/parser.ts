import { randomUUID } from "node:crypto";

import { intentPayloadSchema } from "./schema.js";
import { BadRequestError } from "../shared/errors.js";
import type { BoardElement, IntentPayload } from "./types.js";
import { routeIntentLayout } from "./layout-engine.js";

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
 *  3. Validate payload against IntentPayloadSchema (Zod)
 *  4. Route to the deterministic Layout Engine to calculate coordinates
 *  5. Clamp coordinates to canvas bounds
 */
export function parseAiResponse(raw: string, viewport: { x: number; y: number; w: number; h: number }): BoardElement[] {
  // --- 1. Extract JSON from anywhere in the string ---
  let jsonString = raw;
  const jsonMatch = raw.match(/\{\s*"intent"[\s\S]*\}\s*$/m) || raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }

  // --- 2. Parse JSON ---
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("[AI Parse Error] Raw text was:", raw);
    throw new BadRequestError(
      "AI returned invalid JSON. Please try a different command."
    );
  }

  // --- 3. Validate against schema ---
  const result = intentPayloadSchema.safeParse(parsed);

  if (!result.success) {
    console.warn("[AI Zod Error]:", JSON.stringify(result.error.issues, null, 2));
    throw new BadRequestError(
      "AI response did not match the expected semantic intent schema. Please try again."
    );
  }

  // --- 4. Route to Layout Engine ---
  const generatedElements = routeIntentLayout(result.data, viewport);

  // --- 5. Clamp coordinates ---
  return generatedElements.map((el): BoardElement => ({
    ...el,
    x: clamp(el.x, CANVAS_MIN, CANVAS_MAX_X),
    y: clamp(el.y, CANVAS_MIN, CANVAS_MAX_Y),
    width: Math.max(1, el.width),
    height: Math.max(1, el.height),
  }));
}

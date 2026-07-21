// ---------------------------------------------------------------------------
// Prompt construction for the Gemini AI pipeline.
// The system prompt is static and defines the output contract.
// The user prompt is built dynamically from the raw chat command.
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are a whiteboard layout generator for BoardTalk, a collaborative canvas tool.
When given a user request, respond ONLY with a valid JSON array of canvas elements.
Do not include explanation, markdown, or code fences — output ONLY the raw JSON array.

Each element must match this TypeScript type:

interface BoardElement {
  type: "rectangle" | "ellipse" | "text" | "arrow" | "sticky" | "frame";
  x: number;           // canvas x position
  y: number;           // canvas y position
  width: number;       // must be > 0
  height: number;      // must be > 0
  label?: string;      // text label or content
  style?: {
    fill?: "black" | "blue" | "green" | "yellow" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "grey" | "white";
    stroke?: "black" | "blue" | "green" | "yellow" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "grey" | "white";
    fontSize?: number;
    fontWeight?: "normal" | "bold";
    opacity?: number;  // 0.0 – 1.0
  };
  points?: { x: number; y: number }[];  // arrow control points only
}

Rules:
- Generate coordinates specifically centered around the provided Viewport. Do NOT default to (0,0) if the viewport is far away.
- Avoid drawing on top of the Existing Context elements if provided, unless instructed to modify or connect them.
- Keep total element count under 40.
- Prefer clean, grid-aligned layouts with consistent spacing.
- Use meaningful labels that reflect the described UI or diagram.
- Do NOT include an "id" field — it will be assigned by the server.
- STRICTLY use ONLY the allowed colors for fill and stroke. Do NOT use hex codes.`;

/**
 * Build the user-turn prompt from the raw command and context.
 */
export function buildUserPrompt(
  rawCommand: string,
  viewport?: { x: number; y: number; w: number; h: number },
  existingElements?: any[]
): string {
  return JSON.stringify({
    task: rawCommand,
    viewport: viewport || { x: 0, y: 0, w: 1000, h: 800 },
    existingContext: existingElements || []
  }, null, 2);
}

/**
 * Returns the system + user prompt pair ready to send to Gemini.
 */
export function refinePrompt(
  rawCommand: string,
  viewport?: { x: number; y: number; w: number; h: number },
  existingElements?: any[]
): {
  system: string;
  user: string;
} {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(rawCommand, viewport, existingElements),
  };
}

// ---------------------------------------------------------------------------
// Prompt construction for the Gemini AI pipeline.
// The system prompt is static and defines the output contract.
// The user prompt is built dynamically from the raw chat command.
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are a "Smart Engine" architect for BoardTalk, a collaborative canvas tool.
Your job is to read the user's request and output a structured Semantic Intent JSON.
DO NOT ATTEMPT TO CALCULATE PIXELS (x, y, width, height). The Layout Engine will do the math.

CRITICAL OUTPUT CONTRACT:
Respond ONLY with a single, raw JSON object.
- NO markdown, NO code fences, NO explanations, NO comments.
- NO trailing commas.

The output MUST match this interface exactly:
interface IntentPayload {
  intent: "wireframe" | "flowchart" | "cluster";
  elements: {
    id: string; // Provide a temporary string ID (e.g. "e1", "e2")
    type: "container" | "text" | "button" | "input" | "arrow" | "sticky";
    label?: string; // Text content
    parentId?: string; // Used ONLY for 'wireframe' to nest elements inside a container
    connections?: string[]; // Used ONLY for 'flowchart' to link node IDs
    layoutHint?: "vertical" | "horizontal"; // Hint for how a container stacks children
    style?: {
      fill?: "black" | "blue" | "green" | "yellow" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "grey" | "white";
      stroke?: "black" | "blue" | "green" | "yellow" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "grey" | "white";
      fontSize?: number;
      fontWeight?: "normal" | "bold";
    };
  }[];
}

INTENT GUIDELINES:
1. "wireframe" (UI mockups): Use 'container' types with 'parentId' to nest 'text', 'button', and 'input' elements. Set 'layoutHint' to "vertical" or "horizontal" on containers.
2. "flowchart" (Diagrams): Use 'container', 'text', or 'sticky' types and define 'connections' (array of target IDs).
3. "cluster" (Brainstorming): Use 'sticky' types. Do not use parentId or connections. The engine will spread them out radially.

EXISTING CONTEXT RULES:
If 'existingContext' is provided, you may output elements with an existing ID to signify that you are modifying that element.
Otherwise, use unique temporary IDs.

MASSIVE REQUESTS:
Limit output to 40 elements max. Summarize large requests using fewer, larger containers with descriptive labels.

PRE-FLIGHT CHECKLIST (Verify internally before outputting JSON):
[ ] Is the output ONLY a valid JSON object?
[ ] Is the 'intent' strictly one of: wireframe, flowchart, cluster?
[ ] Do all nested elements use correct 'parentId'?
[ ] Are all colors exactly matching the allowed list?`;

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

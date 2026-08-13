export type BoardElementType =
  | "rectangle"
  | "ellipse"
  | "text"
  | "arrow"
  | "sticky"
  | "frame";

export type TldrawColor = "black" | "blue" | "green" | "yellow" | "light-blue" | "light-green" | "light-red" | "light-violet" | "orange" | "red" | "violet" | "grey" | "white";

export interface BoardElementStyle {
  fill?: TldrawColor;
  stroke?: TldrawColor;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  opacity?: number;
}

export interface BoardElement {
  /** Stable UUID assigned by the parser — never from Gemini */
  id: string;
  type: BoardElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  style?: BoardElementStyle;
  /** Control points for arrow elements only */
  points?: { x: number; y: number }[];
  /** Target node ID for the start of an arrow */
  startShapeId?: string;
  /** Target node ID for the end of an arrow */
  endShapeId?: string;
}

export interface AiGenerateResult {
  elements: BoardElement[];
  /** The refined prompt sent to Gemini (useful for debugging) */
  prompt: string;
  /** Original raw command string from the user */
  rawCommand: string;
}

export type AiLayoutIntent = "wireframe" | "flowchart" | "cluster";

export interface IntentElement {
  id: string; // The LLM will provide temporary string IDs like "e1", "e2"
  type: "container" | "text" | "button" | "input" | "arrow" | "sticky";
  label?: string;
  parentId?: string; // For nesting in wireframes
  connections?: string[]; // IDs of targets for arrows
  layoutHint?: "vertical" | "horizontal"; // Hint for containers
  style?: BoardElementStyle;
}

export interface IntentPayload {
  intent: AiLayoutIntent;
  elements: IntentElement[];
}

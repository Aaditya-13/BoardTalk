export type BoardElementType =
  | "rectangle"
  | "ellipse"
  | "text"
  | "arrow"
  | "sticky"
  | "frame";

export interface BoardElementStyle {
  fill?: string;
  stroke?: string;
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
  /** Text label or sticky note content */
  label?: string;
  style?: BoardElementStyle;
  /** Control points for arrow elements only */
  points?: { x: number; y: number }[];
}

export interface AiGenerateResult {
  elements: BoardElement[];
  /** The refined prompt sent to Gemini (useful for debugging) */
  prompt: string;
  /** Original raw command string from the user */
  rawCommand: string;
}

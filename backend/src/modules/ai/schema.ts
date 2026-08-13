import { z } from "zod";

// ---------------------------------------------------------------------------
// BoardElement — Zod mirror of the TypeScript interface in types.ts.
// Used by the parser to validate Gemini output before it reaches the client.
// ---------------------------------------------------------------------------

const tldrawColorSchema = z.enum(["black", "blue", "green", "yellow", "light-blue", "light-green", "light-red", "light-violet", "orange", "red", "violet", "grey", "white"]);

export const boardElementStyleSchema = z.object({
  fill: tldrawColorSchema.optional(),
  stroke: tldrawColorSchema.optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.enum(["normal", "bold"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const boardElementSchema = z.object({
  // id is assigned by the parser after validation — strip any Gemini-supplied id
  id: z.string().optional(),
  type: z.enum(["rectangle", "ellipse", "text", "arrow", "sticky", "frame"]),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  label: z.string().optional(),
  style: boardElementStyleSchema.optional(),
  points: z
    .array(z.object({ x: z.number(), y: z.number() }))
    .optional(),
  startShapeId: z.string().optional(),
  endShapeId: z.string().optional(),
});

export const boardElementArraySchema = z.array(boardElementSchema);

// ---------------------------------------------------------------------------
// IntentPayload — used by the layout engine
// ---------------------------------------------------------------------------

export const intentElementSchema = z.object({
  id: z.string(),
  type: z.enum(["container", "text", "button", "input", "arrow", "sticky"]),
  label: z.string().optional(),
  parentId: z.string().optional(),
  connections: z.array(z.string()).optional(),
  layoutHint: z.enum(["vertical", "horizontal"]).optional(),
  style: boardElementStyleSchema.optional(),
});

export const intentPayloadSchema = z.object({
  intent: z.enum(["wireframe", "flowchart", "cluster"]),
  elements: z.array(intentElementSchema)
});

// ---------------------------------------------------------------------------
// AiCommand — used by the REST endpoint body
// ---------------------------------------------------------------------------

export const aiCommandSchema = z.object({
  command: z.string().min(1).max(1000),
});

export type AiCommandDto = z.infer<typeof aiCommandSchema>;

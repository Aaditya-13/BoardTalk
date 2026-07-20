import * as Y from "yjs";
import { logger } from "../lib/logger.js";

// In-memory store for active Yjs documents
const activeDocs = new Map<string, Y.Doc>();

/**
 * Check if a Y.Doc is already active in memory.
 */
export function hasActiveDoc(boardId: string): boolean {
  return activeDocs.has(boardId);
}

/**
 * Get or create a Y.Doc for a given board ID.
 */
export function getOrCreateDoc(boardId: string): Y.Doc {
  if (!activeDocs.has(boardId)) {
    const doc = new Y.Doc();
    activeDocs.set(boardId, doc);
    logger.info(`[YJS] Created new in-memory Y.Doc for board: ${boardId}`);
  }
  return activeDocs.get(boardId)!;
}

/**
 * Apply an incremental update from a client to the server's in-memory doc.
 */
export function applyYjsUpdate(boardId: string, update: Uint8Array | Buffer) {
  const doc = getOrCreateDoc(boardId);
  try {
    // Y.applyUpdate expects Uint8Array. Buffer extends Uint8Array in Node.
    Y.applyUpdate(doc, new Uint8Array(update));
  } catch (error) {
    logger.error(error, `[YJS] Failed to apply update for board ${boardId}`);
  }
}

/**
 * Generate a sync step 2 (missing updates) for a late-joining client based on their state vector.
 */
export function getSyncStep2(boardId: string, stateVector: Uint8Array | Buffer): Uint8Array {
  const doc = getOrCreateDoc(boardId);
  return Y.encodeStateAsUpdate(doc, new Uint8Array(stateVector));
}

/**
 * Clear a document from memory (e.g. when the last user leaves).
 * For now, this is a placeholder. 
 */
export function clearDocIfEmpty(boardId: string) {
  // TODO: Implement reference counting or clear when room is empty
}

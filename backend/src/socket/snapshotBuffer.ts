import { snapshotService } from "../modules/snapshot/service.js";

type PendingSnapshot = {
  documentJson: unknown;
  timeoutId: NodeJS.Timeout | null;
};

const pendingSnapshots = new Map<string, PendingSnapshot>();
const snapshotDelayMs = 15_000;

export function queueSnapshot(
  boardId: string,
  userId: string,
  documentJson: unknown,
  flush: (boardId: string, userId: string, documentJson: unknown) => Promise<void>
) {
  const existing = pendingSnapshots.get(boardId);

  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }

  const timeoutId = setTimeout(async () => {
    try {
      await flush(boardId, userId, documentJson);
    } finally {
      pendingSnapshots.delete(boardId);
    }
  }, snapshotDelayMs);

  pendingSnapshots.set(boardId, {
    documentJson,
    timeoutId,
  });
}

export async function flushSnapshot(
  boardId: string,
  userId: string,
  flush: (boardId: string, userId: string, documentJson: unknown) => Promise<void>
) {
  const pending = pendingSnapshots.get(boardId);

  if (!pending) {
    return;
  }

  if (pending.timeoutId) {
    clearTimeout(pending.timeoutId);
  }

  pendingSnapshots.delete(boardId);
  try {
    await flush(boardId, userId, pending.documentJson);
  } finally {
    pendingSnapshots.delete(boardId);
  }
}

export async function persistSnapshot(
  boardId: string,
  userId: string,
  documentJson: unknown
) {
  await snapshotService.saveSnapshot(boardId, userId, documentJson as never);
}
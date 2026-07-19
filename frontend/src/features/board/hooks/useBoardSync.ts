import { useEffect, useState } from 'react';
import { createTLStore, defaultShapeUtils, throttle, loadSnapshot, getSnapshot } from 'tldraw';
import type { TLStoreWithStatus } from 'tldraw';
import { socket, connectSocket } from '@/lib/socket';

export function useBoardSync(boardId: string) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({ status: 'loading' });

  useEffect(() => {
    connectSocket();

    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    let unlisten: () => void;

    // Join room
    socket.emit('board:join', { boardId }, (response: any) => {
      if (!response?.success) {
        setStoreWithStatus({ status: 'error', error: new Error('Failed to join board') });
      }
    });

    // Handle initial snapshot
    socket.once('board:snapshot:latest', (payload: { boardId: string; snapshot: any }) => {
      if (payload.boardId === boardId) {
        if (payload.snapshot?.documentJson) {
          try {
            loadSnapshot(store, payload.snapshot.documentJson);
          } catch (e) {
            console.error('Failed to load snapshot:', e);
          }
        }
        setStoreWithStatus({ status: 'synced-remote', connectionStatus: 'online', store });
      }
    });

    // Handle remote updates
    const handleRemoteUpdate = (payload: { boardId: string; update: any }) => {
      if (payload.boardId === boardId && payload.update) {
        // payload.update contains { added, updated, removed }
        try {
          store.mergeRemoteChanges(() => {
            const { added, updated, removed } = payload.update;
            
            // Apply added
            if (added) {
              for (const record of Object.values(added) as any[]) {
                store.put([record]);
              }
            }
            // Apply updated
            if (updated) {
              for (const [_, to] of Object.values(updated) as any[]) {
                store.put([to]);
              }
            }
            // Apply removed
            if (removed) {
              for (const record of Object.values(removed) as any[]) {
                store.remove([record.id]);
              }
            }
          });
        } catch (e) {
          console.error("Failed to merge remote changes", e);
        }
      }
    };

    socket.on('board:update', handleRemoteUpdate);

    // Listen to local changes and broadcast them
    unlisten = store.listen((update) => {
      if (update.source !== 'user') return; // Only broadcast user's own changes
      
      const changes = update.changes;
      socket.emit('board:update', {
        boardId,
        update: changes,
      });
    });

    // Periodically flush full snapshot to backend
    const flushSnapshot = throttle(() => {
      const documentJson = getSnapshot(store);
      socket.emit('board:document', { boardId, documentJson });
    }, 5000);

    const flushUnlisten = store.listen((update) => {
      if (update.source === 'user') {
        flushSnapshot();
      }
    });

    return () => {
      unlisten?.();
      flushUnlisten?.();
      socket.off('board:update', handleRemoteUpdate);
      socket.emit('board:leave', { boardId });
      // We don't disconnect entirely because other parts might use it (like voice/chat),
      // but in a real app we might disconnect if no other boards are active.
    };
  }, [boardId]);

  return storeWithStatus;
}

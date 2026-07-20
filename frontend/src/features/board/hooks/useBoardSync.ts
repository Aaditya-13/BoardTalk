import { useEffect, useState } from 'react';
import { createTLStore, defaultShapeUtils, throttle, loadSnapshot, getSnapshot } from 'tldraw';
import type { TLStoreWithStatus } from 'tldraw';
import { socket, connectSocket } from '@/lib/socket';

export type BoardSyncResult = TLStoreWithStatus & { role?: string };

export function useBoardSync(boardId: string) {
  const [storeWithStatus, setStoreWithStatus] = useState<BoardSyncResult>({ status: 'loading' });

  useEffect(() => {
    connectSocket();

    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    let unlisten: () => void;

    // Join room
    socket.emit('board:join', { boardId }, (response: any) => {
      if (!response?.success) {
        setStoreWithStatus({ status: 'error', error: new Error('Failed to join board') });
      } else {
        // We temporarily store the role so we can merge it when the snapshot arrives
        if (response.data?.role) {
           setStoreWithStatus(prev => ({ ...prev, role: response.data.role }));
        }
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
        setStoreWithStatus(prev => {
          const role = 'role' in prev ? prev.role : undefined;
          return { 
            status: 'synced-remote', 
            connectionStatus: 'online', 
            store,
            role
          } as BoardSyncResult;
        });
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

    const isShareable = (record: any) => {
      const typeName = record?.typeName;
      return ['shape', 'binding', 'asset', 'page', 'document'].includes(typeName);
    };

    const filterChanges = (records: Record<string, any>) => {
      const filtered: Record<string, any> = {};
      for (const [id, value] of Object.entries(records)) {
        const recordToCheck = Array.isArray(value) ? value[1] : value;
        if (isShareable(recordToCheck)) {
          filtered[id] = value;
        }
      }
      return Object.keys(filtered).length > 0 ? filtered : undefined;
    };

    // Listen to local changes and broadcast them
    unlisten = store.listen((update) => {
      if (update.source !== 'user') return; 
      
      const added = update.changes.added ? filterChanges(update.changes.added) : undefined;
      const updated = update.changes.updated ? filterChanges(update.changes.updated) : undefined;
      const removed = update.changes.removed ? filterChanges(update.changes.removed) : undefined;

      if (added || updated || removed) {
        socket.emit('board:update', {
          boardId,
          update: { added, updated, removed },
        });
      }
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

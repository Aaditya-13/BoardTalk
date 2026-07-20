import { useEffect, useState } from 'react';
import { createTLStore, defaultShapeUtils } from 'tldraw';
import type { TLRecord, TLStoreWithStatus } from 'tldraw';
import { socket, connectSocket } from '@/lib/socket';
import * as Y from 'yjs';

// A lightweight custom Yjs provider over Socket.io
export function useYjsStore(boardId: string) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus & { role?: string }>({ status: 'loading' });

  useEffect(() => {
    connectSocket();

    // 1. Create the Yjs Document and a Map to hold the Tldraw records
    const yDoc = new Y.Doc();
    const yMap = yDoc.getMap<any>('tldraw');

    // 2. Create the Tldraw store
    const store = createTLStore({ shapeUtils: defaultShapeUtils });

    // 3. Keep track of what we are updating to avoid infinite loops
    let isApplyingYjsChanges = false;
    let isApplyingTldrawChanges = false;

    // Listen to Yjs changes and apply them to Tldraw
    yMap.observeDeep((events) => {
      if (isApplyingTldrawChanges) return;

      isApplyingYjsChanges = true;
      try {
        const toPut: TLRecord[] = [];
        const toRemove: string[] = [];

        for (const event of events) {
          if (event.target === yMap) {
            for (const [key, change] of event.changes.keys) {
              if (change.action === 'add' || change.action === 'update') {
                toPut.push(yMap.get(key) as TLRecord);
              } else if (change.action === 'delete') {
                toRemove.push(key);
              }
            }
          }
        }

        if (toPut.length > 0) store.put(toPut);
        if (toRemove.length > 0) store.remove(toRemove as any);
      } finally {
        isApplyingYjsChanges = false;
      }
    });

    // Listen to Tldraw changes and apply them to Yjs
    const unlisten = store.listen((update) => {
      if (isApplyingYjsChanges || update.source !== 'user') return;

      isApplyingTldrawChanges = true;
      try {
        yDoc.transact(() => {
          // Add or update records
          for (const record of Object.values(update.changes.added)) {
            if (isShareable(record)) yMap.set(record.id, record);
          }
          for (const [_, record] of Object.values(update.changes.updated)) {
            if (isShareable(record)) yMap.set(record.id, record);
          }
          // Remove records
          for (const record of Object.values(update.changes.removed)) {
            if (isShareable(record)) yMap.delete(record.id);
          }
        });
      } finally {
        isApplyingTldrawChanges = false;
      }
    });

    function isShareable(record: any) {
      return ['shape', 'binding', 'asset', 'page', 'document'].includes(record?.typeName);
    }

    // 4. Socket.io Transport Logic for Yjs
    const handleYjsUpdate = (payload: { boardId: string; update: ArrayBuffer }) => {
      if (payload.boardId === boardId) {
        Y.applyUpdate(yDoc, new Uint8Array(payload.update));
      }
    };

    socket.on('board:yjs:update', handleYjsUpdate);

    yDoc.on('update', (update: Uint8Array) => {
      socket.emit('board:yjs:update', { boardId, update });
    });

    // Sync Protocol Step 2: Receive missing updates from server
    socket.on('board:yjs:sync-step-2', (payload: { boardId: string; update: ArrayBuffer }) => {
      if (payload.boardId === boardId) {
        Y.applyUpdate(yDoc, new Uint8Array(payload.update));
        setStoreWithStatus(prev => {
          const role = 'role' in prev ? prev.role : undefined;
          return { status: 'synced-remote', connectionStatus: 'online', store, role };
        });
      }
    });

    // Request snapshot or peer sync
    socket.emit('board:join', { boardId }, (response: any) => {
      if (!response?.success) {
        setStoreWithStatus({ status: 'error', error: new Error('Failed to join board') });
      } else {
        if (response.data?.role) {
          setStoreWithStatus(prev => ({ ...prev, role: response.data.role }));
        }
        // Sync Protocol Step 1: Send our state vector to server
        socket.emit('board:yjs:sync-step-1', { 
          boardId, 
          stateVector: Y.encodeStateVector(yDoc) 
        });
      }
    });

    return () => {
      unlisten();
      socket.off('board:yjs:update', handleYjsUpdate);
      socket.off('board:yjs:sync-step-2');
      socket.emit('board:leave', { boardId });
      yDoc.destroy();
    };
  }, [boardId]);

  return storeWithStatus;
}

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { throttle } from 'tldraw';
import type { TLStore } from 'tldraw';

// member object returned by backend
interface RoomMember {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  cursor?: { x: number; y: number };
}

export function usePresence(boardId: string, store?: TLStore) {
  const { data: user } = useCurrentUser();
  const [members, setMembers] = useState<Record<string, RoomMember>>({});

  useEffect(() => {
    if (!store || !user) return;

    // Receive presence snapshot on join
    const handlePresenceSnapshot = (payload: { boardId: string; members: Record<string, RoomMember> }) => {
      if (payload.boardId === boardId) {
        setMembers(payload.members);
      }
    };

    const handlePresenceJoined = (payload: { boardId: string; member: RoomMember }) => {
      if (payload.boardId === boardId) {
        setMembers((prev) => ({ ...prev, [payload.member.userId]: payload.member }));
      }
    };

    const handlePresenceLeft = (payload: { boardId: string; userId: string; members: Record<string, RoomMember> }) => {
      if (payload.boardId === boardId) {
        setMembers(payload.members);
        // Remove their presence from tldraw store
        store.remove([`instance_presence:${payload.userId}` as any]);
      }
    };

    const handleCursorUpdate = (payload: { boardId: string; member: RoomMember }) => {
      if (payload.boardId === boardId) {
        setMembers((prev) => ({ ...prev, [payload.member.userId]: payload.member }));
        
        // Update tldraw presence
        if (payload.member.cursor) {
          store.put([{
            id: `instance_presence:${payload.member.userId}`,
            typeName: 'instance_presence',
            userId: payload.member.userId,
            userName: payload.member.name,
            lastActivityTimestamp: Date.now(),
            cursor: { x: payload.member.cursor.x, y: payload.member.cursor.y, type: 'default', rotation: 0 },
            color: '#FF0000', // could hash userId to color
            camera: { x: 0, y: 0, z: 1 },
            selectedShapeIds: [],
            currentPageId: (store.get('document:document' as any) as any)?.currentPageId || 'page:page' as any,
          } as any]);
        }
      }
    };

    socket.on('board:presence:snapshot', handlePresenceSnapshot);
    socket.on('board:presence:joined', handlePresenceJoined);
    socket.on('board:presence:left', handlePresenceLeft);
    socket.on('board:cursor', handleCursorUpdate);

    // Throttle cursor emit to save network bandwidth
    const emitCursor = throttle((x: number, y: number) => {
      socket.emit('board:cursor', { boardId, x, y });
    }, 50);

    const unlisten = store.listen((update) => {
      if (update.source === 'user') {
        for (const record of Object.values(update.changes.updated)) {
          if ((record as any)[1].typeName === 'instance' && (record as any)[1].cursor) {
            const cursor = (record as any)[1].cursor;
            emitCursor(cursor.x, cursor.y);
          }
        }
      }
    });

    return () => {
      socket.off('board:presence:snapshot', handlePresenceSnapshot);
      socket.off('board:presence:joined', handlePresenceJoined);
      socket.off('board:presence:left', handlePresenceLeft);
      socket.off('board:cursor', handleCursorUpdate);
      unlisten();
    };
  }, [boardId, store, user]);

  return members;
}

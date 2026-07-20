import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { throttle, InstancePresenceRecordType } from 'tldraw';
import type { TLStore } from 'tldraw';

// member object returned by backend
interface RoomMember {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  ephemeralState?: any;
}

export function usePresence(boardId: string, store?: TLStore) {
  const { data: user } = useCurrentUser();
  const [members, setMembers] = useState<Record<string, RoomMember>>({});

  useEffect(() => {
    if (!user) return;

    // Receive presence snapshot on join
    const handlePresenceSnapshot = (payload: { boardId: string; members: RoomMember[] }) => {
      if (payload.boardId === boardId) {
        console.log('Presence initialized');
        const membersRecord = payload.members.reduce((acc, member) => {
          acc[member.userId] = member;
          return acc;
        }, {} as Record<string, RoomMember>);
        setMembers(membersRecord);
      }
    };

    const handlePresenceJoined = (payload: { boardId: string; member: RoomMember }) => {
      if (payload.boardId === boardId) {
        setMembers((prev) => ({ ...prev, [payload.member.userId]: payload.member }));
      }
    };

    const handlePresenceLeft = (payload: { boardId: string; userId: string; members: RoomMember[] }) => {
      if (payload.boardId === boardId) {
        const membersRecord = payload.members.reduce((acc, member) => {
          acc[member.userId] = member;
          return acc;
        }, {} as Record<string, RoomMember>);
        setMembers(membersRecord);
        // Remove their presence from tldraw store
        if (store) {
          store.remove([`instance_presence:${payload.userId}` as any]);
        }
      }
    };

    const handleEphemeralUpdate = (payload: { boardId: string; member: RoomMember }) => {
      if (payload.boardId === boardId) {
        // Update tldraw presence
        if (store && payload.member.ephemeralState) {
          // Simple string hash to generate a consistent color per user
          let hash = 0;
          for (let i = 0; i < payload.member.userId.length; i++) {
            hash = payload.member.userId.charCodeAt(i) + ((hash << 5) - hash);
          }
          const color = `hsl(${Math.abs(hash) % 360}, 80%, 50%)`;

          const eph = payload.member.ephemeralState;

          const rawCursor = eph.cursor;
          const cursor = rawCursor && typeof rawCursor.x === 'number' && typeof rawCursor.y === 'number'
            ? { x: rawCursor.x, y: rawCursor.y, type: rawCursor.type || 'default', rotation: rawCursor.rotation || 0 }
            : { x: 0, y: 0, type: 'default', rotation: 0 };

          const rawCamera = eph.camera;
          const camera = rawCamera && typeof rawCamera.x === 'number' && typeof rawCamera.y === 'number' && typeof rawCamera.z === 'number'
            ? { x: rawCamera.x, y: rawCamera.y, z: rawCamera.z }
            : { x: 0, y: 0, z: 1 };

          const rawBounds = eph.screenBounds;
          const screenBounds = rawBounds && typeof rawBounds.x === 'number' && typeof rawBounds.y === 'number' && typeof rawBounds.w === 'number' && typeof rawBounds.h === 'number'
            ? { x: rawBounds.x, y: rawBounds.y, w: rawBounds.w, h: rawBounds.h }
            : { x: 0, y: 0, w: 1000, h: 1000 };

          try {
            store.put([
              InstancePresenceRecordType.create({
                id: `instance_presence:${payload.member.userId}` as any,
                userId: `user:${payload.member.userId}` as any,
                userName: payload.member.name,
                lastActivityTimestamp: Date.now(),
                color: color,
                camera: camera,
                cursor: cursor,
                screenBounds: screenBounds,
                selectedShapeIds: Array.isArray(eph.selectedShapeIds) ? eph.selectedShapeIds : [],
                currentPageId: typeof eph.currentPageId === 'string' ? eph.currentPageId : 'page:page',
                brush: eph.brush || null,
                scribbles: Array.isArray(eph.scribbles) ? eph.scribbles : [],
                chatMessage: typeof eph.chatMessage === 'string' ? eph.chatMessage : '',
                followingUserId: typeof eph.followingUserId === 'string' ? eph.followingUserId : null,
              })
            ]);
          } catch (e) {
            console.error('Failed to create presence:', e);
          }
        }
      }
    };

    socket.on('board:presence:snapshot', handlePresenceSnapshot);
    socket.on('board:presence:joined', handlePresenceJoined);
    socket.on('board:presence:left', handlePresenceLeft);
    socket.on('board:ephemeral', handleEphemeralUpdate);

    // Throttle state emit to save network bandwidth
    const emitEphemeralState = throttle((state: any) => {
      socket.emit('board:ephemeral', { boardId, state });
    }, 50);

    let unlisten: (() => void) | undefined;
    if (store) {
      unlisten = store.listen((update) => {
        if (update.source === 'user') {
          let shouldEmit = false;
          for (const record of Object.values(update.changes.updated)) {
            const typeName = (record as any)[1]?.typeName;
            if (typeName === 'instance' || typeName === 'camera' || typeName === 'instance_page_state' || typeName === 'pointer') {
              shouldEmit = true;
              break;
            }
          }

          if (shouldEmit) {
            const instance = store.get('instance:instance' as any) as any;
            if (!instance) return;

            const pageId = instance.currentPageId;
            const camera = store.get(`camera:${pageId}` as any) as any;
            const pageState = store.get(`instance_page_state:${pageId}` as any) as any;
            const pointer = store.get('pointer:pointer' as any) as any;

            const cursorCoords = pointer ? { x: pointer.x, y: pointer.y } : instance.cursor;

            emitEphemeralState({
              cursor: cursorCoords ? { ...instance.cursor, x: cursorCoords.x, y: cursorCoords.y } : undefined,
              scribbles: instance.scribbles,
              brush: instance.brush,
              chatMessage: instance.chatMessage,
              camera: camera ? { x: camera.x, y: camera.y, z: camera.z } : undefined,
              currentPageId: pageId,
              selectedShapeIds: pageState?.selectedShapeIds || [],
              screenBounds: instance.screenBounds,
              followingUserId: instance.followingUserId,
            });

          }
        }
      });
    }

    return () => {
      socket.off('board:presence:snapshot', handlePresenceSnapshot);
      socket.off('board:presence:joined', handlePresenceJoined);
      socket.off('board:presence:left', handlePresenceLeft);
      socket.off('board:ephemeral', handleEphemeralUpdate);
      if (unlisten) unlisten();
    };
  }, [boardId, store, user]);

  return members;
}

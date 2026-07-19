import { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '@/lib/socket';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';

export function useVoiceRoom(boardId: string) {
  const { data: user } = useCurrentUser();
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peers, setPeers] = useState<string[]>([]); // User IDs in voice
  
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Helper to create a new RTCPeerConnection
  const createPeer = useCallback((peerId: string, initiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice:ice-candidate', {
          boardId,
          targetUserId: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      // Create an audio element for the remote peer
      let audio = remoteAudioRefs.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
    };

    if (initiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit('voice:offer', {
          boardId,
          targetUserId: peerId,
          offer,
        });
      });
    }

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [boardId]);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      
      socket.emit('voice:join', { boardId }, (response: any) => {
        if (response?.success && response.data?.users) {
          // Initiator logic: we joined, so we offer to everyone already in the room
          const usersInRoom: string[] = response.data.users.filter((id: string) => id !== user?.id);
          setPeers(usersInRoom);
          usersInRoom.forEach((peerId) => {
            createPeer(peerId, true);
          });
          setInVoice(true);
        }
      });
    } catch (err) {
      console.error('Failed to join voice:', err);
    }
  };

  const leaveVoice = () => {
    socket.emit('voice:leave', { boardId });
    setInVoice(false);
    setPeers([]);

    // Stop local mic
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }

    // Close all connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    remoteAudioRefs.current.clear();
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    const handleUserJoined = (payload: { boardId: string; userId: string }) => {
      if (payload.boardId === boardId && payload.userId !== user.id) {
        setPeers((prev) => [...prev, payload.userId]);
        // The newly joined user will send the offer, we just wait for it.
      }
    };

    const handleUserLeft = (payload: { boardId: string; userId: string }) => {
      if (payload.boardId === boardId) {
        setPeers((prev) => prev.filter((id) => id !== payload.userId));
        const pc = peerConnections.current.get(payload.userId);
        if (pc) {
          pc.close();
          peerConnections.current.delete(payload.userId);
        }
        const audio = remoteAudioRefs.current.get(payload.userId);
        if (audio) {
          audio.srcObject = null;
          remoteAudioRefs.current.delete(payload.userId);
        }
      }
    };

    const handleOffer = async (payload: { boardId: string; fromUserId: string; offer: any }) => {
      if (payload.boardId === boardId && inVoice) {
        let pc = peerConnections.current.get(payload.fromUserId);
        if (!pc) {
          pc = createPeer(payload.fromUserId, false);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('voice:answer', {
          boardId,
          targetUserId: payload.fromUserId,
          answer,
        });
      }
    };

    const handleAnswer = async (payload: { boardId: string; fromUserId: string; answer: any }) => {
      if (payload.boardId === boardId && inVoice) {
        const pc = peerConnections.current.get(payload.fromUserId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      }
    };

    const handleIceCandidate = async (payload: { boardId: string; fromUserId: string; candidate: any }) => {
      if (payload.boardId === boardId && inVoice) {
        const pc = peerConnections.current.get(payload.fromUserId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      }
    };

    socket.on('voice:joined', handleUserJoined);
    socket.on('voice:left', handleUserLeft);
    socket.on('voice:offer', handleOffer);
    socket.on('voice:answer', handleAnswer);
    socket.on('voice:ice-candidate', handleIceCandidate);

    return () => {
      socket.off('voice:joined', handleUserJoined);
      socket.off('voice:left', handleUserLeft);
      socket.off('voice:offer', handleOffer);
      socket.off('voice:answer', handleAnswer);
      socket.off('voice:ice-candidate', handleIceCandidate);
    };
  }, [boardId, user, inVoice, createPeer]);

  // Clean up on unmount
  useEffect(() => {
    return () => leaveVoice();
  }, []);

  return {
    inVoice,
    isMuted,
    peers,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}

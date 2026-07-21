import { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '@/lib/socket';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';

export function useVoiceRoom(boardId: string) {
  const { data: user } = useCurrentUser();
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peers, setPeers] = useState<string[]>([]); // User IDs in voice
  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set());
  
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const monitorFrames = useRef<Map<string, number>>(new Map());

  const startMonitoring = useCallback((peerId: string, stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const audioCtx = audioContextRef.current;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    
    const mediaStream = new MediaStream([audioTrack]);
    const source = audioCtx.createMediaStreamSource(mediaStream);
    const analyser = audioCtx.createAnalyser();
    
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      const isSpeaking = average > 10;
      
      setSpeakingPeers((prev) => {
        const next = new Set(prev);
        if (isSpeaking && !next.has(peerId)) {
          next.add(peerId);
          return next;
        } else if (!isSpeaking && next.has(peerId)) {
          next.delete(peerId);
          return next;
        }
        return prev;
      });

      monitorFrames.current.set(peerId, requestAnimationFrame(checkVolume));
    };
    
    checkVolume();
  }, []);

  const stopMonitoring = useCallback((peerId: string) => {
    const frame = monitorFrames.current.get(peerId);
    if (frame) {
      cancelAnimationFrame(frame);
      monitorFrames.current.delete(peerId);
    }
    setSpeakingPeers((prev) => {
      const next = new Set(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

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
      
      startMonitoring(peerId, event.streams[0]);
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
  }, [boardId, startMonitoring]);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      
      if (user) startMonitoring(user.id, stream);
      
      socket.emit('voice:join', { boardId });
    } catch (err) {
      console.error('Failed to join voice:', err);
    }
  };

  const leaveVoice = useCallback(() => {
    socket.emit('voice:leave', { boardId });
    setInVoice(false);
    setPeers([]);

    // Stop local mic
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    
    if (user) stopMonitoring(user.id);
    monitorFrames.current.forEach(frame => cancelAnimationFrame(frame));
    monitorFrames.current.clear();
    setSpeakingPeers(new Set());
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Close all connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    // Stop remote audio elements
    remoteAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.removeAttribute('srcObject');
    });
    remoteAudioRefs.current.clear();
  }, [boardId, user, stopMonitoring]);

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

    const handleUserJoined = (payload: { boardId: string; userId: string; participants: Array<{ userId: string }> }) => {
      if (payload.boardId === boardId) {
        if (payload.userId === user.id) {
          const usersInRoom = payload.participants.map(p => p.userId).filter(id => id !== user.id);
          setPeers(usersInRoom);
          usersInRoom.forEach((peerId) => {
            createPeer(peerId, true);
          });
          setInVoice(true);
        } else {
          setPeers((prev) => [...prev, payload.userId]);
        }
      }
    };

    const handleUserLeft = (payload: { boardId: string; userId: string }) => {
      if (payload.boardId === boardId) {
        setPeers((prev) => prev.filter((id) => id !== payload.userId));
        stopMonitoring(payload.userId);
        
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
  }, [boardId, user, inVoice, createPeer, stopMonitoring]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  return {
    inVoice,
    isMuted,
    peers,
    speakingPeers,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}

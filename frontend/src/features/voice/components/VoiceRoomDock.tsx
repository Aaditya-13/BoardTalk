import { Mic, MicOff, Phone, PhoneOff, Radio } from 'lucide-react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { cn } from '@/utils/cn';

interface RoomMember {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

interface VoiceRoomDockProps {
  boardId: string;
  presenceMembers: Record<string, RoomMember>;
}

function MemberAvatar({ member, isMuted = false, isLocal = false, isSpeaking = false }: {
  member: { userId: string; name: string; avatarUrl: string | null };
  isMuted?: boolean;
  isLocal?: boolean;
  isSpeaking?: boolean;
}) {
  let hash = 0;
  for (let i = 0; i < member.userId.length; i++) {
    hash = member.userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;

  return (
    <div className="relative shrink-0">
      <div
        className={cn("w-8 h-8 rounded-full overflow-hidden border-2 shadow-sm transition-all duration-200", isSpeaking ? "ring-2 ring-emerald-500 ring-offset-1 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-105" : "")}
        style={{ borderColor: isSpeaking ? undefined : (isLocal ? '#7c5cfc' : color) }}
      >
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="text-xs font-bold text-white w-full h-full flex items-center justify-center"
            style={{ background: color }}
          >
            {member.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {isMuted && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-background">
          <MicOff className="h-2 w-2 text-white" />
        </div>
      )}
    </div>
  );
}

export function VoiceRoomDock({ boardId, presenceMembers }: VoiceRoomDockProps) {
  const { data: user } = useCurrentUser();
  const { inVoice, isMuted, peers, speakingPeers, joinVoice, leaveVoice, toggleMute } = useVoiceRoom(boardId);

  const voiceMembers = peers.map((id) => presenceMembers[id]).filter(Boolean);

  if (!inVoice) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Voice Channel</span>
        </div>
        <button
          onClick={joinVoice}
          className={cn(
            'flex items-center justify-center gap-2 w-full',
            'bg-primary hover:bg-primary/90 text-primary-foreground',
            'text-sm font-semibold px-4 py-2 rounded-lg',
            'transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0'
          )}
        >
          <Phone className="h-3.5 w-3.5" />
          Join Voice
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Live
          </span>
          <span className="text-xs text-muted-foreground">
            · {voiceMembers.length + 1} participant{voiceMembers.length !== 0 ? 's' : ''}
          </span>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center bt-transition',
              isMuted
                ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={leaveVoice}
            title="Disconnect"
            className="w-7 h-7 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 flex items-center justify-center bt-transition"
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {user && (
          <div className="flex items-center gap-1.5">
            <MemberAvatar
              member={{
                userId: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
              }}
              isMuted={isMuted}
              isLocal
              isSpeaking={speakingPeers.has(user.id)}
            />
            <span className="text-xs text-muted-foreground">You</span>
          </div>
        )}
        {voiceMembers.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-1"
          >
            <MemberAvatar member={member} isSpeaking={speakingPeers.has(member.userId)} />
            <span className="text-xs text-muted-foreground truncate max-w-[72px]">{member.name}</span>
          </div>
        ))}
        {voiceMembers.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Just you</span>
        )}
      </div>
    </div>
  );
}

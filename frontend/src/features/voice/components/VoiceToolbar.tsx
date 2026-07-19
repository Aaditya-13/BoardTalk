import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

export function VoiceToolbar({ boardId }: { boardId: string }) {
  const { inVoice, isMuted, peers, joinVoice, leaveVoice, toggleMute } = useVoiceRoom(boardId);

  return (
    <div className="absolute top-4 right-4 z-[300] bg-background/80 backdrop-blur-sm p-1.5 rounded-xl border shadow-sm flex items-center gap-2">
      {inVoice && (
        <div className="px-2 text-xs font-medium text-muted-foreground border-r flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {peers.length} other{peers.length !== 1 ? 's' : ''} in voice
        </div>
      )}
      
      {!inVoice ? (
        <Button onClick={joinVoice} variant="default" size="sm" className="h-8 gap-2 bg-green-600 hover:bg-green-700">
          <Phone className="h-3.5 w-3.5" />
          Join Voice
        </Button>
      ) : (
        <>
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "secondary"}
            size="sm"
            className="h-8 w-8 p-0"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </Button>
          <Button
            onClick={leaveVoice}
            variant="destructive"
            size="sm"
            className="h-8 gap-2"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            Leave
          </Button>
        </>
      )}
    </div>
  );
}

import { useMemo } from 'react';

interface RoomMember {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

interface PresenceDockProps {
  members: Record<string, RoomMember>;
  currentUserId?: string;
  onAvatarClick?: (userId: string) => void;
}

export function PresenceDock({ members, currentUserId, onAvatarClick }: PresenceDockProps) {
  const activeUsers = useMemo(() => {
    return Object.values(members).filter((m) => m.userId !== currentUserId);
  }, [members, currentUserId]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2 mr-2">
      {activeUsers.slice(0, 5).map((member) => {
        // Generate same color as cursor
        let hash = 0;
        for (let i = 0; i < member.userId.length; i++) {
          hash = member.userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 80%, 50%)`;

        return (
          <div
            key={member.userId}
            onClick={() => onAvatarClick?.(member.userId)}
            title={member.name}
            className="w-8 h-8 rounded-full border-2 overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 cursor-pointer hover:-translate-y-1 hover:z-10 transition-transform relative z-0"
            style={{ borderColor: color }}
          >
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white uppercase drop-shadow-md" style={{ backgroundColor: color, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {member.name.charAt(0)}
              </span>
            )}
          </div>
        );
      })}
      {activeUsers.length > 5 && (
        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-600 dark:text-zinc-300 z-0">
          +{activeUsers.length - 5}
        </div>
      )}
    </div>
  );
}

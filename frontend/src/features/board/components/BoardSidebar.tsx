import { useUIStore, type SidebarTab } from '@/stores/uiStore';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { AISidebar } from '@/features/ai/components/AISidebar';
import { VoiceRoomDock } from '@/features/voice/components/VoiceRoomDock';
import { MessageSquare, Sparkles, Users, MessageCircle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

import { type TLStore, type Editor } from 'tldraw';

interface RoomMember {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

interface BoardSidebarProps {
  boardId: string;
  presenceMembers: Record<string, RoomMember>;
  currentUserId?: string;
  store: TLStore;
  editor: Editor | null;
}

interface TabConfig {
  id: SidebarTab;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'users', icon: Users, label: 'People' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'ai', icon: Sparkles, label: 'Ask AI' },
  { id: 'comments', icon: MessageCircle, label: 'Comments' },
];

function UsersList({ members, currentUserId }: { members: Record<string, RoomMember>; currentUserId?: string }) {
  const allMembers = Object.values(members);
  const me = allMembers.find((member) => member.userId === currentUserId);
  const others = allMembers.filter((member) => member.userId !== currentUserId);

  const renderMember = (member: RoomMember, isMe = false) => {
    let hash = 0;
    for (let i = 0; i < member.userId.length; i++) hash = member.userId.charCodeAt(i) + ((hash << 5) - hash);
    const color = `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;

    return (
      <div key={member.userId} className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-white/5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2" style={{ borderColor: color }}>
          {member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" /> : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
              {member.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{isMe ? `${member.name} (you)` : member.name}</p>
          {member.email && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
        </div>
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <p className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Online — {allMembers.length}</p>
      <div className="flex flex-col gap-0.5 px-2">
        {me && renderMember(me, true)}
        {others.map((member) => renderMember(member))}
        {allMembers.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No one else is here yet.</p>}
      </div>
    </div>
  );
}

function CommentsStub() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">Comments are coming soon</p>
      <p className="text-xs text-muted-foreground/60">Leave annotations and feedback directly on the canvas.</p>
    </div>
  );
}

export function BoardSidebar({ boardId, presenceMembers, currentUserId, store, editor }: BoardSidebarProps) {
  const { isSidebarOpen, activeSidebarTab, setActiveSidebarTab, setActivePanel } = useUIStore();

  const handleTabClick = (tab: SidebarTab) => {
    if (activeSidebarTab === tab && isSidebarOpen) setActivePanel(null);
    else setActiveSidebarTab(tab);
  };

  return (
    <aside
      aria-label="Board tools"
      className={cn(
        'absolute bottom-4 right-4 top-[72px] z-[400] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden',
        'rounded-2xl border border-[var(--bt-panel-border)] bg-[var(--bt-panel-bg)] shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl',
        'transition-all duration-200 ease-out',
        isSidebarOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-5 opacity-0'
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--bt-panel-border)] px-4">
        <div className="flex items-center gap-1">
          {TABS.map(({ id, icon: Icon, label }) => {
            const isActive = activeSidebarTab === id;
            return (
              <button key={id} onClick={() => handleTabClick(id)} title={label} className={cn(
                'flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors',
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setActivePanel(null)} className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" title="Close panel">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeSidebarTab === 'users' && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-[var(--bt-panel-border)] p-3"><VoiceRoomDock boardId={boardId} presenceMembers={presenceMembers} /></div>
            <div className="min-h-0 flex-1 overflow-y-auto"><UsersList members={presenceMembers} currentUserId={currentUserId} /></div>
          </div>
        )}
        {activeSidebarTab === 'chat' && <ChatSidebar boardId={boardId} />}
        {activeSidebarTab === 'ai' && <AISidebar boardId={boardId} store={store} editor={editor} />}
        {activeSidebarTab === 'comments' && <CommentsStub />}
      </div>
    </aside>
  );
}

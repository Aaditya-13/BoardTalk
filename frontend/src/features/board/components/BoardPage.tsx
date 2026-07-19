import { useParams } from 'react-router';
import { useBoard } from '../hooks/useBoards';
import { useBoardSync } from '../hooks/useBoardSync';
import { usePresence } from '../hooks/usePresence';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { AISidebar } from '@/features/ai/components/AISidebar';
import { VoiceToolbar } from '@/features/voice/components/VoiceToolbar';
import { Loader2, MessageSquare, Sparkles, MessageCircle } from 'lucide-react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading: isBoardLoading, isError } = useBoard(boardId!);
  const storeWithStatus = useBoardSync(boardId!);
  const { activePanel, setActivePanel, isSidebarOpen } = useUIStore();

  // Call usePresence to sync cursors (pass store when ready)
  usePresence(boardId!, storeWithStatus.status === 'synced-remote' ? storeWithStatus.store : undefined);

  if (isBoardLoading || storeWithStatus.status === 'loading') {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !board || storeWithStatus.status === 'error') {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-xl font-medium mb-2">Board not found</h3>
          <p className="text-muted-foreground">The board may have been deleted or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full relative">
      {/* Voice Toolbar (Top Right) */}
      <VoiceToolbar boardId={boardId!} />

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <Tldraw autoFocus store={storeWithStatus.store} />
        
        {/* Floating Panel Toggle Toolbar (placed on right edge) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[300] bg-background/80 backdrop-blur-sm p-2 rounded-xl border shadow-sm">
          <Button
            variant={activePanel === 'chat' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            title="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant={activePanel === 'comments' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}
            title="Comments"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            variant={activePanel === 'ai' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            title="AI Assistant"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar Container */}
      <div
        className={cn(
          "h-full border-l bg-card transition-all duration-300 ease-in-out flex flex-col z-[400]",
          isSidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden border-l-0"
        )}
      >
        <div className="h-14 border-b flex items-center px-4 shrink-0">
          <h3 className="font-semibold capitalize">{activePanel}</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          {activePanel === 'chat' && <ChatSidebar boardId={boardId!} />}
          {activePanel === 'ai' && <AISidebar boardId={boardId!} />}
          {activePanel === 'comments' && <div className="text-muted-foreground p-4">Comments feature coming soon</div>}
        </div>
      </div>
    </div>
  );
}

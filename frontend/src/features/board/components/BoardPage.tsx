import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useBoard, useUpdateBoard } from '../hooks/useBoards';
import { useBoardSync } from '../hooks/useBoardSync';
import { usePresence } from '../hooks/usePresence';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { AISidebar } from '@/features/ai/components/AISidebar';
import { Loader2, MessageSquare, Sparkles, Home, Moon, Sun, Share2 } from 'lucide-react';
import { ShareBoardModal } from './ShareBoardModal';
import { Tldraw, DefaultMainMenu, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { useUIStore } from '@/stores/uiStore';
import { useTheme } from '@/providers/ThemeProvider';
import { cn } from '@/utils/cn';

const CANVAS_COLORS = [
  { name: 'White', value: '#FFFFFF', darkValue: '#000000' },
  { name: 'Offwhite', value: '#FDFBF7', darkValue: '#121212' },
  { name: 'Dark Gray', value: '#2C2C2C', darkValue: '#1A1A1A' },
  { name: 'Light Black', value: '#1A1A1A', darkValue: '#2C2C2C' },
  { name: 'Black', value: '#000000', darkValue: '#FFFFFF' },
];

// Helper component to sync app theme with Tldraw theme
function ThemeSync() {
  const { theme } = useTheme();
  const editor = useEditor();

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    editor.user.updateUserPreferences({ colorScheme: isDark ? 'dark' : 'light' });
  }, [theme, editor]);

  return null;
}

const BoardTitleEditor = ({ boardId, initialTitle }: { boardId: string, initialTitle: string }) => {
  const updateBoard = useUpdateBoard();
  const [title, setTitle] = useState(initialTitle);
  
  const handleSave = () => {
    if (title.trim() && title !== initialTitle) {
      updateBoard.mutate({ boardId, payload: { title: title.trim() } });
    } else {
      setTitle(initialTitle);
    }
  };

  return (
    <input
      id="board-title-input"
      name="boardTitle"
      autoComplete="off"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className="bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-zinc-900 border rounded px-2 h-7 text-sm font-bold text-black/80 dark:text-white/80 w-[120px] transition-all outline-none truncate"
      placeholder="Board title"
    />
  );
};

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { data: board, isLoading: isBoardLoading, isError } = useBoard(boardId!);
  const storeWithStatus = useBoardSync(boardId!);
  const { activePanel, setActivePanel, isSidebarOpen } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [canvasBgIndex, setCanvasBgIndex] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const updateBoard = useUpdateBoard();

  useEffect(() => {
    if (board?.canvasColor) {
      const idx = CANVAS_COLORS.findIndex(c => c.name === board.canvasColor);
      if (idx !== -1) setCanvasBgIndex(idx);
    }
  }, [board?.canvasColor]);

  // Call usePresence to sync cursors
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

  const currentBg = theme === 'dark' 
    ? CANVAS_COLORS[canvasBgIndex].darkValue 
    : CANVAS_COLORS[canvasBgIndex].value;

  // Custom component to override Canvas background
  const CustomBackground = () => {
    return (
      <div style={{ position: 'absolute', inset: 0, backgroundColor: currentBg }} />
    );
  };

  // Custom component for TopPanel (Top left area)
  const CustomMainMenu = () => {
    return (
      <div className="flex items-center pointer-events-auto gap-2">
        <DefaultMainMenu />
        <div className="flex items-center tlui-panel px-2 h-10">
          <button 
            className="tlui-button tlui-button__icon mr-1"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <Home className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-black dark:text-white tracking-tight px-2">BoardTalk</span>
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
          <BoardTitleEditor boardId={boardId!} initialTitle={board.title} />
        </div>
      </div>
    );
  }

  // Custom component for Tldraw's native SharePanel area (renders top-right)
  const CustomSharePanel = () => {
    return (
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Theme Toggle */}
        <div className="flex items-center tlui-panel p-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="tlui-button tlui-button__icon"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Color Pickers */}
        <div className="flex items-center gap-1.5 tlui-panel px-2 py-1.5">
          {CANVAS_COLORS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => {
                setCanvasBgIndex(i);
                updateBoard.mutate({ boardId: boardId!, payload: { canvasColor: c.name } });
              }}
              className={cn(
                "w-6 h-6 rounded-md border border-black/10 transition-all",
                canvasBgIndex === i && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110"
              )}
              style={{ backgroundColor: theme === 'dark' ? c.darkValue : c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* Feature Toggles */}
        <div className="flex items-center gap-1 tlui-panel p-1">
          <button
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            className="tlui-button"
            data-state={activePanel === 'chat' ? 'active' : 'inactive'}
            title="Chat"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="text-sm font-bold">Chat</span>
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
            className="tlui-button"
            data-state={activePanel === 'ai' ? 'active' : 'inactive'}
            title="AI Assistant"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span className="text-sm font-bold">AI</span>
          </button>
        </div>

        {/* Native Share Panel (if we want it, but usually it's just the 'People' dropdown. We can omit it if we use our own collab cursor layer) */}
        {/* <DefaultSharePanel /> */}
        
        <div className="flex items-center tlui-panel p-1 ml-1">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="tlui-button"
            title="Share Workspace"
          >
            <Share2 className="h-4 w-4 mr-2 text-[#00D1FF]" />
            <span className="text-sm font-bold text-[#00D1FF]">Share</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-full relative" style={{ backgroundColor: currentBg }}>
      
      {/* Canvas Area */}
      <div className="flex-1 relative" style={{ backgroundColor: currentBg }}>
        <Tldraw 
          autoFocus 
          store={storeWithStatus.store} 
          components={{
            MainMenu: CustomMainMenu,
            SharePanel: CustomSharePanel,
            Background: CustomBackground
          }}
        >
          <ThemeSync />
        </Tldraw>
      </div>

      {/* Right Sidebar Container */}
      <div
        className={cn(
          "h-full bg-white dark:bg-zinc-950 transition-all duration-300 ease-in-out flex flex-col z-[400] relative border-l border-black/10 dark:border-white/10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]",
          isSidebarOpen ? "w-80 lg:w-96 opacity-100" : "w-0 opacity-0 overflow-hidden border-l-0"
        )}
      >
        <div className="h-14 border-b border-black/5 dark:border-white/5 flex items-center px-6 shrink-0 bg-zinc-50 dark:bg-zinc-900">
          <h3 className="font-extrabold capitalize text-lg text-black dark:text-white">{activePanel}</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          {activePanel === 'chat' && <ChatSidebar boardId={boardId!} />}
          {activePanel === 'ai' && <AISidebar boardId={boardId!} />}
        </div>
      </div>
      
      <ShareBoardModal 
        boardId={boardId!}
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
      />
    </div>
  );
}

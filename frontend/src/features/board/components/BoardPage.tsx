import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useBoard, useUpdateBoard } from '../hooks/useBoards';
import { useYjsStore } from '../hooks/useYjsStore';
import { usePresence } from '../hooks/usePresence';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { BoardSidebar } from './BoardSidebar';
import { ShareBoardModal } from './ShareBoardModal';
import { PresenceDock } from './PresenceDock';
import { Loader2, Moon, Sun, Share2, MessageSquare, MessageCircle, Bot, Undo2, Redo2, Palette, Users, Trash2, Copy, EyeOff, Eye, Code2 } from 'lucide-react';
import {
  Tldraw,
  DefaultMainMenu,
  DefaultStylePanel,
  DefaultToolbar,
  useEditor,
  useValue,
  type Editor
} from 'tldraw';
import 'tldraw/tldraw.css';
import { useUIStore } from '@/stores/uiStore';
import { useTheme } from '@/providers/ThemeProvider';
import { cn } from '@/utils/cn';

const CANVAS_COLORS = [
  { name: 'White', value: '#FFFFFF', darkValue: '#111113' },
  { name: 'Offwhite', value: '#FDFBF7', darkValue: '#16161a' },
  { name: 'Dark Gray', value: '#2C2C2C', darkValue: '#1A1A1A' },
  { name: 'Light Black', value: '#1A1A1A', darkValue: '#232329' },
  { name: 'Black', value: '#000000', darkValue: '#0a0a0c' },
];

// ── Internal helper: syncs Tldraw theme + role ──────────────────────────────
function ThemeAndRoleSync({ role }: { role?: string }) {
  const { theme } = useTheme();
  const editor = useEditor();

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    editor.user.updateUserPreferences({ colorScheme: isDark ? 'dark' : 'light' });
  }, [theme, editor]);

  useEffect(() => {
    if (role === 'VIEWER' || role === 'COMMENTER') {
      editor.updateInstanceState({ isReadonly: true });
    } else {
      editor.updateInstanceState({ isReadonly: false });
    }
  }, [role, editor]);

  return null;
}

// ── Custom Actions component (used in Top Header) ────────────────────────────
function EditorActions() {
  const editor = useEditor();
  const zoomPercent = useValue('zoom', () => Math.round(editor.getZoomLevel() * 100), [editor]);
  const canUndo = useValue('canUndo', () => editor.getCanUndo(), [editor]);
  const canRedo = useValue('canRedo', () => editor.getCanRedo(), [editor]);
  const hasSelection = useValue('hasSelection', () => editor.getSelectedShapeIds().length > 0, [editor]);

  return (
    <div className="flex items-center gap-1 text-muted-foreground bg-black/5 dark:bg-white/5 rounded-xl p-1">
      {/* Zoom */}
      <div className="flex items-center gap-0.5 px-2 text-xs font-semibold select-none border-r border-border/50 mr-1">
        <button onClick={() => editor.zoomOut()} className="hover:text-foreground w-5 h-5 flex items-center justify-center rounded transition-colors">-</button>
        <span onClick={() => editor.resetZoom()} className="w-10 text-center cursor-pointer hover:text-foreground transition-colors">{zoomPercent}%</span>
        <button onClick={() => editor.zoomIn()} className="hover:text-foreground w-5 h-5 flex items-center justify-center rounded transition-colors">+</button>
      </div>

      <button onClick={() => editor.undo()} disabled={!canUndo} title="Undo (Ctrl+Z)" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground disabled:opacity-30 bt-transition">
        <Undo2 className="h-4 w-4" />
      </button>
      <button onClick={() => editor.redo()} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground disabled:opacity-30 bt-transition">
        <Redo2 className="h-4 w-4" />
      </button>

      <div className="w-px h-4 bg-border/50 mx-1" />

      <button onClick={() => editor.duplicateShapes(editor.getSelectedShapeIds())} disabled={!hasSelection} title="Duplicate" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground disabled:opacity-30 bt-transition">
        <Copy className="h-4 w-4" />
      </button>
      <button onClick={() => editor.deleteShapes(editor.getSelectedShapeIds())} disabled={!hasSelection} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 bt-transition">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Board title inline editor ───────────────────────────────────────────────
function BoardTitleEditor({ boardId, initialTitle }: { boardId: string; initialTitle: string }) {
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
    <div className="flex items-center gap-1 group">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="bg-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-zinc-900 border border-transparent focus:border-border rounded-lg px-2 h-8 text-sm font-semibold text-foreground w-[160px] transition-all outline-none truncate placeholder:text-muted-foreground"
        placeholder="Project Name"
      />
    </div>
  );
}

// ── The Unified Top Header ──────────────────────────────────────────────────
function TopHeader({
  board,
  boardId,
  myId,
  presenceMembers,
  canvasBgIndex,
  setCanvasBgIndex,
  onShareClick,
}: {
  board: any;
  boardId: string;
  myId?: string;
  presenceMembers: any;
  canvasBgIndex: number;
  setCanvasBgIndex: (idx: number) => void;
  onShareClick: () => void;
}) {
  const navigate = useNavigate();
  const { activeSidebarTab, setActiveSidebarTab, isSidebarOpen } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const isDark = theme === 'dark';
  const updateBoard = useUpdateBoard();

  return (
    <header className="absolute top-0 left-0 right-0 h-[60px] shrink-0 bg-[var(--bt-panel-bg)] border-b border-[var(--bt-panel-border)] shadow-sm px-4 flex items-center justify-between z-[500] pointer-events-auto select-none">
      {/* LEFT: Branding & Title & Menu */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-3">
          <div className="bt-main-menu-trigger pointer-events-auto relative">
            <DefaultMainMenu />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Code2 className="h-5 w-5 text-foreground opacity-80" />
            </div>
          </div>
          <span onClick={() => navigate('/dashboard')} className="font-heading font-bold text-[18px] tracking-tight text-foreground cursor-pointer hover:opacity-80 transition-opacity">
            BoardTalk
          </span>
          <div className="w-px h-5 bg-border/60 mx-1" />
          <BoardTitleEditor boardId={boardId} initialTitle={board.title} />
        </div>
      </div>

      {/* CENTER: Main Collaboration Tools */}
      <div className="flex items-center gap-1.5 justify-center flex-1">
        {/* Presence Avatars */}
        <button onClick={() => setActiveSidebarTab('users')} className="mr-2 flex items-center rounded-xl px-1.5 py-1 transition-transform hover:scale-105 hover:bg-muted/80" title="View collaborators">
          {Object.keys(presenceMembers).length > 0 ? <PresenceDock members={presenceMembers} currentUserId={myId} /> : <Users className="h-4 w-4 text-muted-foreground" />}
        </button>

        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Action Toggles */}
        <button onClick={() => setActiveSidebarTab('chat')} className={cn("w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors", isSidebarOpen && activeSidebarTab === 'chat' && "bg-primary/10 text-primary")} title="Chat"><MessageSquare className="h-[18px] w-[18px]" /></button>
        <button onClick={() => setActiveSidebarTab('ai')} className={cn("w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors", isSidebarOpen && activeSidebarTab === 'ai' && "bg-primary/10 text-primary")} title="AI Assistant"><Bot className="h-[18px] w-[18px]" /></button>
        <button onClick={() => setActiveSidebarTab('comments')} className={cn("w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors", isSidebarOpen && activeSidebarTab === 'comments' && "bg-primary/10 text-primary")} title="Comments"><MessageCircle className="h-[18px] w-[18px]" /></button>

        {/* Appearance Palette */}
        <div className="relative">
          <button onClick={() => setIsAppearanceOpen((o) => !o)} className={cn("w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors", isAppearanceOpen && "bg-primary/10 text-primary")} title="Canvas appearance">
            <Palette className="h-[18px] w-[18px]" />
          </button>
          {isAppearanceOpen && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-[var(--bt-panel-border)] bg-[var(--bt-panel-bg)] p-3 shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-1 pb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Canvas color</p>
              <div className="grid grid-cols-5 gap-2">
                {CANVAS_COLORS.map((c, i) => (
                  <button key={c.name} onClick={() => { setCanvasBgIndex(i); updateBoard.mutate({ boardId, payload: { canvasColor: c.name } }); }} className={cn('h-6 w-6 rounded-full border border-black/10 dark:border-white/10 transition-transform hover:scale-110', canvasBgIndex === i && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-[var(--bt-panel-bg)]')} style={{ backgroundColor: c.value }} title={c.name} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button onClick={() => {
          const newIsDark = !isDark;
          setTheme(newIsDark ? 'dark' : 'light');

          // Vice versa: auto-switch canvas color to match the manually selected theme
          const newBgIndex = newIsDark ? 2 : 1; // 2 = Dark Gray, 1 = Offwhite
          setCanvasBgIndex(newBgIndex);
          updateBoard.mutate({ boardId, payload: { canvasColor: CANVAS_COLORS[newBgIndex].name } });
        }} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors" title="Toggle Theme">
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {/* RIGHT: Tldraw Actions & Share */}
      <div className="flex items-center gap-3 justify-end flex-1 pointer-events-auto">
        <EditorActions />
        <button onClick={onShareClick} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-[11px] uppercase tracking-wider px-5 h-9 rounded-xl flex items-center gap-2 shadow-[0_2px_10px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_4px_16px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ml-2">
          <Share2 className="h-3.5 w-3.5" /> SHARE
        </button>
      </div>
    </header>
  );
}

// ── Collapsible Bottom Dock Toolbar ──────────────────────────────────────────
const BottomDockToolbar = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto flex items-center gap-2">
      {/* Tldraw's native toolbar, no longer restricted by our heavy wrapper */}
      <div className={cn("transition-all duration-300 ease-out origin-bottom", isMinimized ? "opacity-0 scale-95 pointer-events-none w-0 overflow-hidden" : "opacity-100 scale-100")}>
        <DefaultToolbar />
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsMinimized(prev => !prev)}
        title={isMinimized ? "Show Toolbar" : "Hide Toolbar"}
        className={cn("w-10 h-10 flex items-center justify-center rounded-full bt-glass border border-[var(--bt-panel-border)] text-muted-foreground hover:text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 shrink-0", isMinimized && "bg-primary/20 text-primary border-primary/30")}
      >
        {isMinimized ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
};

// ── Tldraw Override Components ──────────────────────────────────────────────
const components = {
  MainMenu: () => null, // We have a custom unified header
  PageMenu: () => null,
  ActionsMenu: () => null,
  ZoomMenu: () => null,
  SharePanel: () => null,
  Toolbar: BottomDockToolbar,
  StylePanel: () => (
    <div className="bt-style-panel-wrapper absolute top-[80px] left-4 z-[300] pointer-events-auto shadow-2xl">
      <DefaultStylePanel />
    </div>
  ),
};

// ── Main export ──────────────────────────────────────────────────────────────
export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading: isBoardLoading, isError } = useBoard(boardId!);
  const storeWithStatus = useYjsStore(boardId!);
  const { setTheme } = useTheme();
  const [canvasBgIndex, setCanvasBgIndex] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  // Auto-toggle theme based on canvas color selection
  useEffect(() => {
    if (canvasBgIndex >= 2) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [canvasBgIndex, setTheme]);

  useEffect(() => {
    if (board?.canvasColor) {
      const idx = CANVAS_COLORS.findIndex((c) => c.name === board.canvasColor);
      if (idx !== -1) setCanvasBgIndex(idx);
    }
  }, [board?.canvasColor]);

  const { data: user } = useCurrentUser();
  const presenceMembers = usePresence(
    boardId!,
    storeWithStatus.status === 'synced-remote' ? storeWithStatus.store : undefined
  );

  const currentBg = board ? CANVAS_COLORS[canvasBgIndex].value : '#FFFFFF';

  // Custom solid background (rendered inside Tldraw)
  const CustomBackground = useCallback(() => (
    <div
      className="bt-board-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: currentBg,
      }}
    />
  ), [currentBg]);

  const tldrawComponents = useMemo(() => ({
    ...components,
    Background: CustomBackground
  }), [CustomBackground]);

  if (isBoardLoading || storeWithStatus.status === 'loading') {
    return <div className="flex-1 w-full h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (isError || !board || storeWithStatus.status === 'error') {
    return (
      <div className="flex-1 w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h3 className="text-xl font-medium mb-2">Board not found</h3>
          <p className="text-muted-foreground">The board may have been deleted or you don't have access.</p>
        </div>
      </div>
    );
  }

  const role = 'role' in storeWithStatus ? storeWithStatus.role : undefined;
  const myId = user?.id;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* ── Canvas area takes remaining height ── */}
      <div className="flex-1 relative" style={{ backgroundColor: currentBg }}>
        <Tldraw
          autoFocus
          store={storeWithStatus.store}
          components={tldrawComponents}
          onMount={setEditor}
          licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
        >
          {storeWithStatus.status === 'synced-remote' && (
            <TopHeader
              board={board}
              boardId={boardId!}
              myId={myId}
              presenceMembers={presenceMembers}
              canvasBgIndex={canvasBgIndex}
              setCanvasBgIndex={setCanvasBgIndex}
              onShareClick={() => setIsShareModalOpen(true)}
            />
          )}
          <ThemeAndRoleSync role={role} />
        </Tldraw>

        {/* ── Right Floating Sidebar (Chat, AI, People) ── */}
        <BoardSidebar
          boardId={boardId!}
          presenceMembers={presenceMembers}
          currentUserId={myId}
          store={storeWithStatus.store}
          editor={editor}
        />
      </div>

      {isShareModalOpen && (
        <ShareBoardModal
          boardId={boardId!}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
        />
      )}
    </div>
  );
}

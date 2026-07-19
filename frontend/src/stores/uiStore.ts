import { create } from 'zustand';

export type SidebarTab = 'users' | 'chat' | 'ai' | 'comments';

interface UIState {
  isSidebarOpen: boolean;
  activePanel: SidebarTab | null;
  activeSidebarTab: SidebarTab;
  toggleSidebar: () => void;
  setActivePanel: (panel: SidebarTab | null) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  activePanel: null,
  activeSidebarTab: 'chat',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActivePanel: (panel) => set({ activePanel: panel, isSidebarOpen: !!panel, activeSidebarTab: panel ?? 'chat' }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab, activePanel: tab, isSidebarOpen: true }),
}));

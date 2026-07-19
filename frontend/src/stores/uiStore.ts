import { create } from 'zustand';

type ActivePanel = 'chat' | 'comments' | 'ai' | null;

interface UIState {
  isSidebarOpen: boolean;
  activePanel: ActivePanel;
  toggleSidebar: () => void;
  setActivePanel: (panel: ActivePanel) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  activePanel: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActivePanel: (panel) => set({ activePanel: panel, isSidebarOpen: !!panel }),
}));

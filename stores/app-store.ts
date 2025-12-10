import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // User preferences
  preferences: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
  };
  setPreference: <K extends keyof AppState["preferences"]>(
    key: K,
    value: AppState["preferences"][K]
  ) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Preferences
      preferences: {
        soundEnabled: true,
        animationsEnabled: true,
      },
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        preferences: state.preferences,
      }),
    }
  )
);


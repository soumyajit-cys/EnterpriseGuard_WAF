import { create } from "zustand"

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggle: () => void
  setMobileOpen: (open: boolean) => void
  closeMobile: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () =>
    set((state) => ({ isCollapsed: !state.isCollapsed })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  closeMobile: () => set({ isMobileOpen: false }),
}))

import { create } from "zustand"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
  initialize: () => {
    const stored = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")
    if (stored && token) {
      try {
        const user = JSON.parse(stored) as User
        set({ user, isAuthenticated: true, isLoading: false })
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))

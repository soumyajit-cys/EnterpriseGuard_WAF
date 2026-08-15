import { create } from "zustand"
import type { User } from "@/types"
import { authService } from "@/services/auth"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    try {
      await authService.logout()
    } catch {
      // server cookies will expire on their own if the call fails
    }
    localStorage.removeItem("csrf_token")
    localStorage.removeItem("user")
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
  initialize: async () => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      set({ isLoading: false })
      return
    }
    try {
      const user = await authService.getMe()
      localStorage.setItem("user", JSON.stringify(user))
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem("csrf_token")
      localStorage.removeItem("user")
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/services/auth", () => ({
  authService: {
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}))

import { authService } from "@/services/auth"
import { useAuthStore } from "./auth-store"
import type { User } from "@/types"

const USER: User = {
  id: 1,
  username: "alice",
  email: "alice@example.com",
  role: "admin",
  is_active: true,
  is_verified: true,
}

const initial = useAuthStore.getState()

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.setState(initial)
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("setUser authenticates when a user is provided", () => {
    useAuthStore.getState().setUser(USER)
    expect(useAuthStore.getState().user).toEqual(USER)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it("setUser(null) de-authenticates", () => {
    useAuthStore.getState().setUser(USER)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("logout clears state and storage", async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined)
    localStorage.setItem("csrf_token", "a".repeat(40))
    localStorage.setItem("user", JSON.stringify(USER))
    useAuthStore.getState().setUser(USER)

    await useAuthStore.getState().logout()

    expect(authService.logout).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem("csrf_token")).toBeNull()
    expect(localStorage.getItem("user")).toBeNull()
  })

  it("logout still clears local state when the API call fails", async () => {
    vi.mocked(authService.logout).mockRejectedValue(new Error("offline"))
    useAuthStore.getState().setUser(USER)

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("initialize with no stored user finishes loading without auth", async () => {
    await useAuthStore.getState().initialize()
    expect(useAuthStore.getState().isLoading).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(authService.getMe).not.toHaveBeenCalled()
  })

  it("initialize restores a valid stored session via getMe", async () => {
    localStorage.setItem("user", JSON.stringify(USER))
    vi.mocked(authService.getMe).mockResolvedValue(USER)

    await useAuthStore.getState().initialize()

    expect(useAuthStore.getState().user).toEqual(USER)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isLoading).toBe(false)
    expect(localStorage.getItem("user")).toBe(JSON.stringify(USER))
  })

  it("initialize logs out when getMe rejects (expired session)", async () => {
    localStorage.setItem("user", JSON.stringify(USER))
    localStorage.setItem("csrf_token", "b".repeat(40))
    vi.mocked(authService.getMe).mockRejectedValue(new Error("401"))

    await useAuthStore.getState().initialize()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem("user")).toBeNull()
    expect(localStorage.getItem("csrf_token")).toBeNull()
  })
})
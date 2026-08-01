import api from "./api"
import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TokenResponse,
  User,
  VerifyMFARequest,
} from "@/types"

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post("/auth/login", data)
    return res.data
  },

  async verify2fa(data: VerifyMFARequest): Promise<AuthResponse> {
    const res = await api.post("/auth/verify-2fa", data)
    return res.data
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post("/auth/register", data)
    return res.data
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const res = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    })
    return res.data
  },

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await api.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Refresh-Token": refreshToken,
        },
      }
    )
  },

  async getMe(): Promise<User> {
    const res = await api.get("/auth/me")
    return res.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}

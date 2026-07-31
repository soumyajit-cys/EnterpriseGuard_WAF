import api from "./api"
import type { AllowedIP, PaginatedResponse } from "@/types"

export const allowlistService = {
  async getAll(params?: {
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<AllowedIP>> {
    const res = await api.get("/waf/allowlist", { params })
    return res.data
  },

  async create(data: {
    ip_address: string
    description?: string
  }): Promise<AllowedIP> {
    const res = await api.post("/waf/allowlist", data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/waf/allowlist/${id}`)
  },
}

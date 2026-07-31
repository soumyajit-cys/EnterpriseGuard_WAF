import api from "./api"
import type { BlockedIP, PaginatedResponse } from "@/types"

export const blocklistService = {
  async getAll(params?: {
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<BlockedIP>> {
    const res = await api.get("/waf/blocklist", { params })
    return res.data
  },

  async create(data: {
    ip_address: string
    reason?: string
    permanent?: boolean
    expires_in?: string
  }): Promise<BlockedIP> {
    const res = await api.post("/waf/blocklist", data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/waf/blocklist/${id}`)
  },
}

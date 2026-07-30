import api from "./api"
import type { WAFSettings } from "@/types"

export const settingsService = {
  async getMode(): Promise<{ mode: string }> {
    const res = await api.get("/settings/mode")
    return res.data
  },

  async updateMode(mode: string): Promise<{ mode: string }> {
    const res = await api.put(`/settings/mode/${mode}`)
    return res.data
  },

  async getAll(): Promise<WAFSettings> {
    const res = await api.get("/settings/")
    return res.data
  },

  async update(key: string, data: { value: string }): Promise<WAFSettings> {
    const res = await api.put(`/settings/${key}`, data)
    return res.data
  },
}

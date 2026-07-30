import api from "./api"
import type { Alert, PaginatedResponse } from "@/types"

export const alertsService = {
  async getAll(params?: {
    page?: number
    page_size?: number
    severity?: string
    resolved?: boolean
  }): Promise<PaginatedResponse<Alert>> {
    const res = await api.get("/alerts/", { params })
    return res.data
  },

  async resolve(id: number): Promise<Alert> {
    const res = await api.patch(`/alerts/${id}/resolve`)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/alerts/${id}`)
  },

  async exportAlerts(format: "csv" | "json"): Promise<Blob> {
    const res = await api.get(`/alerts/export`, {
      params: { format },
      responseType: "blob",
    })
    return res.data
  },
}

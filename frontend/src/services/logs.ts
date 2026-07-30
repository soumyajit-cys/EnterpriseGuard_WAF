import api from "./api"
import type { RequestLog, PaginatedResponse } from "@/types"

export const logsService = {
  async getAll(params?: {
    page?: number
    page_size?: number
    ip_address?: string
    action?: string
    start_date?: string
    end_date?: string
    search?: string
  }): Promise<PaginatedResponse<RequestLog>> {
    const res = await api.get("/requests/", { params })
    return res.data
  },

  async exportLogs(format: "csv" | "json"): Promise<Blob> {
    const res = await api.get("/requests/export", {
      params: { format },
      responseType: "blob",
    })
    return res.data
  },
}

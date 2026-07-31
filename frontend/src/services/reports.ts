import api from "./api"
import type { ReportParams } from "@/types"

export const reportsService = {
  async generate(params: ReportParams): Promise<Blob> {
    const res = await api.get("/reports/generate", {
      params,
      responseType: "blob",
    })
    return res.data
  },

  async generateReport(range: string, format: "csv" | "json"): Promise<Blob> {
    const days = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 }[range] || 7
    const start_date = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
    const end_date = new Date().toISOString().slice(0, 10)
    const res = await api.get("/reports/generate", {
      params: { type: "traffic", format, start_date, end_date },
      responseType: "blob",
    })
    return res.data
  },

  async getTrafficData(range: string): Promise<any> {
    const res = await api.get("/analytics/traffic", { params: { period: range } })
    return res.data
  },

  async getAttackData(range: string): Promise<any> {
    const res = await api.get("/analytics/attacks", { params: { period: range } })
    return res.data
  },
}

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
    const res = await api.get("/reports/generate", {
      params: { range, format },
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

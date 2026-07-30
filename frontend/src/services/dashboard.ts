import api from "./api"
import type { DashboardStats } from "@/types"

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get("/dashboard/stats")
    return res.data
  },
}

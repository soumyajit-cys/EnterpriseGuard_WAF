import api from "./api"

export const analyticsService = {
  async getTrafficStats(period: string = "7d"): Promise<any> {
    const res = await api.get("/analytics/traffic", { params: { period } })
    return res.data
  },

  async getTraffic(period: string = "live"): Promise<any> {
    const res = await api.get("/analytics/traffic", { params: { period } })
    return res.data
  },

  async getAttackStats(period: string = "7d"): Promise<any> {
    const res = await api.get("/analytics/attacks", { params: { period } })
    return res.data
  },

  async getOverview(): Promise<any> {
    const res = await api.get("/analytics/overview")
    return res.data
  },

  async getGeo(hours: number = 24): Promise<any> {
    const res = await api.get("/analytics/geo", { params: { hours } })
    return res.data
  },

  async getAttackers(hours: number = 24, limit: number = 25): Promise<any> {
    const res = await api.get("/analytics/attackers", {
      params: { hours, limit },
    })
    return res.data
  },

  async getAttackerDetail(ip: string, hours: number = 24): Promise<any> {
    const res = await api.get(`/analytics/attackers/${encodeURIComponent(ip)}`, {
      params: { hours },
    })
    return res.data
  },
}

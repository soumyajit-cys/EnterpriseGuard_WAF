import api from "./api"
import type {
  AnalyticsOverview,
  AttacksResponse,
  AttackerDetail,
  DossiersResponse,
  GeoResponse,
  TrafficResponse,
} from "@/types"

export const analyticsService = {
  async getTrafficStats(period: string = "7d"): Promise<TrafficResponse> {
    const res = await api.get("/analytics/traffic", { params: { period } })
    return res.data
  },

  async getTraffic(period: string = "live"): Promise<TrafficResponse> {
    const res = await api.get("/analytics/traffic", { params: { period } })
    return res.data
  },

  async getAttackStats(period: string = "7d"): Promise<AttacksResponse> {
    const res = await api.get("/analytics/attacks", { params: { period } })
    return res.data
  },

  async getOverview(): Promise<AnalyticsOverview> {
    const res = await api.get("/analytics/overview")
    return res.data
  },

  async getGeo(hours: number = 24): Promise<GeoResponse> {
    const res = await api.get("/analytics/geo", { params: { hours } })
    return res.data
  },

  async getAttackers(hours: number = 24, limit: number = 25): Promise<DossiersResponse> {
    const res = await api.get("/analytics/attackers", {
      params: { hours, limit },
    })
    return res.data
  },

  async getAttackerDetail(ip: string, hours: number = 24): Promise<AttackerDetail> {
    const res = await api.get(`/analytics/attackers/${encodeURIComponent(ip)}`, {
      params: { hours },
    })
    return res.data
  },
}
import api from "./api"

export const publicService = {
  async getStats(): Promise<{
    total_requests: number
    total_blocked: number
    total_alerts: number
    active_rules: number
    requests_24h: number
    blocked_24h: number
    attack_rate_24h: number
    top_threats: Array<{ name: string; count: number }>
  }> {
    const res = await api.get("/public/stats")
    return res.data
  },
}

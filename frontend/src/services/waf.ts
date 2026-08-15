import api from "./api"
import type { PayloadTestResult, PaginatedAuditLogs } from "@/types"

export const wafService = {
  async testPayload(payload: {
    input?: string
    source?: string
    body?: string
    headers?: Record<string, string>
    path?: string
  }): Promise<PayloadTestResult> {
    const res = await api.post("/waf/test", payload)
    return res.data
  },

  async getAuditLogs(
    page: number = 1,
    pageSize: number = 20,
    action?: string
  ): Promise<PaginatedAuditLogs> {
    const res = await api.get("/waf/audit-logs", {
      params: { page, page_size: pageSize, action },
    })
    return res.data
  },
}
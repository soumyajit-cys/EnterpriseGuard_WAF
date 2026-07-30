import api from "./api"
import type { Rule, PaginatedResponse } from "@/types"

export const rulesService = {
  async getAll(params?: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<PaginatedResponse<Rule>> {
    const res = await api.get("/rules/", { params })
    return res.data
  },

  async getById(id: number): Promise<Rule> {
    const res = await api.get(`/rules/${id}`)
    return res.data
  },

  async create(data: Partial<Rule>): Promise<Rule> {
    const res = await api.post("/rules/", data)
    return res.data
  },

  async update(id: number, data: Partial<Rule>): Promise<Rule> {
    const res = await api.put(`/rules/${id}`, data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/rules/${id}`)
  },

  async toggle(id: number): Promise<Rule> {
    const res = await api.patch(`/rules/${id}/toggle`)
    return res.data
  },
}

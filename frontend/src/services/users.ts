import api from "./api"
import type { User, PaginatedResponse } from "@/types"

export const usersService = {
  async getAll(params?: {
    page?: number
    page_size?: number
    role?: string
    search?: string
    sort_by?: string
    sort_desc?: boolean
  }): Promise<PaginatedResponse<User>> {
    const res = await api.get("/users/", { params })
    return res.data
  },

  async getById(id: number): Promise<User> {
    const res = await api.get(`/users/${id}`)
    return res.data
  },

  async create(data: {
    username: string
    email: string
    password: string
    role?: string
  }): Promise<User> {
    const res = await api.post("/users/", data)
    return res.data
  },

  async update(
    id: number,
    data: Partial<{
      username: string
      email: string
      role: string
      is_active: boolean
    }>
  ): Promise<User> {
    const res = await api.put(`/users/${id}`, data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, requireAuth, router])

  return { isAuthenticated, isLoading, user }
}

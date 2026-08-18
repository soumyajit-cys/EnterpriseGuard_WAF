"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Toaster } from "sonner"
import { MotionConfig } from "framer-motion"
import { useAuthStore } from "@/store/auth-store"

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AuthInitializer>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0F1622",
                border: "1px solid #223044",
                color: "#DEE7F0",
              },
            }}
          />
        </AuthInitializer>
      </MotionConfig>
    </QueryClientProvider>
  )
}

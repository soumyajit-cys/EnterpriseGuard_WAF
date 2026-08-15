"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthShell } from "@/components/auth/auth-shell"
import { authService } from "@/services/auth"
import { useAuthStore } from "@/store/auth-store"
import type { AuthResponse } from "@/types"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

const mfaSchema = z.object({
  code: z
    .string()
    .length(6, "Enter the 6-digit code from your authenticator app"),
})

type LoginForm = z.infer<typeof loginSchema>
type MFAForm = z.infer<typeof mfaSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser, isAuthenticated, initialize } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mfaToken, setMfaToken] = useState<string | null>(null)

  useEffect(() => {
    initialize()
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router, initialize])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerMfa,
    handleSubmit: handleSubmitMfa,
    formState: { errors: mfaErrors },
  } = useForm<MFAForm>({
    resolver: zodResolver(mfaSchema),
  })

  const completeAuth = (response: AuthResponse) => {
    localStorage.setItem("csrf_token", response.csrf_token)
    localStorage.setItem("user", JSON.stringify(response.user))
    setUser(response.user)
    toast.success("Welcome back!", {
      description: `Logged in as ${response.user.username}`,
    })
    router.push("/dashboard")
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      if ("requires_2fa" in response && response.requires_2fa) {
        setMfaToken(response.mfa_token)
        toast.info("Two-factor authentication required", {
          description: "Enter the code from your authenticator app",
        })
      } else if (!("requires_2fa" in response)) {
        completeAuth(response)
      }
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Invalid credentials. Please try again."
      toast.error("Login failed", { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  const onMfaSubmit = async (data: MFAForm) => {
    if (!mfaToken) return
    setIsLoading(true)
    try {
      const response = await authService.verify2fa({
        mfa_token: mfaToken,
        code: data.code,
      })
      completeAuth(response)
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.response?.data?.detail || "Invalid code",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (mfaToken) {
    return (
      <AuthShell
        title="Two-factor authentication"
        subtitle="Enter the 6-digit code from your authenticator app"
      >
        <form onSubmit={handleSubmitMfa(onMfaSubmit)} className="space-y-5">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck className="h-7 w-7 text-blue-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Verification code</label>
            <Input
              {...registerMfa("code")}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              className="text-center text-lg tracking-[0.4em] font-mono"
            />
            {mfaErrors.code && (
              <p className="text-xs text-red-400">{mfaErrors.code.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </Button>

          <button
            type="button"
            onClick={() => setMfaToken(null)}
            className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Back to sign in
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access the security dashboard">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              {...register("username")}
              placeholder="Enter your username"
              autoComplete="username"
              className="pl-9"
            />
          </div>
          {errors.username && (
            <p className="text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <a
              href="#"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center">
        <p className="text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

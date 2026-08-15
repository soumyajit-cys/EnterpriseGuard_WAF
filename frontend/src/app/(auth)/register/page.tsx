"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Lock, Mail, User, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthShell } from "@/components/auth/auth-shell"
import { authService } from "@/services/auth"
import { useAuthStore } from "@/store/auth-store"
import { getErrorMessage } from "@/services/api"

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit"),
})

type RegisterForm = z.infer<typeof registerSchema>

const passwordChecks = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "1 uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 lowercase", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 digit", test: (p: string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch("password") ?? ""

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)
      localStorage.setItem("csrf_token", response.csrf_token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
      toast.success("Account created!", {
        description: `Welcome, ${response.user.username}`,
      })
      router.push("/dashboard")
    } catch (error) {
      const message =
        getErrorMessage(error, "Registration failed. Please try again.")
      toast.error("Registration failed", { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start protecting your application in under a minute"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              {...register("username")}
              placeholder="Choose a username"
              autoComplete="username"
              className="pl-9"
            />
          </div>
          {errors.username && (
            <p className="text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-9"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
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
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
            {passwordChecks.map((check) => {
              const passed = check.test(password)
              return (
                <span
                  key={check.label}
                  className={`inline-flex items-center gap-1 text-[11px] transition-colors ${
                    passed ? "text-emerald-400" : "text-zinc-600"
                  }`}
                >
                  <CheckCircle2
                    className={`h-3 w-3 ${passed ? "opacity-100" : "opacity-40"}`}
                  />
                  {check.label}
                </span>
              )
            })}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/5 text-center">
        <p className="text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

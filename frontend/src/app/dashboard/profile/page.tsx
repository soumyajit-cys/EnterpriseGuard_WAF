"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import api from "@/services/api"
import { Plus, Trash2, Save, ShieldCheck, KeyRound, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")

  const handleUpdate = async () => {
    try {
      await api.put("/auth/me", { username, email })
      toast.success("Profile updated")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Profile" description="Manage your account" />

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{user?.username}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              {user?.role && <Badge className="mt-1">{user.role}</Badge>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              <Save className="h-4 w-4 mr-2" /> Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <TwoFactorCard />
    </motion.div>
  )
}

function TwoFactorCard() {
  const { user, setUser } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null)
  const [code, setCode] = useState("")
  const [isBusy, setIsBusy] = useState(false)

  const enabled = user?.totp_enabled === true

  const startSetup = async () => {
    try {
      const res = await api.get("/auth/2fa/setup")
      setSetup(res.data)
      setOpen(true)
    } catch (error: any) {
      toast.error("Setup failed", { description: error.response?.data?.detail })
    }
  }

  const confirmEnable = async () => {
    if (!setup || code.length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app")
      return
    }
    setIsBusy(true)
    try {
      await api.post("/auth/2fa/enable", { code })
      setUser({ ...user!, totp_enabled: true })
      toast.success("2FA enabled — your account is now protected")
      setOpen(false)
      setCode("")
    } catch (error: any) {
      toast.error("Enable failed", { description: error.response?.data?.detail })
    } finally {
      setIsBusy(false)
    }
  }

  const confirmDisable = async () => {
    if (code.length < 6) {
      toast.error("Enter a valid code from your authenticator app")
      return
    }
    setIsBusy(true)
    try {
      await api.post("/auth/2fa/disable", { code })
      setUser({ ...user!, totp_enabled: false })
      toast.success("2FA disabled")
      setOpen(false)
      setCode("")
    } catch (error: any) {
      toast.error("Disable failed", { description: error.response?.data?.detail })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                enabled
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-zinc-800/50 border-zinc-700"
              }`}
            >
              <ShieldCheck className={`h-5 w-5 ${enabled ? "text-green-400" : "text-zinc-400"}`} />
            </div>
            <div>
              <h3 className="font-medium text-zinc-200">Two-factor authentication</h3>
              <p className="text-xs text-zinc-500">
                {enabled
                  ? "Authenticator app codes are required at every login"
                  : "Add an extra layer of security with TOTP codes"}
              </p>
            </div>
          </div>
          <Badge variant={enabled ? "success" : "outline"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            {enabled ? (
              <Button variant="outline" className="mt-5 w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4 mr-2" /> Disable 2FA
              </Button>
            ) : (
              <Button className="mt-5 w-full bg-gradient-to-r from-blue-600 to-cyan-600">
                <KeyRound className="h-4 w-4 mr-2" /> Set up 2FA
              </Button>
            )}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {enabled ? "Disable two-factor authentication" : "Set up two-factor authentication"}
              </DialogTitle>
            </DialogHeader>

            {!enabled && !setup && (
              <Button onClick={startSetup}>
                <Plus className="h-4 w-4 mr-2" /> Generate secret
              </Button>
            )}

            {setup && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.otpauth_uri)}`}
                    alt="TOTP QR code"
                    className="rounded-xl border border-zinc-700"
                    width={180}
                    height={180}
                  />
                </div>
                <p className="text-center text-xs text-zinc-500">
                  Scan this QR code with Google Authenticator, Authy, or any TOTP app.
                </p>
                <div>
                  <label className="text-xs text-zinc-500 font-medium">Manual secret</label>
                  <div className="mt-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700 px-3 py-2 text-center font-mono text-sm text-blue-300 tracking-wider">
                    {setup.secret}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 font-medium">
                    {enabled ? "Current 2FA code" : "Verification code"}
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1.5 text-center text-lg tracking-[0.4em] font-mono"
                  />
                </div>
                <Button
                  onClick={enabled ? confirmDisable : confirmEnable}
                  className={`w-full ${enabled ? "bg-red-600 hover:bg-red-500" : "bg-gradient-to-r from-blue-600 to-cyan-600"}`}
                  disabled={isBusy}
                >
                  {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {enabled ? "Disable 2FA" : "Enable 2FA"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

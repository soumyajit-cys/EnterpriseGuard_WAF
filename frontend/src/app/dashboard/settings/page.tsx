"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { settingsService } from "@/services/settings"
import api from "@/services/api"
import { Bell, Save, Send, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getAll(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      settingsService.update(key, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      toast.success("Setting updated")
    },
  })

  if (isLoading) return <div className="text-zinc-500">Loading settings...</div>

  if (!settings || typeof settings !== "object") {
    return <div className="text-zinc-500">No settings available</div>
  }

  const entries = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }))
  const booleanKeys = ["debug", "enabled", "block_mode", "log_all_requests", "email_notifications"]
  const displayOrder = ["mode", "security_level", "rate_limit", "rate_limit_window", "debug", "enabled", "block_mode", "log_all_requests", "email_notifications", "redis_url", "smtp_host", "smtp_port"]

  const sortedEntries = [...entries].sort((a, b) => displayOrder.indexOf(a.key) - displayOrder.indexOf(b.key))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Settings" description="Configure WAF system settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-zinc-200 mb-4">General Settings</h3>
            <div className="space-y-4">
              {sortedEntries.filter((s) => !booleanKeys.includes(s.key)).map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{setting.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                  </div>
                  <Input
                    value={setting.value}
                    onChange={(e) => updateMutation.mutate({ key: setting.key, value: e.target.value })}
                    className="w-48"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-zinc-200 mb-4">Toggle Settings</h3>
            <div className="space-y-4">
              {sortedEntries.filter((s) => booleanKeys.includes(s.key)).map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{setting.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                  </div>
                  <Switch
                    checked={setting.value === "true"}
                    onCheckedChange={(v) => updateMutation.mutate({ key: setting.key, value: v.toString() })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <WebhookSettingsCard />
    </motion.div>
  )
}

function WebhookSettingsCard() {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState("")
  const [type, setType] = useState("generic")
  const [minSeverity, setMinSeverity] = useState("critical")
  const [enabled, setEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getAll(),
  })

  useEffect(() => {
    if (settings && typeof settings === "object") {
      setUrl(String(settings.webhook_url ?? ""))
      setType(String(settings.webhook_type ?? "generic"))
      setMinSeverity(String(settings.webhook_events ?? "critical"))
      setEnabled(String(settings.webhook_enabled ?? "false") === "true")
    }
  }, [settings])

  const save = async () => {
    setIsSaving(true)
    try {
      const res = await api.put("/settings/", {
        webhook_url: url,
        webhook_type: type,
        webhook_events: minSeverity,
        webhook_enabled: enabled ? "true" : "false",
      })
      toast.success("Webhook settings saved")
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      return res.data
    } catch (error: any) {
      toast.error("Save failed", { description: error.response?.data?.detail })
    } finally {
      setIsSaving(false)
    }
  }

  const test = async () => {
    if (!url.trim()) {
      toast.error("Enter a webhook URL first")
      return
    }
    setIsTesting(true)
    try {
      const res = await api.post("/settings/webhooks/test", {
        url: url.trim(),
        type,
      })
      toast.success("Webhook delivered!", { description: res.data?.message })
    } catch (error: any) {
      toast.error("Delivery failed", { description: error.response?.data?.detail })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return <Card><CardContent className="p-4"><Skeleton className="h-32 rounded-xl" /></CardContent></Card>
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Bell className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-200">Alert Webhooks</h3>
              <p className="text-xs text-zinc-500">
                Stream alerts to Slack, Discord, Telegram or any HTTP endpoint
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-zinc-500 font-medium">Webhook URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-medium">Platform</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="generic">Generic JSON</option>
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-zinc-500 font-medium">
            Minimum severity to deliver
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              { value: "low", label: "Low +" },
              { value: "medium", label: "Medium +" },
              { value: "high", label: "High +" },
              { value: "critical", label: "Critical only" },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setMinSeverity(s.value)}
                className={`rounded-full border px-3 py-1 text-xs transition-all ${
                  minSeverity === s.value
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            onClick={save}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
          <Button variant="outline" onClick={test} disabled={isTesting}>
            {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send test alert
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

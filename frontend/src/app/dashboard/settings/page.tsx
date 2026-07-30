"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { settingsService } from "@/services/settings"

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
    </motion.div>
  )
}

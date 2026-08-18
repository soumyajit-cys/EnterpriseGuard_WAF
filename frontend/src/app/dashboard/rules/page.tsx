"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Plus, Search, Shield, Pencil, Trash2, Cpu, ShieldX } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SeverityChip } from "@/components/ui/severity-chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { rulesService } from "@/services/rules"
import { getErrorMessage } from "@/services/api"
import type { Rule } from "@/types"

const BUILT_IN_RULES = [
  { name: "SQL_INJECTION", description: "Classic SQLi payloads in params, headers and body", score: 30, severity: "medium" },
  { name: "SQL_INJECTION_ENCODED", description: "Base64 / hex-encoded SQLi runs inside tokens", score: 35, severity: "medium" },
  { name: "XSS", description: "Cross-site scripting payloads and event handlers", score: 25, severity: "medium" },
  { name: "COMMAND_INJECTION", description: "OS command chaining and shell metacharacters", score: 85, severity: "critical" },
  { name: "PATH_TRAVERSAL", description: "Directory traversal sequences (../, ..\\)", score: 40, severity: "medium" },
  { name: "LFI", description: "Local file inclusion via wrappers and proc paths", score: 70, severity: "high" },
  { name: "RFI", description: "Remote file inclusion and URL loaders", score: 85, severity: "critical" },
  { name: "XXE", description: "XML external entity payloads", score: 80, severity: "critical" },
  { name: "SSRF", description: "Server-side request forgery — internal/metadata targets", score: 75, severity: "high" },
  { name: "SSTI", description: "Server-side template injection expressions", score: 50, severity: "high" },
  { name: "LDAP_INJECTION", description: "LDAP filter injection operators", score: 40, severity: "medium" },
  { name: "HEADER_INJECTION", description: "CRLF and response header splitting", score: 80, severity: "critical" },
  { name: "HTTP_SMUGGLING", description: "CL+TE / TE+CL conflicting transfer headers", score: 90, severity: "critical" },
  { name: "GRAPHQL_ABUSE", description: "Introspection queries and batching abuse", score: 55, severity: "high" },
  { name: "MALICIOUS_UPLOAD", description: "Dangerous filenames and content in multipart uploads", score: 75, severity: "high" },
]

export default function RulesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["rules", page, search],
    queryFn: () => rulesService.getAll({ page, page_size: 20, search }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => rulesService.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] })
      toast.success("Rule toggled")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] })
      toast.success("Rule deleted")
    },
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="WAF Rules"
        description="Manage security detection and prevention rules"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Rule</DialogTitle></DialogHeader>
              <RuleForm onSuccess={() => { setIsCreateOpen(false); queryClient.invalidateQueries({ queryKey: ["rules"] }) }} />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search rules..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            {data?.items.map((rule: Rule) => (
              <div key={rule.id} className="flex items-center gap-4 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleMutation.mutate(rule.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200">{rule.name}</span>
                    <SeverityChip value={rule.severity} />
                    <Badge variant="outline">P{rule.priority}</Badge>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-zinc-500 mt-1">{rule.description}</p>
                  )}
                  {rule.category && (
                    <p className="text-xs text-zinc-600 mt-1">{rule.category}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingRule(rule)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
            {!isLoading && data?.items.length === 0 && (
              <EmptyState
                icon={ShieldX}
                title="No custom rules"
                description="Create a rule with a regex pattern to extend the engine, or keep the built-in detectors."
              />
            )}
          </div>

          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">{data.total} rules total</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingRule} onOpenChange={(o) => { if (!o) setEditingRule(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Rule</DialogTitle></DialogHeader>
          {editingRule && <RuleForm rule={editingRule} onSuccess={() => { setEditingRule(null); queryClient.invalidateQueries({ queryKey: ["rules"] }) }} />}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Cpu className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-200">Built-in Engine Rules</h3>
              <p className="text-xs text-zinc-500">
                Always-on detectors compiled into the WAF engine — no management needed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {BUILT_IN_RULES.map((r) => (
              <div
                key={r.name}
                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3"
              >
                <Shield className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-medium text-zinc-200">{r.name}</span>
                    <SeverityChip value={r.severity} />
                    <Badge variant="outline">{r.score} pts</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RuleForm({ rule, onSuccess }: { rule?: Rule; onSuccess: () => void }) {
  const [name, setName] = useState(rule?.name || "")
  const [description, setDescription] = useState(rule?.description || "")
  const [severity, setSeverity] = useState(rule?.severity || "medium")
  const [priority, setPriority] = useState(rule?.priority?.toString() || "50")
  const [category, setCategory] = useState(rule?.category || "")
  const [pattern, setPattern] = useState(rule?.pattern || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { name, description, severity, priority: parseInt(priority), category, pattern }
      if (rule) {
        await rulesService.update(rule.id, data)
        toast.success("Rule updated")
      } else {
        await rulesService.create(data)
        toast.success("Rule created")
      }
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save rule"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-zinc-400">Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-zinc-400">Priority</label>
          <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm text-zinc-400">Category</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Regex Pattern</label>
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
      </Button>
    </form>
  )
}

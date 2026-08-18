"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VerdictChip } from "@/components/ui/verdict-chip"
import { SeverityChip } from "@/components/ui/severity-chip"
import { ScoreBar } from "@/components/ui/score-bar"
import { wafService } from "@/services/waf"
import type { PayloadTestResult } from "@/types"
import { cn } from "@/lib/utils"
import { severityDot, severityText, severityFromScore } from "@/lib/severity"
import {
  FlaskConical,
  Play,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Link2,
  Terminal,
} from "lucide-react"
import { buildShareUrl } from "@/services/playground"
import { getErrorMessage } from "@/services/api"

const sources = [
  { value: "query", label: "Query string" },
  { value: "body", label: "Request body" },
  { value: "headers", label: "Headers" },
  { value: "uri", label: "URI path" },
]

const presets = [
  {
    label: "SQLi",
    input: "id=1' OR 1=1--",
    source: "query",
    body: "",
  },
  {
    label: "XSS",
    input: "q=<script>alert(1)</script>",
    source: "query",
    body: "",
  },
  {
    label: "Cmd injection",
    input: "1;cat /etc/passwd",
    source: "query",
    body: "",
  },
  {
    label: "Base64 SQLi",
    input: "id=JyBPUiAxPTEgLS0=",
    source: "query",
    body: "",
  },
  {
    label: "GraphQL",
    input: "query { __schema { types { name } } }",
    source: "body",
    body: "query { __schema { types { name } } }",
  },
  {
    label: "Upload .php",
    input: "filename=shell.php",
    source: "body",
    body: 'Content-Disposition: form-data; name="file"; filename="shell.php"',
  },
  {
    label: "Benign",
    input: "q=hello world",
    source: "query",
    body: "",
  },
]

export default function PlaygroundPage() {
  const [input, setInput] = useState("")
  const [source, setSource] = useState("query")
  const [body, setBody] = useState("")
  const [result, setResult] = useState<PayloadTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const run = async () => {
    setIsLoading(true)
    setResult(null)
    try {
      const res = await wafService.testPayload({ input, source, body })
      setResult(res)
    } catch (error) {
      toast.error("Test failed", {
        description: getErrorMessage(error, "Could not run the test"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const share = async () => {
    const url = buildShareUrl({ input, source, body })
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Public share link copied", {
        description: "Anyone can run this test without an account",
      })
    } catch {
      toast.error("Clipboard unavailable")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Rule Testing Playground"
        description="Score any payload offline against the full detection engine — nothing hits the network"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-3 py-1.5 text-xs font-medium text-blue-400">
            <FlaskConical className="h-3.5 w-3.5" />
            Offline sandbox
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input panel */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-5">
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Payload / input value
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 1' OR 1=1-- or <script>alert(1)</script>"
                className="mt-2 w-full h-28 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">Source</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {sources.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSource(s.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                      source === s.value
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {source === "body" && (
              <div>
                <label className="text-sm font-medium text-zinc-300">
                  Body content
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Raw request body (JSON, form, multipart...)"
                  className="mt-2 w-full h-24 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={run}
                disabled={isLoading || !input.trim()}
                className="flex-1 h-11 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Detection
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={share}
                disabled={!input.trim()}
                className="h-11 px-4"
                title="Copy public share link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <p className="text-xs text-zinc-600 mb-2 font-semibold uppercase tracking-widest">
                Presets
              </p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setInput(p.input)
                      setSource(p.source)
                      setBody(p.body)
                    }}
                    className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results panel */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div
                  className={`rounded-2xl border p-6 ${
                    result.verdict === "BLOCK"
                      ? "border-red-500/30 bg-red-950/20"
                      : "border-emerald-500/30 bg-emerald-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {result.verdict === "BLOCK" ? (
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                      ) : (
                        <ShieldCheck className="h-8 w-8 text-emerald-400" />
                      )}
                      <div>
                        <p
                          className={`text-2xl font-bold ${
                            result.verdict === "BLOCK"
                              ? "text-red-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {result.verdict}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {result.verdict === "BLOCK"
                            ? "This request would be rejected with 403"
                            : "This request would pass through"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.severity === "critical" || result.severity === "high" ? "danger" : "warning"}>
                        {result.severity}
                      </Badge>
                      <span className="text-3xl font-bold text-zinc-100 tabular-nums">
                        {result.effective_score}
                        <span className="text-sm text-zinc-500">/100</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-zinc-950/60 border border-zinc-800 px-3 py-2">
                    <Terminal className="h-4 w-4 text-blue-400" />
                    <code className="text-xs text-zinc-300 font-mono truncate">
                      {result.input || result.body || "(empty)"}
                    </code>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-medium text-zinc-200 mb-4">
                      Detector breakdown
                      <span className="ml-2 text-xs text-zinc-600">
                        {result.findings.length} trigger(s)
                      </span>
                    </h3>
                    {result.findings.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        No detection engines fired. Clean payload.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {result.findings.map((f, i) => (
                          <motion.div
                            key={`${f.type}-${i}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-zinc-800 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  f.score >= 80
                                    ? "bg-red-500"
                                    : f.score >= 50
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <span className="font-mono text-sm text-zinc-200">
                                {f.type}
                              </span>
                              <span className="text-xs text-zinc-600">
                                via {f.source}
                              </span>
                            </div>
                            <span className="font-mono text-sm font-semibold text-zinc-300 tabular-nums">
                              {f.score}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center"
              >
                <FlaskConical className="h-10 w-10 text-zinc-600 mb-4" />
                <p className="text-zinc-400 font-medium">No test run yet</p>
                <p className="text-sm text-zinc-600 mt-1 max-w-sm">
                  Enter a payload on the left and hit{" "}
                  <span className="text-zinc-400">Run Detection</span>. Results
                  show the verdict, combined score, and every engine that fired.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SeverityChip } from "@/components/ui/severity-chip"
import { playgroundService, parseShareUrl } from "@/services/playground"
import { cn } from "@/lib/utils"
import { severityText, severityFromScore } from "@/lib/severity"
import {
  FlaskConical,
  Loader2,
  Play,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Link2,
} from "lucide-react"

const presetSamples = [
  { label: "SQLi", input: "id=1' OR 1=1--" },
  { label: "XSS", input: "q=<script>alert(1)</script>" },
  { label: "Cmd injection", input: "1;cat /etc/passwd" },
  { label: "Base64 SQLi", input: "id=JyBPUiAxPTEgLS0=" },
  { label: "Path traversal", input: "file=../../../../etc/passwd" },
  { label: "Benign", input: "hello world" },
]

export default function PublicPlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090B]">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      }
    >
      <Playground />
    </Suspense>
  )
}

function Playground() {
  const searchParams = useSearchParams()
  const shared = useMemo(() => parseShareUrl(searchParams.toString()), [searchParams])
  const [input, setInput] = useState(shared?.input ?? "")
  const [source, setSource] = useState(shared?.source ?? "query")
  const [result, setResult] = useState<Awaited<ReturnType<typeof playgroundService.testPublic>> | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async (override?: { input: string; source: string }) => {
    const payload = {
      input: (override?.input ?? input).trim(),
      source: override?.source ?? source,
    }
    if (!payload.input) {
      toast.error("Enter a payload to test")
      return
    }
    setLoading(true)
    try {
      const res = await playgroundService.testPublic(payload)
      setResult(res)
    } catch {
      toast.error("Engine unavailable")
    } finally {
      setLoading(false)
    }
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/playground?p=" + btoa(encodeURIComponent(JSON.stringify({ i: input, s: source }))))
      toast.success("Share link copied — anyone can run this test")
    } catch {
      toast.error("Clipboard unavailable")
    }
  }

  useEffect(() => {
    if (shared) {
      void Promise.resolve().then(() => run(shared))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-zinc-200">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.08),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-14">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">EnterpriseGuard WAF</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Public Playground</p>
            </div>
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors"
          >
            Sign in for full dashboard →
          </Link>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-14 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
            <FlaskConical className="h-3.5 w-3.5" />
            15+ detectors · encoded payloads · no sign-up needed
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-white">
            Test any attack payload against{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              the WAF engine
            </span>
          </h1>
          <p className="mt-4 text-zinc-500 max-w-xl mx-auto text-sm sm:text-base">
            Real detection engine, zero setup. Drop in a payload to see which
            rules fire, the decoded evidence, and the verdict — just like our
            customers see on every blocked request.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10"
        >
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl shadow-blue-950/30 overflow-visible">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-3">
                <Terminal className="h-3.5 w-3.5" />
                PAYLOAD
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && run()}
                  placeholder="e.g. 1' OR 1=1--"
                  className="h-12 flex-1 bg-zinc-950/60 border-zinc-700 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="query">Query</option>
                    <option value="body">Body</option>
                    <option value="uri">URI</option>
                  </select>
                  <Button
                    onClick={() => run()}
                    disabled={loading}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    Run test
                  </Button>
                  <Button variant="outline" onClick={share} className="h-12 px-4" disabled={!input}>
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {presetSamples.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setInput(p.input)
                      run({ input: p.input, source })
                    }}
                    className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs text-zinc-400 hover:border-blue-500/40 hover:text-blue-300 transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <div
                      className={`rounded-xl border p-5 ${
                        result.verdict === "BLOCK"
                          ? "border-red-500/30 bg-red-500/[0.07]"
                          : "border-emerald-500/30 bg-emerald-500/[0.07]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {result.verdict === "BLOCK" ? (
                          <ShieldAlert className="h-6 w-6 text-red-400" />
                        ) : (
                          <ShieldCheck className="h-6 w-6 text-emerald-400" />
                        )}
                        <span
                          className={`text-xl font-black tracking-tight ${
                            result.verdict === "BLOCK" ? "text-red-400" : "text-emerald-400"
                          }`}
                        >
                          {result.verdict}
                        </span>
                        <Badge variant={severityVariant[result.severity]} className="capitalize">
                          {result.severity}
                        </Badge>
                        <span className="ml-auto font-mono text-sm text-zinc-400">
                          score {result.effective_score}/100 · mode {result.mode}
                        </span>
                      </div>

                      {result.findings.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {result.findings.map((f, i) => (
                            <motion.div
                              key={f.type}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-red-300">{f.type}</span>
                                <Badge variant="outline">{f.score} pts</Badge>
                                <span className="text-[10px] text-zinc-600 font-mono">source: {f.source}</span>
                              </div>
                              {f.evidence && (
                                <p className="mt-1.5 font-mono text-xs text-zinc-500 break-all">
                                  <span className="text-zinc-600">evidence: </span>
                                  {f.evidence}
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-emerald-400/80">
                          No detections — this payload passes clean through the engine.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <footer className="mt-14 text-center text-xs text-zinc-600">
          Powered by the EnterpriseGuard detection engine —{" "}
          <Link href="/" className="text-zinc-400 hover:text-zinc-200">
            learn more
          </Link>
        </footer>
      </div>
    </main>
  )
}

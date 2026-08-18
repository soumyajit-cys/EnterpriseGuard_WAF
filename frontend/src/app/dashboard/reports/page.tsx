"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText } from "lucide-react"
import { reportsService } from "@/services/reports"

export default function ReportsPage() {
  const [range, setRange] = useState("7d")
  const [loading, setLoading] = useState<string | null>(null)

  const { data: trafficData } = useQuery({
    queryKey: ["reports", "traffic", range],
    queryFn: () => reportsService.getTrafficData(range),
  })

  const { data: attackData } = useQuery({
    queryKey: ["reports", "attacks", range],
    queryFn: () => reportsService.getAttackData(range),
  })

  const attackTypes = trafficData?.attack_distribution ?? []

  const trafficSummary =
    attackData ?? { total_requests: 0, total_blocked: 0, total_alerts: 0, block_rate: 0, alerts_by_severity: {} }

  const downloadReport = async (type: "pdf" | "csv" | "json") => {
    setLoading(type)
    try {
      const blob = await reportsService.generateReport(range, type)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `waf-report-${range}-${Date.now()}.${type}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and download security reports"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <Button variant="outline" disabled={loading === "pdf"} onClick={() => downloadReport("pdf")}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" disabled={loading === "csv"} onClick={() => downloadReport("csv")}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" disabled={loading === "json"} onClick={() => downloadReport("json")}>
              <Download className="h-4 w-4 mr-2" /> JSON
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-zinc-200">Traffic Summary</h3>
              <FileText className="h-5 w-5 text-zinc-600" />
            </div>
            {trafficData ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Requests</span>
                  <span className="font-mono text-zinc-200">{trafficSummary.total_requests || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Allowed</span>
                  <span className="font-mono text-blue-400">
                    {(trafficSummary.total_requests || 0) - (trafficSummary.total_blocked || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Blocked</span>
                  <span className="font-mono text-sev-critical">{trafficSummary.total_blocked || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Block Rate</span>
                  <span className="font-mono text-zinc-200">
                    {trafficSummary.total_requests
                      ? ((trafficSummary.total_blocked / trafficSummary.total_requests) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Loading...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-zinc-200">Attack Summary</h3>
              <FileText className="h-5 w-5 text-zinc-600" />
            </div>
            {attackTypes.length > 0 ? (
              <div className="space-y-2">
                {attackTypes.map((at) => (
                  <div key={at.name} className="flex items-center justify-between text-sm">
                    <Badge variant="warning">{at.name}</Badge>
                    <span className="font-mono text-zinc-200">{at.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500">No attacks in this period</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

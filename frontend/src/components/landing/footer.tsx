"use client"

import Link from "next/link"
import { ShieldCheck, Sparkles } from "lucide-react"

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Threat coverage", href: "#threats" },
      { label: "Live stats", href: "#stats" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <p className="font-display font-bold text-sm leading-none">
                Enterprise<span className="text-gradient">Guard</span>
              </p>
            </Link>
            <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-xs">
              A self-hosted WAF that inspects every request, shows the findings
              behind each decision, and blocks what matters — deployed as inline
              middleware in your stack.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-zinc-400">All systems operational</span>
            </div>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-4">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} EnterpriseGuard WAF · Built with FastAPI, Redis & Next.js
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Sparkles className="h-3.5 w-3.5 text-blue-500/60" />
            Every request, inspected
          </div>
        </div>
      </div>
    </footer>
  )
}

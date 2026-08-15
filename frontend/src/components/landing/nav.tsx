"use client"

import Link from "next/link"
import { ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navLinks } from "@/components/landing/shared"

export function LandingNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div>
            <p className="font-bold text-[15px] leading-none tracking-tight">
              Enterprise<span className="text-gradient">Guard</span>
            </p>
            <p className="text-[10px] text-zinc-500 leading-none mt-1 tracking-widest uppercase">
              WAF Platform
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          >
            <Link href={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Open Dashboard" : "Get Started"}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
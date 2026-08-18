"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldCheck, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Cta({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12),transparent_60%)] pointer-events-none" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-b from-blue-500/40 via-zinc-700/60 to-zinc-800/60 p-px"
        >
          <div className="rounded-[calc(1.5rem-1px)] bg-zinc-950/95 p-10 sm:p-14">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              Ready to see what&apos;s attacking{" "}
              <span className="text-gradient">your app?</span>
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              Open the console and watch live traffic get scored, flagged, and
              blocked — with the exact findings behind every decision.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-xl shadow-blue-600/30 hover:scale-[1.02]"
              >
                <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                  {isAuthenticated ? "Open Dashboard" : "Start Securing Now"}
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-[15px] bg-zinc-900/50 hover:bg-zinc-800/70"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
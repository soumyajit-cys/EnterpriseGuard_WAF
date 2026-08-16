"use client"

import { motion } from "framer-motion"
import { SectionHeading, steps } from "@/components/landing/shared"

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-zinc-900/20 border-y border-zinc-800/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.06),transparent_60%)] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Architecture"
          eyebrowColor="text-cyan-400"
          title="Three steps."
          highlight="Zero latency grief."
          subtitle="The engine sits as ASGI middleware — every request is inspected with sub-millisecond overhead."
        />

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="relative inline-flex">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto glow">
                  <step.icon className="h-6 w-6 text-blue-400" />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-blue-600/30">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-semibold text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Terminal mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-zinc-500 font-mono">
                enterpriseguard — waf engine
              </span>
            </div>
            <div className="p-5 font-mono text-[13px] leading-7">
              <p className="text-zinc-500">
                <span className="text-emerald-400">$</span> curl -X POST /api/login \
                <span className="text-zinc-600">{"-d 'user=admin' OR 1=1--'"}</span>
              </p>
              <p className="text-red-400 mt-2">
                {"[WAF] SQL_INJECTION detected · score 100"}
              </p>
              <p className="text-red-400">
                {"[WAF] LDAP_INJECTION detected · score 70"}
              </p>
              <p className="text-yellow-400">
                {"[WAF] Request blocked · 403 Forbidden"}
              </p>
              <p className="text-zinc-600 mt-2">HTTP/1.1 403 Forbidden</p>
              <p className="text-zinc-500">
                {'{ "status": "blocked", "reason": "SQL_INJECTION" }'}
              </p>
              <p className="text-emerald-400 mt-3">
                {"[ALERT] Critical alert created → dashboard"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
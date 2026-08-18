"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SectionHeading, features } from "@/components/landing/shared"

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Protection Stack"
          title="Every attack class,"
          highlight="covered"
          subtitle="A defense-in-depth engine that inspects headers, query strings, and request bodies — catching what signature-based WAFs miss."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              whileHover={{ y: -6 }}
              className={cn(
                "group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all duration-300 hover:bg-zinc-900/70 hover:shadow-2xl hover:shadow-black/40",
                feature.hoverBorder
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-start justify-between mb-5">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", feature.iconBg, feature.iconShadow)}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 font-mono text-[9px] font-medium tracking-[0.15em] text-zinc-500">
                  {feature.tag}
                </span>
              </div>
              <h3 className="font-display font-semibold text-[15px] mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
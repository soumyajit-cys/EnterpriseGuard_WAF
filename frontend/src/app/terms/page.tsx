"use client"

import Link from "next/link"
import { Scale } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-zinc-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to EnterpriseGuard
        </Link>

        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/40">
          <Scale className="h-6 w-6 text-zinc-300" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          Terms of Service
        </h1>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-display text-lg font-semibold">The software</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              EnterpriseGuard is provided as-is, without warranty of any kind,
              express or implied — including, but not limited to, warranties of
              merchantability, fitness for a particular purpose, or
              non-infringement. You are responsible for validating that it
              protects your applications as you expect before deploying it
              against production traffic.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Use of the playground</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              The public playground exists to test payloads against the
              detection engine. Do not use it to probe infrastructure outside
              the sandbox it is hosted on, or to attack other users. Abusive use
              may be rate-limited or blocked.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Liability</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              In no event shall the maintainers be liable for any claim,
              damages, or other liability arising from the use of this software
              — including blocked legitimate traffic, missed attacks, or data
              loss. Run it behind your own monitoring and test the ruleset
              before you rely on it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Changes</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              These terms may be updated as the project evolves. Continued use
              of the software after changes constitute acceptance of the
              revised terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

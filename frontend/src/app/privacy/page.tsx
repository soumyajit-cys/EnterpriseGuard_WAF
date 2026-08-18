"use client"

import Link from "next/link"
import { Lock } from "lucide-react"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-zinc-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to EnterpriseGuard
        </Link>

        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10">
          <Lock className="h-6 w-6 text-blue-400" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          Privacy
        </h1>

        <div className="mt-8 space-y-10">
          <section>
            <h2 className="font-display text-lg font-semibold">What EnterpriseGuard stores</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              The WAF logs the requests it inspects: source IP, method, path,
              user agent, country, the threat score, and which detection
              engines fired. That log is what lets the dashboard show live
              traffic, attacker dossiers, and the attack map. Request bodies
              are not stored. Payloads submitted to the playground are scored
              in memory and returned, but not retained.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Self-hosted by design</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              EnterpriseGuard is self-hosted software. When you deploy it, your
              request logs, alerts, and audit trail live in your own database
              and Redis instance. We do not phone home with traffic data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Account data</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Account records — username, password hash, and role — exist only
              in your own instance&apos;s database. Passwords are hashed, never
              stored in plain text. Deleting an account removes its records from
              the instance you operate.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Contact</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Questions about this policy go to the maintainers via the contact
              channel listed in the repository.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

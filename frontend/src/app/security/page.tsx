"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background text-zinc-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to EnterpriseGuard
        </Link>

        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-xl border border-sev-critical/25 bg-sev-critical/10">
          <ShieldAlert className="h-6 w-6 text-sev-critical" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          Security
        </h1>
        <p className="mt-3 text-zinc-400">
          EnterpriseGuard is a web application firewall. We take the security
          of the tool itself as seriously as the traffic it inspects.
        </p>

        <h2 className="mt-12 font-display text-lg font-semibold">Reporting a vulnerability</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          If you believe you&apos;ve found a vulnerability in EnterpriseGuard —
          the WAF engine, the API, or the dashboard — please report it before
          disclosing it publicly. We ask for coordinated disclosure so we can
          ship a fix before the details become public.
        </p>

        <h2 className="mt-12 font-display text-lg font-semibold">How to report</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Send details to the maintainers via the contact channel listed in the
          repository. Include, at minimum:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
          <li>The affected component and version.</li>
          <li>A minimal reproduction — request payloads or API calls, not a live exploit against a running deployment.</li>
          <li>Your assessment of severity and impact, if you have one.</li>
        </ul>

        <h2 className="mt-12 font-display text-lg font-semibold">What we commit to</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
          <li>We acknowledge every valid report.</li>
          <li>We ship fixes as fast as we reasonably can, and note the fix in the changelog.</li>
          <li>We credit reporters who follow coordinated disclosure, unless they ask not to be credited.</li>
        </ul>

        <p className="mt-12 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-relaxed text-zinc-500">
          Security notices: do not use the public playground to probe
          infrastructure other than the sandbox it is hosted on. Out-of-scope
          activity — denial of service against shared infrastructure, data
          exfiltration, or attacks on other tenants&apos; data — is not covered by
          this policy.
        </p>
      </div>
    </main>
  )
}

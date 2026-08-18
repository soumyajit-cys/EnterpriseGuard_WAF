# Frontend Redesign Plan — EnterpriseGuard WAF

Pass 1 deliverable. Reviewed against the brief at the end (see §6).

## 1. Color

**System logic:** a WAF console is a *command deck*: dark, calm, readable
for hours. Neutral grays get a blue-charcoal cast (blue = the color of
trust/surveillance for this product), the interactive accent is a
**scan-cyan** (the color of a scanning beam — the product's actual job),
and **severity is its own hue family** (cool → hot), kept distinct from
the brand accent so "what's dangerous" is a separate visual channel from
"what's clickable."

| Token | Hex | Job |
|---|---|---|
| `zinc-950` (page) | `#0A0F16` | command-deck blue-black, not `#09090B` |
| `zinc-900` (panel) | `#0F1622` | cards, sidebar |
| `zinc-800` (raised) | `#17202E` | inputs, active row bg, hover |
| `zinc-700` (border) | `#223044` | hairlines |
| `blue-600` (primary) | `#1E9FD8` | primary buttons, active nav |
| `blue-500` (accent/ring) | `#38B6EA` | focus rings, links, active states |
| `blue-400`/`cyan-400` | `#5CC9F2` → `#34DAEC` | brand gradient (text, logo) |
| `sev-info` | `#7B95B0` | informational (steel, quiet) |
| `sev-low` | `#4FA3E8` | sky — "watch" |
| `sev-medium` | `#E3B341` | amber — "attention" |
| `sev-high` | `#E87B2B` | orange — "urgent" |
| `sev-critical` | `#E5484D` | red — "act now" |
| `emerald-500` | `#10B981` | operational health (System Online, Resolved) |

**Semantics:** ALLOW verdict = scan-cyan (passed inspection); BLOCK =
critical red (rejected). Green is *not* used for ALLOW — green means
"system healthy," cyan means "request inspected + allowed." Destructive
actions share critical red. Severity is rendered as hue + left-edge rail
on rows + score bar, never as a flat text badge alone.

Why not the defaults I rejected: pure near-black + single acid accent
(the brief's named default), and blue-black + cyan-as-single-accent
(the other common template). The defense against "template" is that
*every* hue has a semantic job tied to the subject (scan beam, severity
ramp, verdict, health) and the neutrals are blue-cast rather than gray.

## 2. Type

| Role | Face | Why |
|---|---|---|
| Display | **Space Grotesk** (600/700) | geometric, technical, built for monitoring UIs; not sci-fi |
| Body | **IBM Plex Sans** (400/500/600) | engineered for dense data UIs; precise, IBM trust |
| Mono | **JetBrains Mono** (400/500/700) | genuine data face: true tabular figures align IP/score/timestamp columns; strong zero/one disambiguation for hex payloads |

Mono does real work here: every IP, score, timestamp, hex dump and
payload readout is mono. `--font-display` / `--font-sans` / `--font-mono`
theme tokens → `font-display` utility. Display reserved for titles and
the hero; body copy stays Plex (Space Grotesk at body sizes hurts
density).

## 3. Layout

**Shell** (sidebar 260px / collapsed 72px + navbar h-16):

```
┌─────────┬────────────────────────────────────────────┐
│ ▨ logo  │ ● System Online   ● API ● DB ● Redis   12:04│
│─────────│────────────────────────────────────────────│
│ Nav      │                                            │
│ ▎Dashboard│  ┌─ Live request inspection ───────────┐  │
│ ▎Live     │  │ ...                                  │  │
│ ▎Alerts 5│  └──────────────────────────────────────┘  │
│ ...      │                                            │
│ Collapse │                                            │
└─────────┴────────────────────────────────────────────┘
```
Active item: cyan left rail (layoutId, existing pattern kept) + raised
surface + cyan label. Section labels: mono uppercase micro-labels.
Collapse: icon-only + tooltip-free (labels hidden), toggle sits on the
edge as today. Alerts nav item gains a live unresolved-count badge.

**Landing hero** (the signature moment, §4) — left: headline + specific
copy; right: the Inspector panel. Below: live stat cards, then threat
ticker.

**Live traffic:** rows as "request cards": severity rail (left edge),
mono request line (`GET /login`), score bar, verdict stamp. Clicking a
row expands the Inspector for that event.

**Attack map:** unchanged map, restyled feed with severity rails +
mono attack type.

## 4. Signature element — "The Inspector"

One committed device: **a live request-inspection panel** — the WAF's
literal job rendered as UI. A payload shown as a hexdump-style dual dump
(hex + ascii), a cyan scan beam sweeping it, findings tagged at their
match position with severity hues, effective score ticking 0→100, and a
verdict stamp resolving to ALLOW (cyan) or BLOCK (red).

Deployed exactly twice, where payloads actually exist:
1. **Landing hero** — animated, looping sample (a real XSS payload),
   the first thing an evaluator sees: the product demonstrating its work.
2. **Playground results + live-row expansion** — same frame, real data.

The live feed uses the same *visual language* (score bar, severity rail,
verdict stamp, mono request line) so the whole product reads as one
system without scattering the animation. One signature, applied where
it's truthful; no glow-orbs-and-gradient-blob hero.

## 5. Motion & states

- `MotionConfig reducedMotion="user"` in providers (global, one line);
  CSS `@media (prefers-reduced-motion: reduce)` guard for marquee/
  shimmer/float/ping keyframes.
- Hero: scan beam loop (reduced-motion → static inspected state).
- Live rows: enter from the right with scan-line wipe; list items
  stagger on page load.
- Everything else: existing hover/tap behaviors restyled, no new
  scatter.
- Empty states: shared `EmptyState` component, engineer-voice copy
  ("No requests scored in the last 24h — live events will appear here
  as the engine inspects them."). Loading: scan-line shimmer skeleton.
- error.tsx copy: "Couldn't reach the WAF core" + Try again.

## 6. Review against the brief — revisions made in-plan

| Brief requirement | Risk of generic answer | Revision |
|---|---|---|
| severity hue family | recycling badge colors | dedicated `sev-*` tokens + rail + score-bar system |
| real mono face | ui-monospace default | JetBrains Mono, tabular figures, used for all data |
| hero not blob+headline | animated orbs/grid | The Inspector (subject-truthful) |
| one signature | scatter effects everywhere | Inspector deployed at 2 truthful locations only |
| green ALLOW default | success-green for verdicts | ALLOW = scan-cyan, green reserved for health |
| copy | "enterprise-grade" boilerplate | rewritten action-first, "shows its work" positioning |

**Technical lever (from inventory):** components use raw
`zinc/blue/cyan/emerald` classes, not the semantic tokens — so the
palette is applied by remapping the default scales inside `@theme`
(`--color-zinc-950: #0A0F16`, …) plus adding `sev-*` tokens. All 40+
pages adopt the new system with zero per-component hex surgery, and the
shadcn component API stays intact.

**Kept as-is (per brief):** data-fetching, auth, routing, component
architecture. Nav badge count is the only new fetch (alerts total, one
query, fails silently).
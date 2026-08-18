# Multi-Tenancy Design Note

Status: **IMPLEMENTED (2026-08-17)** — models, migration `9f2e7c1a4b8d`,
repositories, services, routes, superadmin org management, and tests are
in. See implementation deltas below; open questions resolved per approval.

> This note was originally written as a DRAFT requiring review before any
> code. The approved decisions: promote the first admin to superadmin on
> migration; waf_settings uses global (default-org) fallback; Redis keys
> stay global.

## Implementation deltas vs. this note

* `audit_logs.organization_id` is NULLABLE (not NOT NULL): pre-auth
  events (LOGIN_BLOCKED) and superadmin events have no tenant.
* `users.organization_id` is NULLABLE: superadmins are org-less.
* All other tenant tables (`alerts`, `allowed_ips`, `blocked_ips`,
  `request_logs`, `rules`, `waf_settings`) are NOT NULL and backfilled
  into the "Default Organization".
* `rules.name`, `blocked_ips.ip_address`, `allowed_ips.ip_address` and
  `waf_settings.key` dropped their global unique constraints in favor of
  composite `(organization_id, …)` uniques (the legacy dev DB never had
  the waf_settings one; drops are conditional).
* `/public/stats` is scoped to the default org (the note claimed public
  endpoints read no tenant data — the stats endpoint does, so it is
  scoped rather than leaked globally).
* `waf_mode` remains engine-global and is enforced from the default
  org's settings row only (runtime_sync). Other orgs can store their own
  mode preference; only a default-org admin flips the engine.
* `support` platform role deferred (requires grant management); only
  `superadmin` was added, outside the role hierarchy.
* Engine path (middleware, engine, autoban, runtime_sync) resolves the
  default org via `app/services/tenant_service.py` (cached, fail-open).
* Registration and admin-created users join the default org / the
  admin's org respectively.

---

## 1. Data model: `organization_id`

Introduce an `organizations` table (id, name, created_at, is_active) and
add an `organization_id` FK column to the tenant-scoped tables:

| Table            | tenant column     | Notes |
|------------------|-------------------|-------|
| `users`          | `organization_id` | nullable for the current single-org installs; super-admins may be org-less |
| `rules`          | `organization_id` | custom rules are org-scoped |
| `alerts`         | `organization_id` | alert records belong to an org |
| `blocked_ips`    | `organization_id` | block/allow decisions are per-org |
| `allowed_ips`    | `organization_id` | |
| `audit_logs`     | `organization_id` | audit trail per org |
| `request_logs`   | `organization_id` | traffic history per org |
| `waf_settings`   | `organization_id` | per-org WAF config (mode, webhooks) |

Explicitly NOT tenant-scoped:

* `alembic_version` (infra)
* `organizations` itself (root table)
* anything keyed globally: token blacklists, rate-limit keys, traffic
  WebSocket fanout, Redis baselines — these are already keyed by
  IP/route/token and either per-request ephemeral state or safe to keep
  global (Redis keys are not SQL rows and carry no cross-org leakage as
  long as lookups stay keyed by the authenticated user's context).

## 2. Isolation enforcement: shared schema + repository filtering

**Decision: row-level filtering in the repository layer (single schema,
shared tables), not separate schemas per tenant.**

Rationale:

* Separate schemas scale poorly past a handful of tenants: every
  migration must fan out, connection pooling/search_path management gets
  complex with asyncpg, and per-tenant `search_path` juggling in the
  existing `ALEMBIC_SCHEMA` hook would fight the current single-DB
  design.
* This project's repositories already centralize every table access
  (`app/repositories/*`), which is exactly the chokepoint where
  row-level filtering can be enforced in one place.
* Postgres RLS is a viable future hardening step, but SQLAlchemy-level
  filtering in repositories is sufficient, explicit, and testable at
  the unit level. RLS can be layered on later without changing the
  application contract.

Enforcement rules:

1. Every repository method that reads or writes tenant-scoped rows
   gains an `organization_id` parameter sourced from the authenticated
   request context (see §3), never from client input.
2. Reads always filter by `organization_id`; writes always set it.
3. The dependency layer injects the org id (derived from the user's
   membership, not from a header/body value) so routes cannot forget it
   or be tricked into using a spoofed value.
4. Cross-org references (e.g. an alert referencing a rule) are always
   resolved within the same org context; a FK alone must not be trusted
   to cross orgs.

## 3. RBAC × tenant boundaries

Proposal: **a user belongs to exactly one organization** (the common
SaaS-WAF model). A `memberships` join table is deliberately rejected for
v1 — multi-org membership adds role-per-org complexity with little
near-term payoff.

Consequences:

* `users.organization_id` + `users.role` — role stays global *within*
  the org: `admin`/`analyst`/`operator`/`viewer` semantics are unchanged
  and the existing `role_ge()` hierarchy still applies, scoped to the
  user's own org.
* A small set of **platform roles** sits outside the org hierarchy:
  `superadmin` (manage organizations, see nothing else) and
  `support` (org-scoped read access granted explicitly). Existing
  `admin` remains org-scoped.
* `require_admin()`/`require_analyst()` keep their current shape; new
  dependencies (`get_organization_id`, `require_superadmin`) are added
  alongside. No existing endpoint's auth contract changes.

## 4. Existing single-tenant data on migration

Because `organization_id` must be NOT NULL for tenant-scoped tables,
the migration must backfill the current rows first:

1. `alembic upgrade`: add `organizations` table; insert one row
   `"Default Organization"`.
2. Add `organization_id` as **nullable** to the tenant tables.
3. Backfill: `UPDATE <table> SET organization_id = (SELECT id FROM
   organizations WHERE name = 'Default Organization')`.
4. `ALTER COLUMN organization_id SET NOT NULL` + add FKs and indexes
   (composite index on `(organization_id, created_at)` for the hot
   query paths: alerts, request_logs, audit_logs).
5. All existing users are assigned to the default org; the first
   existing admin is promoted to `superadmin` (or a dedicated
   `superadmin` account is seeded — to be decided).

This is one atomic-ish migration chain (mirroring the existing
baseline → reconcile → severity pattern), fully reversible up to the
backfill step. The default org preserves all current data and behavior;
existing single-tenant deployments upgrade without data loss and only
then can create additional orgs.

## 5. Blast radius checklist (once approved)

* 8 models + 8 repositories + `audit_service` + `alert_service` +
  `request_logger` + `runtime_sync` + `autoban_service` (which writes
  blocked_ips) — all gain org context.
* All routes touching the tables in §1 gain the org-aware dependency.
* SIEM export (`/audit/export`) and `/waf/audit-logs` filter by org.
* Public endpoints (`/public/*`) stay org-less (they read no
  tenant-scoped data; `/public/playground/test` is stateless).
* New tests: same-org visibility, cross-org 404/empty results,
  superadmin cross-org access, migration backfill on a copy of the dev
  DB, and the existing 110 tests passing unmodified on the default org.

## Open questions for approval

All three resolved by approval (2026-08-17):

1. **Superadmin seeding** — *Promote first admin*: the earliest-created
   admin is promoted to `superadmin` during the migration. No dedicated
   account is seeded.
2. **waf_settings model** — *Global fallback*: per-org rows override the
   default org's rows; unset keys fall back.
3. **Redis scoping** — *Leave global*: keys already carry per-IP/per-token
   identity; no SQL row crosses orgs.
# EnterpriseGuard WAF

EnterpriseGuard is a modern, enterprise-grade Web Application Firewall built with **FastAPI** and **PostgreSQL**, shipped with a full **Next.js** administration dashboard. It inspects every request in real time, scores it across **16 detection engines**, and blocks malicious traffic before it reaches your application — no proxies, no agents.

[![CI](https://github.com/yourusername/EnterpriseGuard_WAF/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/EnterpriseGuard_WAF/actions/workflows/ci.yml)

---

## Highlights

- **16 detection engines** — SQLi (incl. base64/hex/double-encoded), XSS, command injection, path traversal, LFI, RFI, XXE, SSRF, SSTI, LDAP injection, header injection, HTTP request smuggling (CL.TE / TE.CL), GraphQL abuse (introspection, depth, alias bombing), malicious uploads, bot traffic, and CSRF validation.
- **Explainable verdicts** — every finding carries an `evidence` snippet showing the exact input that tripped the rule.
- **Multi-stage kill-chain autoban** — IPs exhibiting 3+ distinct attack signatures are persistently banned, raising a critical alert.
- **Attacker dossiers** — per-IP profiles with kill-chain detection, threat-type breakdown, top paths, geo-location, and full event timelines.
- **Public playground** — `POST /public/playground/test` lets anyone (or your customers) throw payloads at the live engine and get scored verdicts — no login required. Shareable via URL-encoded payload links.
- **Real-time traffic feed** — WebSocket (`/ws/traffic`) streaming every request verdict into the dashboard.
- **Attack map** — animated global view of blocked traffic in real time.
- **2FA (TOTP)** — opt-in per user; login issues an MFA challenge when enabled.
- **Webhooks** — alerts forwarded to Slack, Discord, Telegram, or any generic HTTP endpoint, severity-gated.
- **Immutable audit trail**, RBAC user management, per-IP rate limiting, block/allow lists, and full analytics.

## Tech Stack

| Layer       | Technologies                                                        |
| ----------- | ------------------------------------------------------------------- |
| Backend     | FastAPI, Uvicorn, SQLAlchemy 2.0 (async), AsyncPG, Pydantic v2, Alembic |
| Database    | PostgreSQL                                                            |
| Cache       | Redis (optional — fails open if unavailable)                          |
| Auth        | JWT (access + refresh), passlib/bcrypt, TOTP (2FA)                    |
| Frontend    | Next.js 16, React, TypeScript, Tailwind, Framer Motion, TanStack Table, React Hook Form, Zustand |
| DevOps      | GitHub Actions CI, pytest (backend), ESLint + production build (frontend) |

## Architecture

```
                ┌───────────────────┐
                │   Client Request  │
                └─────────┬─────────┘
                          ▼
              ┌───────────────────────────┐
              │   WAF Middleware (ASGI)   │
              │  blocklist → rate limit → │
              │   engine → CSRF → call    │
              └─────────┬─────────────────┘
                        ▼
        ┌───────────────────────────────┐
        │         WAF Engine            │
        │  16 detectors + scoring +     │
        │  evidence + severity          │
        └───┬───────────┬───────────┬───┘
            ▼           ▼           ▼
   ┌────────────┐ ┌──────────┐ ┌──────────┐
   │ Request    │ │ Alerts + │ │ Traffic  │
   │ Logging    │ │ Autoban  │ │ Stream   │
   └─────┬──────┘ └────┬─────┘ └────┬─────┘
         ▼             ▼            ▼
   ┌──────────────────────────────────────┐
   │        PostgreSQL / Redis / WS       │
   └──────────────────────────────────────┘
            ▲
            │ REST API + WebSocket
   ┌────────┴────────┐
   │  Next.js Admin  │  /dashboard + public /playground
   │   Dashboard     │
   └─────────────────┘
```

## Project Structure

```
EnterpriseGuard_WAF/
├── main.py                 # FastAPI app, middleware, routers, startup
├── app/
│   ├── api/routes/         # auth, admin, alerts, analytics, dashboard,
│   │                       # health, public_stats, reports, requests,
│   │                       # rules, settings, traffic_ws, waf
│   ├── auth/               # JWT encoding/decoding, auth dependencies
│   ├── core/               # config, database, security_headers
│   ├── middleware/         # waf_middleware, audit_middleware
│   ├── models/             # SQLAlchemy models (users, logs, alerts, ...)
│   ├── repositories/       # data access layer
│   ├── schemas/            # Pydantic request/response models
│   ├── services/           # auth, alert, audit, geo, metrics, rate_limit,
│   │                       # request_logger, runtime_sync, traffic_stream
│   └── waf/                # detector, engine, actions, rules/ (16 detectors)
├── tests/                  # pytest suite (detectors, playground, webhooks, 2FA)
├── frontend/               # Next.js admin dashboard + public playground
└── .github/workflows/      # ci.yml (backend tests + frontend lint/build)
```

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+
- PostgreSQL (15+)
- Redis (optional)

### 1. Backend

```bash
git clone https://github.com/yourusername/EnterpriseGuard_WAF.git
cd EnterpriseGuard_WAF

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create the database:

```bash
sudo -u postgres psql
CREATE ROLE wafuser WITH LOGIN PASSWORD 'waf123';
CREATE DATABASE wafdb OWNER wafuser;
\q
```

Create `.env` in the project root (copy from `.env.example`):

```env
DATABASE_URL=postgresql+asyncpg://wafuser:waf123@localhost/wafdb
REDIS_URL=redis://localhost:6379
SECRET_KEY=change_this_to_a_long_random_string
WAF_MODE=detection        # "detection" logs only · "prevention" blocks
TRUSTED_PROXIES=          # comma-separated proxy IPs allowed to set X-Forwarded-For (leave empty if none)
COOKIE_SECURE=false       # set true when serving over HTTPS
```

> **`TRUSTED_PROXIES` matters.** The WAF only trusts `X-Forwarded-For` when the request arrived directly from one of these IPs. If you leave it empty, clients cannot spoof their IP — but if you deploy behind a reverse proxy (nginx, Caddy, a cloud LB), you must list its IP(s) here or every client will appear to come from the proxy.

Run the API:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs at http://localhost:3000.

> **Note:** the WAF inspects all traffic, including the frontend's own API calls. Authenticated requests must send the `X-CSRF-Token` header (any value ≥ 32 chars) on state-changing methods, and should use a browser `User-Agent` to avoid being flagged as bot traffic.

## Dashboard

| Page                    | Path                      | What it does                                          |
| ----------------------- | ------------------------- | ----------------------------------------------------- |
| Overview                | `/dashboard`              | Live stats, charts, recent alerts                     |
| Live Traffic            | `/dashboard/live`         | Real-time request stream (WebSocket)                  |
| Analytics               | `/dashboard/analytics`    | Traffic, attacks, geo, and timing charts              |
| Attack Map              | `/dashboard/attack-map`   | Animated global map of blocked traffic                |
| Attacker Dossiers       | `/dashboard/dossiers`     | Per-IP kill chains, threat types, timelines, bans     |
| Alerts                  | `/dashboard/alerts`       | Alert inbox with severity filtering                   |
| Requests                | `/dashboard/logs`         | Historical request logs                              |
| Blocked / Allowed IPs   | `/dashboard/blocked-ips`  | Blocklist & allowlist management (with expiry)        |
| Rules                   | `/dashboard/rules`        | Rule catalog, thresholds, custom rules                |
| Users                   | `/dashboard/users`        | Admin user management (RBAC)                          |
| Audit Log               | `/dashboard/audit`        | Immutable admin audit trail                           |
| Settings                | `/dashboard/settings`     | WAF mode, webhook config, 2FA                         |
| Playground              | `/playground`             | **Public** — test payloads against the live engine, share links |

## API Reference

### System & Health

| Method | Endpoint     | Description                          |
| ------ | ------------ | ------------------------------------ |
| GET    | `/`          | App metadata                         |
| GET    | `/ping`      | Liveness check                       |
| GET    | `/health/`   | Health + dependency status           |
| GET    | `/metrics`   | Prometheus-formatted metrics         |

### Public (no auth, WAF-exempt)

| Method | Endpoint                | Description                                    |
| ------ | ----------------------- | ---------------------------------------------- |
| GET    | `/public/stats`         | Global stats, attack rate, top threats         |
| POST   | `/public/playground/test` | Score a payload against the live WAF engine  |

### Authentication

| Method | Endpoint            | Description                          |
| ------ | ------------------- | ------------------------------------ |
| POST   | `/auth/register`    | Create an account                    |
| POST   | `/auth/login`       | JWT login (returns MFA challenge if 2FA enabled) |
| POST   | `/auth/verify-2fa`  | Complete login with TOTP code        |
| POST   | `/auth/refresh`     | Rotate tokens                        |
| POST   | `/auth/logout`      | Revoke tokens                        |
| GET    | `/auth/me`          | Current user                         |
| PUT    | `/auth/password`    | Change password                      |
| GET    | `/auth/2fa/setup`   | Generate TOTP secret                 |
| POST   | `/auth/2fa/enable`  | Enable 2FA (after code confirmation) |
| POST   | `/auth/2fa/disable` | Disable 2FA                          |

### Admin (admin role)

| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| GET    | `/users/`       | Paginated user list      |
| GET    | `/users/{id}`   | User detail              |
| POST   | `/users/`       | Create user              |
| PUT    | `/users/{id}`   | Update user / role       |
| DELETE | `/users/{id}`   | Delete user              |

### Analytics

| Method | Endpoint                      | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/analytics/overview`         | Aggregated overview metrics                  |
| GET    | `/analytics/traffic`          | Traffic time series                          |
| GET    | `/analytics/attacks`          | Attack time series                           |
| GET    | `/analytics/geo`              | Country-level threat breakdown               |
| GET    | `/analytics/attackers`        | Attacker dossiers (kill chain, bans, threats) |
| GET    | `/analytics/attackers/{ip}`   | Full event timeline for one attacker         |

### WAF & Rules

| Method | Endpoint               | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| GET    | `/waf/mode`            | Current mode (detection/prevention)  |
| POST   | `/waf/test`            | Authenticated payload test           |
| GET/POST/DELETE | `/waf/blocklist` | Manage blocklisted IPs               |
| GET/POST/DELETE | `/waf/allowlist` | Manage allowlisted IPs               |
| GET    | `/waf/audit-logs`      | Admin audit trail (paginated)        |
| GET/POST/PUT/DELETE | `/rules`      | Rule catalog + custom rules          |

### Operational

| Method | Endpoint                      | Description                    |
| ------ | ----------------------------- | ------------------------------ |
| GET    | `/dashboard/stats`            | Dashboard aggregate stats      |
| GET    | `/alerts/`, `/alerts/stats`   | Alerts and alert stats         |
| DELETE | `/alerts/{id}`                | Dismiss an alert               |
| GET    | `/requests/`                  | Paginated request logs         |
| GET    | `/requests/{id}`              | Request log detail             |
| GET    | `/settings/`, `PUT /settings/`| Webhook / global settings      |
| PUT    | `/settings/mode/{mode}`       | Switch WAF mode                |
| POST   | `/settings/webhooks/test`     | Send a test webhook            |
| GET    | `/reports/generate`           | Generate security report       |
| WS     | `/ws/traffic?token=`          | Live traffic stream (JWT token) |

## Security Features

### Detection Engines

Every request is scanned across 16 engines. Findings are scored (0–100); the effective score is `max + (sum − max) / 2`, capped at 100. In **prevention** mode, scores ≥ 50 return `403` with the top reason:

```
HTTP/1.1 403 Forbidden
{"status": "blocked", "reason": "SQL_INJECTION"}
```

Encoded payloads (base64, hex, double-URL-encoded) are decoded before scanning. Layered scoring means a single attack often trips multiple detectors at once.

### Kill-Chain Autoban

IPs exhibiting 3+ distinct attack signatures are automatically and persistently banned, generating a critical `KILL_CHAIN` alert. Bans are visible in the Attacker Dossiers page with the exact reason.

### Webhooks

Alerts are forwarded to Slack, Discord, Telegram, or any generic HTTP endpoint (configurable from Settings) when they meet the configured minimum severity. Delivery is async with retries.

### Two-Factor Authentication

TOTP-based 2FA (Google Authenticator, Aegis, etc.) per user. When enabled, `/auth/login` returns an `mfa_token` challenge that must be completed via `/auth/verify-2fa` before tokens are issued.

### Security Headers

All responses receive `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`, and `Permissions-Policy` headers.

### CSRF & Rate Limiting

- State-changing requests require an `X-CSRF-Token` header (≥ 32 chars) or a same-origin `Origin`/`Referer`.
- Per-IP sliding-window rate limits return `429` with a reason code, and feed the live traffic stream.

## Testing

```bash
# Backend (61 tests)
pytest tests/ -v

# Frontend
cd frontend
npm run lint
npm run build
```

The suite covers WAF detectors (SQLi, encoded payloads, XSS, smuggling, GraphQL, uploads, ...), the playground scoring pipeline, webhook formatting/severity gating/delivery, and the full 2FA lifecycle against PostgreSQL (auto-skips if the DB is unavailable). CI runs everything on PostgreSQL 16 + Redis 7 services.

## CI/CD

`.github/workflows/ci.yml`:

- **Backend job** — PostgreSQL 16 + Redis 7 services, initializes the DB, runs `pytest`
- **Frontend job** — `npm ci`, ESLint, production build

## Roadmap

- Machine-learning-based threat detection
- Threat intelligence feed integration
- SIEM integrations (Splunk, ELK)
- Kubernetes / Helm deployment
- Schema validation of request bodies

## License

MIT

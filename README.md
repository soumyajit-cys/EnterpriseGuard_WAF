# EnterpriseGuard WAF

EnterpriseGuard WAF is a modern, enterprise-grade Web Application Firewall (WAF) built with FastAPI and PostgreSQL. It provides centralized request inspection, security rule management, authentication, monitoring dashboards, alert generation, and attack detection capabilities for protecting web applications against common web-based threats.

## Features

- Web Application Firewall Middleware
- SQL Injection Detection (incl. base64 / hex encoded payloads)
- Cross-Site Scripting (XSS) Detection
- Command Injection, Path Traversal, LFI / RFI, XXE, SSRF, SSTI, LDAP Injection Detection
- HTTP Request Smuggling Detection (CL.TE / TE.CL)
- GraphQL Abuse Detection (introspection, depth, alias bombing)
- Malicious File Upload Detection
- Bot Traffic Detection and CSRF Protection
- Per-Route Rate Limiting
- Multi-Stage Kill-Chain Autoban (persistent bans + critical alerts)
- Credential Stuffing Protection
- Request Monitoring and Logging
- Security Alert Management with Webhook Notifications (Slack / Discord / Telegram / generic)
- Two-Factor Authentication (TOTP)
- Rule-Testing Playground (offline `POST /waf/test`)
- Geographic Threat Analytics
- Immutable Audit Trail
- Authentication and Authorization System (JWT + RBAC)
- Administrative Dashboard (Next.js)
- RESTful API Architecture
- OpenAPI / Swagger Documentation
- Security Headers Enforcement
- Real-Time Request Analytics

## CI

[![CI](https://github.com/yourusername/EnterpriseGuard_WAF/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/EnterpriseGuard_WAF/actions/workflows/ci.yml)

- Backend: `pytest` (unit tests for detectors, playground pipeline, webhooks, 2FA flow) against a PostgreSQL + Redis service
- Frontend: ESLint + production build

## Architecture
                    ┌───────────────────┐
                    │   Client Request  │
                    └─────────┬─────────┘
                              │
                              ▼
                  ┌──────────────────────┐
                  │ EnterpriseGuard WAF  │
                  │      Middleware      │
                  └─────────┬────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
 ┌────────────────┐ ┌───────────────┐ ┌──────────────┐
 │ Threat Checks  │ │ Rule Engine   │ │ Rate Limits  │
 └────────────────┘ └───────────────┘ └──────────────┘
          │                 │                 │
          └─────────┬───────┴─────────┬──────┘
                    ▼                 ▼
          ┌──────────────────┐ ┌─────────────┐
          │ Request Logging  │ │ Alert Engine│
          └─────────┬────────┘ └──────┬──────┘
                    ▼                 ▼
              ┌──────────────────────────┐
              │ PostgreSQL Database      │
              └──────────────────────────┘
Technology Stack
Backend
FastAPI
Python 3.13+
SQLAlchemy
AsyncPG
Pydantic
Alembic
Database
PostgreSQL
Cache & Queue
Redis
Security
JWT Authentication
Security Headers
WAF Middleware
Rule-Based Detection Engine
Project Structure
EnterpriseGuard_WAF/
│
├── app/
│   ├── api/
│   │   └── routes/
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security_headers.py
│   │
│   ├── middleware/
│   │   └── waf_middleware.py
│   │
│   ├── models/
│   ├── repositories/
│   ├── services/
│   └── schemas/
│
├── main.py
├── requirements.txt
├── .env
└── README.md
Installation
Clone Repository
git clone https://github.com/yourusername/EnterpriseGuard_WAF.git

cd EnterpriseGuard_WAF
Create Virtual Environment
python3 -m venv venv

source venv/bin/activate
Install Dependencies
pip install -r requirements.txt
PostgreSQL Setup

Login as postgres:

sudo -u postgres psql

Create database user:

CREATE ROLE wafuser WITH LOGIN PASSWORD 'yourpassword';

Create database:

CREATE DATABASE wafdb OWNER wafuser;

Exit:

\q
Environment Variables

Create a .env file:

DATABASE_URL=postgresql+asyncpg://wafuser:yourpassword@localhost/wafdb
REDIS_URL=redis://localhost:6379
SECRET_KEY=change_this_secret_key
Running the Application
uvicorn main:app --reload --env-file .env

Application will start at:

http://127.0.0.1:8000
API Documentation

Swagger UI:

http://127.0.0.1:8000/docs

ReDoc:

http://127.0.0.1:8000/redoc
Available API Endpoints
System
Method	Endpoint
GET	/
GET	/ping
Health
Method	Endpoint
GET	/health/
Authentication
Method	Endpoint
POST	/auth/login
POST	/auth/verify-2fa
GET	/auth/2fa/setup
POST	/auth/2fa/enable
POST	/auth/2fa/disable
Dashboard
Method	Endpoint
GET	/dashboard/stats
Alerts
Method	Endpoint
GET	/alerts/
Requests
Method	Endpoint
GET	/requests/
Rules
Method	Endpoint
GET	/rules/
Settings
Method	Endpoint
GET	/settings/
PUT	/settings/{key}
POST	/settings/webhooks/test
WAF
Method	Endpoint
POST	/waf/test	Offline rule-testing playground
GET	/waf/audit-logs	Admin audit trail (paginated)
Analytics
Method	Endpoint
GET	/analytics/traffic
GET	/analytics/attacks
GET	/analytics/overview
GET	/analytics/geo	Source-country threat breakdown
Admin
Method	Endpoint
GET	/admin/health
Security Features
SQL Injection Protection

Detects patterns such as:

' OR 1=1 --
UNION SELECT
DROP TABLE

Also decodes base64, hex, and double-URL-encoded payloads before scanning (SQL_INJECTION_ENCODED).

Cross-Site Scripting (XSS)

Detects malicious payloads:

<script>alert('xss')</script>

HTTP Request Smuggling

Blocks conflicting framing headers (CL+TE, duplicate Content-Length / Transfer-Encoding).

GraphQL Abuse

Flags introspection queries (__schema, __type), deep nesting, and alias bombing.

Malicious Uploads

Scores multipart uploads carrying executable scripts or disguised file types (double extensions, PHP/JSP/ASP shells).

Webhooks

Alerts are forwarded to Slack, Discord, Telegram, or any HTTP endpoint when they meet the configured minimum severity (critical / high / medium / low).

Two-Factor Authentication

TOTP-based 2FA using any authenticator app. Enabled per user via /auth/2fa/setup, /auth/2fa/enable, and /auth/2fa/disable; login returns an mfa_token challenge when 2FA is active.

Rate Limiting

Global (per-IP) and per-route limits with 429 responses and reason codes.

Kill-Chain Autoban

IPs exhibiting 3+ distinct attack signatures are automatically and persistently banned, raising a critical kill-chain alert.

Security Headers
X-Frame-Options
X-Content-Type-Options
Referrer-Policy
Content-Security-Policy
Permissions-Policy
Authentication
JWT-based Authentication
Role-Based Access Control
Two-Factor Authentication (TOTP)
Testing

Run the test suite:

python -m pytest tests/ -v

The suite covers:

- WAF detectors (SQLi, encoded SQLi, XSS, smuggling, GraphQL, uploads, ...)
- The /waf/test playground scoring pipeline
- Webhook payload formatting, severity gating, and delivery
- The full 2FA lifecycle against PostgreSQL (skipped if the DB is unavailable)

Frontend:

cd frontend
npm run lint
npm run build

Example Response
{
  "application": "EnterpriseGuard WAF",
  "version": "1.0.0",
  "status": "running",
  "swagger": "/docs",
  "redoc": "/redoc"
}
Future Enhancements
Machine Learning Based Threat Detection
Threat Intelligence Integration
SIEM Integration
Kubernetes Deployment
API Schema Validation on the Frontend
Contributing
Fork the repository
Create a feature branch
git checkout -b feature/new-feature
Commit changes
git commit -m "Add new feature"
Push branch
git push origin feature/new-feature
Open a Pull Request
License

This project is licensed under the MIT License.

Author

Soumyajit Dutta

Cybersecurity Enthusiast | Backend Developer | Security Researcher

GitHub: https://github.com/<your-username>

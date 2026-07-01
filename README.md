EnterpriseGuard WAF

EnterpriseGuard WAF is a modern, enterprise-grade Web Application Firewall (WAF) built with FastAPI and PostgreSQL. It provides centralized request inspection, security rule management, authentication, monitoring dashboards, alert generation, and attack detection capabilities for protecting web applications against common web-based threats.

Features
Web Application Firewall Middleware
SQL Injection Detection
Cross-Site Scripting (XSS) Detection
Request Monitoring and Logging
Security Alert Management
Rule-Based Traffic Inspection
Authentication and Authorization System
Administrative Dashboard
PostgreSQL Integration
RESTful API Architecture
OpenAPI / Swagger Documentation
Security Headers Enforcement
Real-Time Request Analytics
Architecture
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
Admin
Method	Endpoint
GET	/admin/health
Security Features
SQL Injection Protection

Detects patterns such as:

' OR 1=1 --
UNION SELECT
DROP TABLE
Cross-Site Scripting (XSS)

Detects malicious payloads:

<script>alert('xss')</script>
Security Headers
X-Frame-Options
X-Content-Type-Options
Referrer-Policy
Content-Security-Policy
Permissions-Policy
Authentication
JWT-based Authentication
Role-Based Access Control
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
Geo-IP Blocking
Advanced Rate Limiting
Threat Intelligence Integration
SIEM Integration
Email and Slack Alerting
Kubernetes Deployment
Real-Time Monitoring Dashboard
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

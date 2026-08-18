export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "analyst" | "operator" | "viewer"
  is_active: boolean
  is_verified: boolean
  totp_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  csrf_token: string
  user: User
}

export interface MFARequiredResponse {
  requires_2fa: boolean
  mfa_token: string
}

export type LoginResponse = AuthResponse | MFARequiredResponse

export interface VerifyMFARequest {
  mfa_token: string
  code: string
}

export interface TokenResponse {
  csrf_token: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role?: string
}

export interface Rule {
  id: number
  name: string
  description: string
  enabled: boolean
  priority?: number
  severity?: string
  pattern?: string
  category?: string
  rule_type?: string
  created_at?: string
  updated_at?: string
}

export interface Alert {
  id: number
  severity: string
  message: string
  source?: string
  ip_address?: string
  resolved?: boolean
  created_at?: string
}

export interface RequestLog {
  id: number
  ip_address: string
  method?: string
  path: string
  status_code?: number
  threat_score?: number
  score?: number
  action: string
  attack_type?: string
  user_agent?: string
  response_time?: number
  created_at: string
}

export interface DashboardStats {
  requests_today: number
  blocked_today: number
  allowed_today: number
  alerts_today: number
  attack_rate: number
  total_requests: number
  total_blocked: number
  total_alerts: number
  active_rules: number
  mode: string
  cpu_percent: number
  memory_used_mb: number
  memory_total_mb: number
  threats_by_type: { name: string; value: number }[]
  top_attacker_ips: { ip: string; count: number }[]
  top_rules: { name: string; count: number }[]
  traffic_last_24h: { time: string; requests: number; blocked: number }[]
}

export interface WAFSettings {
  mode: string
  rate_limit: number
  rate_limit_window: number
  security_level: string
  email_notifications: boolean
  redis_url?: string
  smtp_host?: string
  smtp_port?: number
  webhook_url?: string
  webhook_type?: string
  webhook_events?: string
  webhook_enabled?: string
  [key: string]: string | number | boolean | undefined
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface BlockedIP {
  id: number
  ip_address: string
  reason?: string
  is_permanent?: boolean
  permanent?: boolean
  expires_at?: string
  created_at: string
}

export interface AllowedIP {
  id: number
  ip_address: string
  description?: string
  created_at: string
}

export interface ReportParams {
  type: "attack" | "traffic" | "alert"
  format: "pdf" | "csv" | "json"
  start_date?: string
  end_date?: string
}

export interface AuditLog {
  id: number
  user_id?: number
  username?: string
  action: string
  resource?: string
  details?: string
  ip_address?: string
  created_at: string
}

export interface AnalyticsOverview {
  total_requests: number
  blocked: number
  alerts: number
  blocked_ips: number
}

export interface GeoCountry {
  country: string
  total: number
  attacks: { type: string; count: number }[]
}

export interface GeoResponse {
  countries: GeoCountry[]
  window_hours: number
}

export interface AttackerDossier {
  ip: string
  blocks: number
  total_requests: number
  distinct_threats: number
  threat_types: { type: string; count: number }[]
  top_paths: { path: string; count: number }[]
  max_score: number
  first_seen: string
  last_seen: string
  kill_chain: boolean
  banned: boolean
  ban_reason?: string
  user_agents: string[]
  country?: string | null
}

export interface DossiersResponse {
  dossiers: AttackerDossier[]
  window_hours: number
}

export interface AttackerTimelineEvent {
  time: string
  action: string
  attack_type?: string
  path: string
  method?: string
  score?: number
  status_code?: number
  user_agent?: string
  country?: string | null
}

export interface AttackerDetail {
  ip: string
  timeline: AttackerTimelineEvent[]
  country?: string | null
}

export interface TrafficTrendPoint {
  date: string
  requests: number
  blocked: number
  allowed: number
}

export interface TrafficResponse {
  server_started: string
  traffic_trend: TrafficTrendPoint[]
  attack_distribution: { name: string; value: number }[]
  top_ips: { ip: string; count: number }[]
}

export interface AttacksResponse {
  total_requests: number
  total_blocked: number
  total_alerts: number
  block_rate: number
  alerts_by_severity: Record<string, number>
}

export interface WAFFinding {
  type: string
  score: number
  source: string
  evidence: string
  rule?: string
}

export interface PayloadTestResult {
  input: string
  body?: string
  findings: WAFFinding[]
  effective_score: number
  severity: string
  verdict: "BLOCK" | "ALLOW"
  mode: string
}

export type PaginatedAuditLogs = PaginatedResponse<AuditLog>

export interface TrafficEvent {
  event: "request" | "blocked"
  id: string
  timestamp?: number
  ip_address: string
  method: string
  path: string
  action: string
  score: number
  attack_type?: string
  status: number
  user_agent?: string
}

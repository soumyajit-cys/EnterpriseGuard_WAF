import axios from "axios"

const getBaseURL = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL
  if (configured) return configured
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`
  }
  return "http://localhost:8000"
}

export const getWsURL = (path: string) => {
  const configured = process.env.NEXT_PUBLIC_WS_URL
  if (configured) return `${configured.replace(/\/$/, "")}${path}`
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss" : "ws"
    return `${proto}://${window.location.hostname}:8000${path}`
  }
  return `ws://localhost:8000${path}`
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

const getCsrfToken = (): string | null => {
  if (typeof window === "undefined") return null
  const csrf = localStorage.getItem("csrf_token")
  return csrf && csrf.length >= 32 ? csrf : null
}

const fetchCsrfToken = async (): Promise<string | null> => {
  try {
    const { data } = await axios.get(`${getBaseURL()}/auth/csrf`, {
      withCredentials: true,
    })
    if (data?.csrf_token) {
      localStorage.setItem("csrf_token", data.csrf_token)
      return data.csrf_token
    }
  } catch {
    // anonymous request (no session) - auth endpoints are CSRF-exempt
  }
  return null
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined" && config.method !== "get") {
    let csrf = getCsrfToken()
    if (!csrf) {
      csrf = await fetchCsrfToken()
    }
    if (csrf) {
      config.headers["X-CSRF-Token"] = csrf
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        if (data?.csrf_token) {
          localStorage.setItem("csrf_token", data.csrf_token)
        }
        return api(originalRequest)
      } catch {
        localStorage.removeItem("csrf_token")
        localStorage.removeItem("user")
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "response" in error) {
    const detail = (error as { response?: { data?: { detail?: string } } })
      .response?.data?.detail
    if (detail) return detail
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default api
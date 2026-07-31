import axios from "axios"

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    let csrf = localStorage.getItem("csrf_token")
    if (!csrf || csrf.length < 32) {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      csrf = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
      localStorage.setItem("csrf_token", csrf)
    }
    config.headers["X-CSRF-Token"] = csrf
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken }
          )
          localStorage.setItem("access_token", data.access_token)
          localStorage.setItem("refresh_token", data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("user")
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }
      } else {
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

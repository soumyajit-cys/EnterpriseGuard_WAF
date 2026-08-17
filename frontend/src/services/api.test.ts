import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockAxios, apiFn } = vi.hoisted(() => {
  const mockAxios = {
    create: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  }
  const apiFn = vi.fn()
  apiFn.get = vi.fn()
  apiFn.post = vi.fn()
  apiFn.defaults = { baseURL: "http://test" }
  apiFn.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }
  mockAxios.create.mockReturnValue(apiFn)
  return { mockAxios, apiFn }
})

vi.mock("axios", () => ({ default: mockAxios }))

let requestHandler: ((config: any) => Promise<any>) | null = null
let errorHandler: ((error: any) => Promise<any>) | null = null

describe("api interceptor logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requestHandler = null
    errorHandler = null
    localStorage.clear()
    process.env.NEXT_PUBLIC_API_URL = "http://test"
    apiFn.interceptors.request.use.mockImplementation((fn: any) => {
      requestHandler = fn
    })
    apiFn.interceptors.response.use.mockImplementation(
      (_ok: any, err: any) => {
        errorHandler = err
      }
    )
    vi.resetModules()
  })

  const loadApi = async () => {
    await import("./api")
    expect(requestHandler).toBeTruthy()
    expect(errorHandler).toBeTruthy()
  }

  describe("request interceptor", () => {
    it("skips CSRF handling for GET requests", async () => {
      await loadApi()
      const config = { method: "get", headers: {} }
      const result = await requestHandler!(config)
      expect(result.headers["X-CSRF-Token"]).toBeUndefined()
      expect(mockAxios.get).not.toHaveBeenCalled()
    })

    it("fetches and attaches CSRF token when none is stored", async () => {
      await loadApi()
      mockAxios.get.mockResolvedValue({
        data: { csrf_token: "x".repeat(40) },
      })
      const config = { method: "post", headers: {} }
      await requestHandler!(config)
      expect(mockAxios.get).toHaveBeenCalledWith(
        "http://test/auth/csrf",
        expect.objectContaining({ withCredentials: true })
      )
      expect(config.headers["X-CSRF-Token"]).toBe("x".repeat(40))
    })

    it("reuses a stored CSRF token without refetching", async () => {
      localStorage.setItem("csrf_token", "y".repeat(40))
      await loadApi()
      const config = { method: "post", headers: {} }
      await requestHandler!(config)
      expect(mockAxios.get).not.toHaveBeenCalled()
      expect(config.headers["X-CSRF-Token"]).toBe("y".repeat(40))
    })

    it("does not attach an invalid (short) stored token", async () => {
      localStorage.setItem("csrf_token", "short")
      await loadApi()
      mockAxios.get.mockResolvedValue({ data: {} })
      const config = { method: "post", headers: {} }
      await requestHandler!(config)
      expect(config.headers["X-CSRF-Token"]).toBeUndefined()
    })
  })

  describe("response interceptor", () => {
    it("retries the original request after a successful refresh", async () => {
      await loadApi()
      apiFn.mockResolvedValueOnce({ data: { ok: true } })
      mockAxios.post.mockResolvedValue({
        data: { csrf_token: "z".repeat(40) },
      })
      const error = {
        config: {},
        response: { status: 401 },
      }
      await errorHandler!(error)
      expect(mockAxios.post).toHaveBeenCalledWith(
        "http://test/auth/refresh",
        {},
        { withCredentials: true }
      )
      expect(localStorage.getItem("csrf_token")).toBe("z".repeat(40))
      expect(apiFn).toHaveBeenCalledWith(error.config)
    })

    it("does not retry twice on a repeated 401", async () => {
      await loadApi()
      const error = {
        config: { _retry: true },
        response: { status: 401 },
      }
      await expect(errorHandler!(error)).rejects.toBe(error)
      expect(mockAxios.post).not.toHaveBeenCalled()
    })

    it("clears session and redirects to /login when refresh fails", async () => {
      await loadApi()
      localStorage.setItem("csrf_token", "a".repeat(40))
      localStorage.setItem("user", '{"username":"alice"}')
      Object.defineProperty(window, "location", {
        value: { href: "http://test/dashboard" },
        writable: true,
      })
      mockAxios.post.mockRejectedValue(new Error("refresh failed"))
      const error = {
        config: {},
        response: { status: 401 },
      }
      await expect(errorHandler!(error)).rejects.toBe(error)
      expect(localStorage.getItem("csrf_token")).toBeNull()
      expect(localStorage.getItem("user")).toBeNull()
      expect(window.location.href).toBe("/login")
    })

    it("does not redirect on a network error (no response)", async () => {
      await loadApi()
      Object.defineProperty(window, "location", {
        value: { href: "http://test/dashboard" },
        writable: true,
      })
      const error = {
        config: {},
        request: {},
        message: "Network Error",
      }
      await expect(errorHandler!(error)).rejects.toBe(error)
      expect(mockAxios.post).not.toHaveBeenCalled()
      expect(window.location.href).toBe("http://test/dashboard")
    })

    it("propagates non-401 errors unchanged", async () => {
      await loadApi()
      const error = {
        config: {},
        response: { status: 500 },
      }
      await expect(errorHandler!(error)).rejects.toBe(error)
      expect(mockAxios.post).not.toHaveBeenCalled()
    })
  })
})
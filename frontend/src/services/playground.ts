import api from "./api"

export interface PlaygroundPayload {
  input: string
  source: string
  body?: string
  path?: string
  headers?: Record<string, string>
}

export interface PlaygroundResult {
  input: string
  findings: {
    type: string
    score: number
    source: string
    evidence?: string
  }[]
  effective_score: number
  severity: string
  verdict: "BLOCK" | "ALLOW"
  mode: string
}

export const playgroundService = {
  async test(payload: PlaygroundPayload): Promise<PlaygroundResult> {
    const res = await api.post("/waf/test", payload)
    return res.data
  },

  async testPublic(payload: PlaygroundPayload): Promise<PlaygroundResult> {
    const res = await api.post("/public/playground/test", payload)
    return res.data
  },
}

const b64encode = (s: string) => {
  if (typeof window === "undefined") return encodeURIComponent(s)
  return btoa(unescape(encodeURIComponent(s)))
}

const b64decode = (s: string) => {
  try {
    if (typeof window === "undefined") return decodeURIComponent(s)
    return decodeURIComponent(escape(atob(s)))
  } catch {
    return ""
  }
}

export function buildShareUrl(payload: PlaygroundPayload): string {
  const data = {
    i: payload.input,
    s: payload.source,
    b: payload.body ?? "",
    p: payload.path ?? "/",
  }
  const encoded = b64encode(JSON.stringify(data))
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/playground?p=${encoded}`
      : `/playground?p=${encoded}`
  return base
}

export function parseShareUrl(search: string): PlaygroundPayload | null {
  const params = new URLSearchParams(search)
  const encoded = params.get("p")
  if (!encoded) return null
  try {
    const data = JSON.parse(b64decode(encoded))
    return {
      input: data.i ?? "",
      source: data.s ?? "query",
      body: data.b ?? "",
      path: data.p ?? "/",
    }
  } catch {
    return null
  }
}

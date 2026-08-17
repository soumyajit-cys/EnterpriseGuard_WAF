import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/services/waf", () => ({
  wafService: {
    testPayload: vi.fn(),
    getAuditLogs: vi.fn(),
  },
}))

const toastMock = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock("sonner", () => toastMock)

import { wafService } from "@/services/waf"
import PlaygroundPage from "./page"

const RESULT = {
  input: "id=1' OR 1=1--",
  findings: [
    {
      type: "SQL_INJECTION",
      score: 85,
      source: "query",
      evidence: "1' OR 1=1--",
    },
  ],
  effective_score: 95,
  severity: "critical",
  verdict: "BLOCK",
  mode: "prevention",
}

describe("PlaygroundPage smoke test", () => {
  it("renders without crashing", () => {
    render(<PlaygroundPage />)
    expect(
      screen.getByText("Rule Testing Playground")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/e\.g\. 1' OR 1=1--/)
    ).toBeInTheDocument()
  })

  it("runs a payload and renders the detection verdict", async () => {
    vi.mocked(wafService.testPayload).mockResolvedValue(RESULT)
    const user = userEvent.setup()
    render(<PlaygroundPage />)

    const textarea = screen.getByPlaceholderText(/e\.g\. 1' OR 1=1--/)
    await user.type(textarea, "id=1' OR 1=1--")
    await user.click(screen.getByRole("button", { name: /Run Detection/i }))

    await waitFor(() => {
      expect(wafService.testPayload).toHaveBeenCalledWith({
        input: "id=1' OR 1=1--",
        source: "query",
        body: "",
      })
    })
    expect(await screen.findByText("BLOCK")).toBeInTheDocument()
    expect(screen.getByText("95")).toBeInTheDocument()
    expect(screen.getByText("SQL_INJECTION")).toBeInTheDocument()
    expect(screen.getByText("critical")).toBeInTheDocument()
  })

  it("shows an error toast when the API call fails", async () => {
    vi.mocked(wafService.testPayload).mockRejectedValue(
      new Error("network down")
    )
    const user = userEvent.setup()
    render(<PlaygroundPage />)

    const textarea = screen.getByPlaceholderText(/e\.g\. 1' OR 1=1--/)
    await user.type(textarea, "x")
    await user.click(screen.getByRole("button", { name: /Run Detection/i }))

    await waitFor(() => {
      expect(toastMock.toast.error).toHaveBeenCalledWith(
        "Test failed",
        expect.any(Object)
      )
    })
  })
})
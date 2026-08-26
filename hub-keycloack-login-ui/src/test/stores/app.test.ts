import { describe, it, expect } from "vitest"
import { useAppStore } from "stores/app"

// Note: Zustand store is created at import time. We interact with its API directly.

describe("useAppStore", () => {
  it("has initial state for loader and language", () => {
    const state = useAppStore.getState()
    expect(state.loader).toBe(true)
    expect(state.language).toBe("es")
  })

  it("updates loader via setLoader", () => {
    const { setLoader } = useAppStore.getState()
    setLoader(false)
    expect(useAppStore.getState().loader).toBe(false)
  })

  it("updates language via setLanguage", () => {
    const { setLanguage } = useAppStore.getState()
    setLanguage("en")
    expect(useAppStore.getState().language).toBe("en")
  })
})

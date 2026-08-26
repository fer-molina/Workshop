import { describe, it, expect } from "vitest"
import { useMicrositeConfigsStore } from "stores/partnerConfigs"

describe("partnerConfigs store", () => {
  it("has initial configs and updates by merging", () => {
    const state1 = useMicrositeConfigsStore.getState()
    expect(state1.configs).toBeDefined()
    expect(state1.configs?.butterActive).toBe(true)

    const prev = state1.configs
    state1.updateConfigs({ partner: "abc", flags: { a: 1 } } as any)

    const state2 = useMicrositeConfigsStore.getState()
    expect(state2.configs?.partner).toBe("abc")
    expect((state2.configs as any).flags).toEqual({ a: 1 })
    // unchanged fields persist
    expect(state2.configs?.butterActive).toBe(prev?.butterActive)
  })
})

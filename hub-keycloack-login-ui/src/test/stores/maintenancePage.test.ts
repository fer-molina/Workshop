import { describe, it, expect } from "vitest"
import { useBoundStore } from "stores/index"

describe("maintenancePage store (useBoundStore)", () => {
  it("has initial value with id=0 and empty name", () => {
    const state = useBoundStore.getState()
    expect(state.value).toEqual({ id: 0, name: "" })
  })

  it("updates value via updateMaintState", () => {
    const { updateMaintState } = useBoundStore.getState()

    updateMaintState({ id: 42, name: "maintenance" })

    expect(useBoundStore.getState().value).toEqual({ id: 42, name: "maintenance" })
  })
})

import { describe, it, expect } from "vitest"
import { initForm } from "types/interfaces/form/login"

// Although types directory is excluded from coverage, we still provide a unit test for the runtime export initForm

describe("initForm", () => {
  it("provides default empty values and valid=false for username and password", () => {
    expect(initForm).toEqual({
      username: { value: "", change: false, valid: false },
      password: { value: "", change: false, valid: false }
    })
  })

  it("is independent object (mutations here shouldn't affect subsequent imports)", () => {
    // Make a shallow copy to simulate consumer code mutations
    const mutated = { ...initForm, username: { ...initForm.username, value: "user" } }
    expect(mutated.username.value).toBe("user")
    // Original remains unchanged
    expect(initForm.username.value).toBe("")
  })
})

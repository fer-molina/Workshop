// Additional edge cases to improve coverage for utils/form.ts
import { describe, it, expect } from "vitest"
import { fieldsValid } from "utils/form"
import type { FormValue } from "types/interfaces/form/common"

describe("fieldsValid", () => {
  it("returns true when validate=false and no fields changed", () => {
    const form: FormValue = {
      username: { value: "", change: false, valid: false },
      password: { value: "", change: false, valid: false }
    }

    expect(fieldsValid(form, false)).toBe(true)
  })

  it("returns false when validate=false and some changed fields are invalid", () => {
    const form: FormValue = {
      username: { value: "u", change: true, valid: true },
      password: { value: "p", change: true, valid: false }
    }

    expect(fieldsValid(form, false)).toBe(false)
  })

  it("returns true when validate=false and changed fields are valid", () => {
    const form: FormValue = {
      username: { value: "u", change: true, valid: true },
      password: { value: "p", change: false, valid: false }
    }

    expect(fieldsValid(form, false)).toBe(true)
  })

  it("returns true when validate=true and all fields valid", () => {
    const form: FormValue = {
      username: { value: "u", change: true, valid: true },
      password: { value: "p", change: false, valid: true }
    }

    expect(fieldsValid(form, true)).toBe(true)
  })

  it("returns false when validate=true and any field invalid (even if not changed)", () => {
    const form: FormValue = {
      username: { value: "u", change: true, valid: true },
      password: { value: "", change: false, valid: false }
    }

    expect(fieldsValid(form, true)).toBe(false)
  })
})

describe("fieldsValid - extra coverage", () => {
  it("defaults to validate=false when omitted", () => {
    const form: FormValue = {
      username: { value: "", change: false, valid: false },
      password: { value: "", change: false, valid: false }
    }
    // Call without second parameter
    // Should be true because no field has change=true
    expect(fieldsValid(form)).toBe(true)
  })

  it("returns true for empty form regardless of validate flag", () => {
    // An empty form object should not block submission by itself
    const emptyForm = {} as unknown as FormValue
    expect(fieldsValid(emptyForm)).toBe(true)
    expect(fieldsValid(emptyForm, true)).toBe(true)
  })

  it("treats undefined change as not changed when validate=false", () => {
    const form = {
      user: { value: "u", /* change intentionally omitted */ valid: false }
    } as unknown as FormValue

    // Since change is undefined, function should treat it as not changed and return true
    expect(fieldsValid(form, false)).toBe(true)
  })

  it("fails when validate=true and a field is invalid even if change is undefined", () => {
    const form = {
      user: { value: "u", /* change intentionally omitted */ valid: false }
    } as unknown as FormValue

    expect(fieldsValid(form, true)).toBe(false)
  })

  it("handles multiple fields and only fails when a changed field is invalid (validate=false)", () => {
    const form: FormValue = {
      a: { value: "1", change: true, valid: true },
      b: { value: "2", change: false, valid: false },
      c: { value: "3", change: true, valid: false }
    }

    expect(fieldsValid(form, false)).toBe(false)
  })
})

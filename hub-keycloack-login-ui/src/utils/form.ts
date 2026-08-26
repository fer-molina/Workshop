//types
import type { FormValue, Values } from "types/interfaces/form/common"

export function fieldsValid(formData: FormValue, validate = false): boolean {
  if (validate) {
    return Object.values(formData).every((field: Values) => field.valid)
  } else {
    return Object.values(formData).every((field: Values) => (field.change === true ? field.valid : true))
  }
}

import type { Values } from "./common"

export const initForm = {
  username: {
    value: "",
    change: false,
    valid: false
  },
  password: {
    value: "",
    change: false,
    valid: false
  }
}

export interface LoginForm {
  username: Values
  password: Values
}

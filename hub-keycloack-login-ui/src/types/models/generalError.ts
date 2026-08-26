export interface GeneralError {
  page?: boolean
  image?: string
  title?: string
  description?: string
  buttonTextContinue?: string
  buttonUrlContinue?: string
  buttonTextCancel?: string
  buttonUrlCancel?: string
  buttonCancelClose?: boolean
}

export interface DataError {
  data: {
    error?: GeneralError
    matchedError?: boolean
  }
}

export interface GeneralErrorWindow {
  language?: string
  codeError?: string
  traceId?: string
  client_id?: string
}

export const defaultGeneralError: GeneralError = {
  page: true,
  title: "Error inesperado",
  description: "Ha ocurrido un error inesperado. Por favor, intenta nuevamente más tarde.",
  image: "https://cdn.buttercms.com/IaZcprhJSGqKYiIFKIzS",
  buttonTextContinue: "Ir a mi cuenta"
}

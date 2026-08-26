export function saveLocalStorage(name: string, value: string) {
  // Store an item value in localStorage
  if (typeof Storage !== "undefined") {
    localStorage.setItem(name, value)
  }
}

export function getLocalStorage(name: string) {
  // Get an item value from localStorage
  if (typeof Storage !== "undefined") {
    return localStorage.getItem(name)
  }
  return undefined
}

export function removeLocalStorage(name: string) {
  if (typeof Storage !== "undefined") {
    localStorage.removeItem(name)
  }
}

import * as packageJson from "../../package.json"

export function getHourHash(init = false) {
  const date = new Date()
  let hourHash = init ? "?" : ""
  hourHash += date.getDate() + (date.getMonth() + 1) + date.getFullYear() + date.getHours() + packageJson.version.replaceAll(".", "")
  return hourHash
}

export function getHash(init = false) {
  let hourHash = init ? "?" : ""
  hourHash += Date.now() + packageJson.version.replaceAll(".", "")
  return hourHash
}

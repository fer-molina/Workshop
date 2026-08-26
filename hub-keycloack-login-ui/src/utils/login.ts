export function getDeviceInfo() {
  // Detect device information from user agent
  const userAgent = window.navigator.userAgent
  let os = ""
  let osVersion = ""
  let deviceManufacturer = ""
  let deviceModel = ""

  // Parse user agent to determine OS and device details
  if (userAgent.includes("Windows")) {
    os = "Windows"
    const regex = /Windows NT (\d+\.\d+)/
    const match = regex.exec(userAgent)
    if (match) {
      osVersion = match[1]
    }
  } else if (/Macintosh|Mac OS X/.test(userAgent)) {
    os = "MacOS"
    const regex = /Mac OS X (\d+[._]\d+)/
    const match = regex.exec(userAgent)
    if (match) {
      osVersion = match ? match[1].replace("_", ".") : ""
    }
  } else if (userAgent.includes("Android")) {
    os = "Android"
    const regex = /Android (\d+\.\d+)/
    const match = regex.exec(userAgent)
    if (match) {
      osVersion = match ? match[1] : ""
    }

    const regexDevice = /;\s*([^;]+)\s+Build/
    const deviceMatch = regexDevice.exec(userAgent)
    if (deviceMatch) {
      const parts = deviceMatch[1].split(" ")
      deviceManufacturer = parts[0]
      deviceModel = parts.slice(1).join(" ")
    }
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    os = "iOS"
    const regex = /OS (\d+_\d+)/
    const match = regex.exec(userAgent)
    if (match) {
      osVersion = match ? match[1].replace("_", ".") : ""
    }
    const regexDevice = /(iPhone|iPad|iPod)/
    const deviceMatch = regexDevice.exec(userAgent)
    deviceModel = deviceMatch ? deviceMatch[1] : ""
    deviceManufacturer = "Apple"
  } else if (userAgent.includes("Linux")) {
    os = "Linux"
  }

  // Return all collected device information
  return {
    userAgent,
    os: os,
    osVersion: osVersion,
    deviceModel: deviceModel,
    deviceManufacturer: deviceManufacturer,
    appClientLanguage: window.navigator.language
  }
}

/* eslint eslint-comments/no-use: off -- Disable id-denylist */

import type { ReactNode } from "react"

export interface MaintenancePage {
  maintenancePaths: string[]
  logo: string
  content: string
}

export interface MaintenanceConfigs {
  maintenancePaths?: string[]
  logo?: string
  content?: string
}

export interface MaintenanceData {
  // eslint-disable-next-line id-denylist -- data is defined in package
  data?: MaintenanceConfigs
}

export interface MaintenancePageProps {
  children: ReactNode
  maintenancePage?: MaintenanceConfigs
}

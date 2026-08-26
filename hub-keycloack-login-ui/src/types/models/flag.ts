import type { AnyValue } from "types/common"
import type { ReactNode } from "react"

export interface Microsite {
  id: string
  status: boolean
}

export interface Flag {
  id: string
  microsites: Microsite[]
  functionality: AnyValue[]
}

export interface FlagData {
  config?: Flag[]
}

export interface FlagProps {
  children: ReactNode
  flagData?: FlagData
}

export interface FlagStoreValues {
  flags: FlagData
  updateFlags: (flag: FlagData) => void
}

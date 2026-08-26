import type { StateCreator } from "zustand"

interface User {
  id: number
  name: string
}

export interface MaintenancePageSlice {
  value: User
  updateMaintState: (value: User) => void
}

const initialVal: User = {
  id: 0,
  name: ""
}

export const createMaintenanceStore: StateCreator<MaintenancePageSlice> = (set) => ({
  value: initialVal,
  updateMaintState: (value) => {
    set({ value })
  }
})

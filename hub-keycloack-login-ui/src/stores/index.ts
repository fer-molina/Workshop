import { create } from "zustand"
//Stores
import { createMaintenanceStore, type MaintenancePageSlice } from "./maintenancePage"

export const useBoundStore = create<MaintenancePageSlice>((...init) => ({
  ...createMaintenanceStore(...init)
}))

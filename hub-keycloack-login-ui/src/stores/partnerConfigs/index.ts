import { create } from "zustand"
//types
import type { ConfigsData } from "types/models/configs"

interface MicrositeStoreValues {
  configs?: ConfigsData
  updateConfigs: (configs: ConfigsData) => void
}

const initialState = {
  partner: "",
  flags: {},
  seo: {},
  geolocation: {},
  butterActive: true
}

export const useMicrositeConfigsStore = create<MicrositeStoreValues>((set) => ({
  configs: initialState,
  updateConfigs: (configs) => set((state) => ({ configs: { ...state.configs, ...configs } }))
}))

import { create } from "zustand"
import type { KeycloakConfig } from "types/common"

interface LoaderStoreValues {
  loader: boolean
  setLoader: (loader: boolean) => void
  language: string
  setLanguage: (language: string) => void
  keycloakConfig: KeycloakConfig | null
  setKeycloakConfig: (keycloakConfig: KeycloakConfig | null) => void
}

export const useAppStore = create<LoaderStoreValues>((set) => ({
  loader: true,
  setLoader: (loader) => set({ loader }),
  language: "es",
  setLanguage: (language) => set({ language }),
  keycloakConfig: null,
  setKeycloakConfig: (keycloakConfig) => set({ keycloakConfig })
}))

import type { Plugin as VitePlugin } from "vite"

declare function ViteLoadEnv(): VitePlugin
export { ViteLoadEnv }

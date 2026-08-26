/// <reference types="vitest" />

import { defineConfig, loadEnv, normalizePath } from "vite"
import react from "@vitejs/plugin-react-swc"
import { createHtmlPlugin } from "vite-plugin-html"
import { viteStaticCopy } from "vite-plugin-static-copy"
import path from "path"
import PACKAGE from "./package.json"

const NO_PRD_MFE_FOLDER = "https://d2ptwux79zic3h.cloudfront.net/v1/lm-tecnologias-interactivas"
const DEV_FOLDER_URL = `${NO_PRD_MFE_FOLDER}/hub-keycloak-login-ui/dev`
const QA_FOLDER_URL = `${NO_PRD_MFE_FOLDER}/hub-keycloak-login-ui/qa`
const UAT_FOLDER_URL = `${NO_PRD_MFE_FOLDER}/hub-keycloak-login-ui/uat`
const QAS_FOLDER_URL = `${NO_PRD_MFE_FOLDER}/hub-keycloak-login-ui/qas`

const PRD_MFE_FOLDER = "https://d296xu67oj0g2g.cloudfront.net/v1/lm-tecnologias-interactivas"
const PRD_FOLDER_URL = `${PRD_MFE_FOLDER}/hub-keycloak-login-ui/prd`

const LOCAL_FOLDER_URL = "http://localhost:8012"

//Get version project
const version = PACKAGE.version.replace(/\./g, "")
const buildHash = `${version}-${Date.now()}`
const buildPath = normalizePath(path.resolve(__dirname, "./dist"))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const htmlPlugin = []

  if (mode === "development") {
    htmlPlugin.push(
      createHtmlPlugin({
        minify: true,
        entry: "/src/main.tsx",
        template: "index-local.html",
        inject: {
          data: {
            envConfigJs: `${LOCAL_FOLDER_URL}/env-config.js?v=${buildHash}`
          }
        }
      })
    )
  } else {
    htmlPlugin.push(
      createHtmlPlugin({
        pages: [
          {
            entry: "/src/main.tsx",
            template: "index-dev.html",
            filename: "index-dev.html",
            injectOptions: {
              data: {
                envConfigJs: `${DEV_FOLDER_URL}/env-config.js?v=${buildHash}`
              }
            }
          },
          {
            entry: "/src/main.tsx",
            template: "index-qa.html",
            filename: "index-qa.html",
            injectOptions: {
              data: {
                envConfigJs: `${QA_FOLDER_URL}/env-config.js?v=${buildHash}`
              }
            }
          },
          {
            entry: "/src/main.tsx",
            template: "index-qas.html",
            filename: "index-qas.html",
            injectOptions: {
              data: {
                envConfigJs: `${QAS_FOLDER_URL}/env-config.js?v=${buildHash}`
              }
            }
          },
          {
            entry: "/src/main.tsx",
            template: "index-uat.html",
            filename: "index-uat.html",
            injectOptions: {
              data: {
                envConfigJs: `${UAT_FOLDER_URL}/env-config.js?v=${buildHash}`
              }
            }
          },
          {
            entry: "/src/main.tsx",
            template: "index.html",
            filename: "index.html",
            injectOptions: {
              data: {
                envConfigJs: `${PRD_FOLDER_URL}/env-config.js?v=${buildHash}`
              }
            }
          }
        ]
      })
    )
  }

  return {
    define: { "process.env": JSON.stringify(env) },
    base: "/",
    plugins: [
      react(),
      htmlPlugin,
      mode === "development" &&
        viteStaticCopy({
          targets: [
            {
              src: normalizePath(path.resolve(__dirname, "env-config.js")),
              dest: buildPath
            }
          ]
        })
    ],
    css: {
      modules: {
        scopeBehaviour: "local",
        generateScopedName: "hub-keycloak-login-ui__[local]"
      }
    },
    build: {
      sourcemap: mode === "development",
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name][extname]`
        }
      },
      terserOptions: {
        compress: {
          drop_console: mode !== "development",
          drop_debugger: mode !== "development",
          pure_funcs: mode !== "development" ? ["console.log", "console.info", "console.debug"] : [],
          passes: 2, // Múltiples pasadas para mejor optimización
          ecma: 2015,
          // Optimizaciones adicionales
          toplevel: true,
          unsafe_math: true,
          unsafe_methods: true,
          reduce_vars: true,
          reduce_funcs: true
        },
        format: {
          comments: false
        }
      }
    },
    server: {
      port: 8012
    },
    preview: {
      port: 8012
    },
    // Optimizaciones adicionales
    esbuild: {
      target: "esnext",
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      treeShaking: true,
      legalComments: "none"
    },
    resolve: {
      alias: {
        api: path.resolve(__dirname, "./src/api"),
        css: path.resolve(__dirname, "./src/css"),
        routes: path.resolve(__dirname, "./src/routes"),
        views: path.resolve(__dirname, "./src/views"),
        assets: path.resolve(__dirname, "./src/assets"),
        components: path.resolve(__dirname, "./src/components"),
        request: path.resolve(__dirname, "./src/request"),
        stores: path.resolve(__dirname, "./src/stores"),
        utils: path.resolve(__dirname, "./src/utils"),
        types: path.resolve(__dirname, "./src/types"),
        events: path.resolve(__dirname, "./src/events"),
        hooks: path.resolve(__dirname, "./src/hooks"),
        // Added aliases to support importing/mocking "src/constants" and "constants"
        src: path.resolve(__dirname, "./src"),
        constants: path.resolve(__dirname, "./src/constants.ts"),
        react: path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
        "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom"),
        "crypto-js": path.resolve(__dirname, "./node_modules/crypto-js")
      },
      dedupe: ["react", "react-dom", "react-router-dom"]
    },
    test: {
      root: "./",
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setupTests.ts",

      coverage: {
        provider: "v8", // Puedes usar 'v8' o 'c8', elige uno según tus necesidades
        reporter: ["text", "json", "html"], // Reporte en texto, json y html (HTML es muy útil para ver los resultados en el navegador)
        include: ["src/**/*.ts", "src/**/*.tsx"], // Especifica qué archivos se deben incluir en la cobertura (normalmente tu código fuente)
        exclude: [
          "node_modules",
          "src/types/**/*",
          "src/tests/**/*",
          "src/plugin/**/*",
          "src/constants.ts",
          "src/global.d.ts",
          "src/vite-env.d.ts",
          "src/RootComponent.tsx",
          "src/views/App/index.tsx",
          "src/main.tsx",
          "src/test/mocks/**/*"
        ] // Especifica qué archivos se deben excluir (por ejemplo, tests y node_modules)
      }
    },
    // Include these polyfills
    optimizeDeps: {
      include: ["core-js", "regenerator-runtime"]
    }
  }
})

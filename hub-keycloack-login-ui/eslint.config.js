// ESLint v9 flat config
// Migrated from .eslintrc.cjs and .eslintignore

import js from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import eslintComments from "eslint-plugin-eslint-comments"
import globals from "globals"

export default [
  // Ignores migrated from .eslintignore
  {
    ignores: [
      "node_modules",
      "public",
      "build",
      "dist",
      "deploy",
      "*.d.ts",
      "env-config.js",
      "uno.config.ts",
      ".npmrc",
      ".eslintrc.cjs",
      "eslint.config.js",
      ".commitlintrc.ts",
      ".*.ts",
      "vite.config.ts",
      "vite-config.ts"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "eslint-comments": eslintComments,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      //Recommended
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "array-callback-return": ["error", { allowImplicit: true }],
      "for-direction": "error",
      "no-async-promise-executor": "error",
      "no-await-in-loop": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-condition": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-empty-character-class": "error",
      "no-ex-assign": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-loss-of-precision": "error",
      "no-new-native-nonconstructor": "error",
      "no-obj-calls": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-negation": "error",
      "no-unused-vars": "off",
      "no-use-before-define": "off",
      "use-isnan": "error",
      "valid-typeof": "error",
      "block-scoped-var": "error",
      "capitalized-comments": ["off", "always", { ignoreInlineComments: true }],
      "default-case": "error",
      "default-case-last": "error",
      "id-denylist": ["off", "err", "e", "cb", "callback"],
      "max-depth": ["error", 5],
      "init-declarations": ["error", "always"],
      "max-lines-per-function": ["off", 50],
      "max-nested-callbacks": ["error", 4],
      "max-params": ["error", 4],
      "no-alert": "error",
      "no-bitwise": "error",
      "no-console": "error",
      "no-empty": "error",
      "no-empty-function": ["error", { allow: ["arrowFunctions"] }],
      "no-eval": "error",
      "no-global-assign": "error",
      "no-implicit-coercion": "error",
      "no-negated-condition": "off",
      "no-nested-ternary": "off",
      "no-script-url": "error",
      "no-redeclare": "error",
      "no-useless-return": "error",
      "prefer-const": "error",
      "require-await": "off",

      //typescript-eslint
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/ban-types": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/consistent-type-definitions": "error",
      // disabled because they require type-aware linting (parserOptions.project)
      "@typescript-eslint/consistent-type-exports": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/default-param-last": "warn",
      "@typescript-eslint/member-ordering": "warn",
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "variable", format: ["snake_case", "PascalCase", "camelCase", "UPPER_CASE"] },
        { selector: "typeLike", format: ["PascalCase"] }
      ],
      "@typescript-eslint/no-array-delete": "warn",
      "@typescript-eslint/no-confusing-non-null-assertion": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-duplicate-type-constituents": "error",
      "@typescript-eslint/no-empty-interface": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-invalid-void-type": "error",
      "@typescript-eslint/no-meaningless-void-operator": "warn",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-throw-literal": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-qualifier": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/no-unnecessary-type-parameters": "warn",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/prefer-function-type": "warn",
      "@typescript-eslint/prefer-includes": "warn",
      "@typescript-eslint/prefer-literal-enum-member": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/prefer-readonly": "off",
      "@typescript-eslint/prefer-reduce-type-parameter": "warn",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/prefer-return-this-type": "warn",
      "@typescript-eslint/require-array-sort-compare": "off",
      "@typescript-eslint/unified-signatures": "warn",

      //eslint-comments
      "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
      "eslint-comments/no-aggregating-enable": "error",
      "eslint-comments/no-duplicate-disable": "error",
      "eslint-comments/no-unlimited-disable": "error",
      "eslint-comments/no-unused-disable": "error",
      "eslint-comments/no-unused-enable": "error",
      "eslint-comments/no-use": [
        "error",
        {
          allow: ["eslint-disable", "eslint-disable-line", "eslint-disable-next-line", "eslint-enable"]
        }
      ]
    }
  }
]

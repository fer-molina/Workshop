import { UserConfig, RuleConfigSeverity } from "@commitlint/types"

const Configuration: UserConfig = {
  formatter: "@commitlint/format",
  rules: {
    "jira-commit-pattern": [RuleConfigSeverity.Error, "always"],
    "type-empty": [RuleConfigSeverity.Error, "never"],
    ticket: [RuleConfigSeverity.Error, "never"],
    "scope-empty": [RuleConfigSeverity.Error, "never"],
    "subject-empty": [RuleConfigSeverity.Error, "never"]
  },
  parserPreset: {
    parserOpts: {
      headerPattern: /^(WEB|MOD)-([0-9]+) \[([\w\s\-]+)\] - (.+)$/,
      headerCorrespondence: ["type", "ticket", "scope", "subject"]
    }
  },
  plugins: [
    {
      rules: {
        "jira-commit-pattern": (parsed) => {
          const { type, ticket, scope, subject } = parsed

          if (type == null || ticket == null || scope == null || subject == null) {
            return [false, "header must be in format (WEB|MOD)-#### [scope] - subject"]
          }

          return [true, ""]
        },
        ticket: (parsed) => {
          const { ticket } = parsed

          if (ticket == null) return [false, "number of ticket may not be empty"]

          return [true, ""]
        }
      }
    }
  ]
}

export default Configuration

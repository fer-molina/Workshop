# `lifemiles-test-realm.json` — Test-Only Fixture Realm

**This file is NOT a representation of the real LifeMiles Keycloak instance.**

## Purpose

`lifemiles-test-realm.json` exists exclusively so that Testcontainers can spin up an
ephemeral Keycloak container with the WebAuthn Passwordless authenticator already
active, without requiring a human to click through the Admin Console for every test run.

## The file name is significant — do not rename it

Keycloak imports everything it finds in `/opt/keycloak/data/import` through its **directory
import provider**, which derives the realm name from the *file name* using the
`<realmName>-realm.json` convention. The file name must therefore match the `realm` value
declared inside the JSON.

This fixture was originally named `keycloak-test-realm.json`, from which Keycloak derived
the realm name `keycloak-test`. It imported the JSON (creating `lifemiles-test`) and then
tried to bind the session to `keycloak-test`, which never existed, aborting container
startup with `Session not bound to a realm`. Renaming the file to match the realm resolved it.

If you change the realm name inside the JSON, rename the file to match.

## Relationship to the manual console guide

- The **real** Keycloak instance (dev/staging) is configured manually, step by step, via
  the Admin Console — see `docs/keycloak-console-setup.md`. No JSON export is used for
  that instance, per the project's decision to avoid realm-JSON-based provisioning for
  real environments.
- This fixture JSON is a **separate, test-only artifact**. It is imported automatically
  by `dasniko.testcontainers.keycloak.KeycloakContainer` when integration tests start, and
  is destroyed along with the container when tests finish.
- Keeping these two mechanisms separate means: (a) the real instance's configuration
  process stays 100% manual/console-driven as required, and (b) automated tests remain
  fast, isolated, and reproducible without depending on Docker for the real instance or
  a human for the test instance.

## Contents

- Realm: `lifemiles-test`
- One test client: `passkey-service-test`
- One test user: `testuser` (used as the subject for registration/authentication flow tests)
- WebAuthn Passwordless Policy: RP name `LifeMiles`, RP ID `localhost` (test-appropriate,
  since Testcontainers runs on `localhost`), user verification `required`, resident key
  `required`
- Browser flow: WebAuthn Passwordless Authenticator registered as `ALTERNATIVE`, alongside
  the default username/password form

## Do not

- Do not use this file as a template to configure the real Keycloak instance via import.
- Do not add real user data, secrets, or production-like credentials to this file — it is
  committed to source control and used only by automated tests.

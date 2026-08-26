package com.lifemiles.passkey.config;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.AuthenticationExecutionInfoRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the Testcontainers-managed, ephemeral Keycloak container starts correctly
 * with the test-only fixture realm ({@code lifemiles-test-realm.json}) and that the
 * WebAuthn Passwordless authenticator is present and active in the browser flow.
 *
 * <p><strong>Why the fixture file is named {@code lifemiles-test-realm.json}:</strong> Keycloak
 * imports everything it finds in {@code /opt/keycloak/data/import} through its directory import
 * provider, which derives the realm name from the <em>file name</em> using the
 * {@code <realmName>-realm.json} convention. A file named after anything other than the realm
 * (the fixture was previously {@code keycloak-test-realm.json}) makes Keycloak import the JSON
 * and then bind the session to a realm that was never created, aborting startup with
 * {@code Session not bound to a realm}. The file name must therefore match the {@code realm}
 * value declared inside it.</p>
 *
 * <p>This test is independent of the real Keycloak instance and its manual console
 * setup (see {@code docs/keycloak-console-setup.md}). It only exercises the ephemeral
 * fixture used for automated integration testing (see
 * {@code src/test/resources/README-fixture-realm.md}).</p>
 *
 * <p>Requires Docker to be available in the environment running the test (per the
 * project's confirmed decision to keep Testcontainers for integration tests).</p>
 */
class KeycloakFixtureRealmIT {

    /**
     * Pinned explicitly rather than relying on the library default: testcontainers-keycloak
     * deprecated the no-arg constructor from 4.2 onwards, and an exact tag is required by
     * SECURITY-10 (no floating image tags).
     */
    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:26.1";

    private static final String REALM_NAME = "lifemiles-test";
    private static final String BROWSER_FLOW_ALIAS = "lifemiles-test browser";
    private static final String WEBAUTHN_PASSWORDLESS_PROVIDER_ID = "webauthn-authenticator-passwordless";

    private static KeycloakContainer keycloakContainer;
    private static Keycloak adminClient;

    @BeforeAll
    static void startContainer() {
        keycloakContainer = new KeycloakContainer(KEYCLOAK_IMAGE)
            .withRealmImportFile("/lifemiles-test-realm.json");
        keycloakContainer.start();

        adminClient = KeycloakBuilder.builder()
            .serverUrl(keycloakContainer.getAuthServerUrl())
            .realm("master")
            .clientId("admin-cli")
            .username(keycloakContainer.getAdminUsername())
            .password(keycloakContainer.getAdminPassword())
            .build();
    }

    @AfterAll
    static void stopContainer() {
        if (adminClient != null) {
            adminClient.close();
        }
        if (keycloakContainer != null) {
            keycloakContainer.stop();
        }
    }

    @Test
    void fixtureRealmIsImportedAndReachable() {
        RealmRepresentation realmRepresentation = adminClient.realm(REALM_NAME).toRepresentation();

        assertThat(realmRepresentation.getRealm()).isEqualTo(REALM_NAME);
        assertThat(realmRepresentation.isEnabled()).isTrue();
    }

    @Test
    void webAuthnPasswordlessPolicyIsConfiguredForLifeMiles() {
        RealmRepresentation realmRepresentation = adminClient.realm(REALM_NAME).toRepresentation();

        assertThat(realmRepresentation.getWebAuthnPolicyPasswordlessRpEntityName()).isEqualTo("LifeMiles");
        assertThat(realmRepresentation.getWebAuthnPolicyPasswordlessUserVerificationRequirement())
            .isEqualTo("required");
        assertThat(realmRepresentation.getWebAuthnPolicyPasswordlessRequireResidentKey()).isEqualTo("Yes");
    }

    @Test
    void webAuthnPasswordlessAuthenticatorIsActiveAsAlternativeInBrowserFlow() {
        List<AuthenticationExecutionInfoRepresentation> executions =
            adminClient.realm(REALM_NAME).flows().getExecutions(BROWSER_FLOW_ALIAS);

        boolean webAuthnStepPresent = executions.stream()
            .anyMatch(execution ->
                WEBAUTHN_PASSWORDLESS_PROVIDER_ID.equals(execution.getProviderId())
                    && "ALTERNATIVE".equals(execution.getRequirement()));

        assertThat(webAuthnStepPresent)
            .as("WebAuthn Passwordless authenticator should be present as an ALTERNATIVE execution")
            .isTrue();
    }
}

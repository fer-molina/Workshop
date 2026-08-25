package com.lifemiles.passkey.config;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.AuthenticationExecutionInfoRepresentation;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the Testcontainers-managed, ephemeral Keycloak container starts correctly
 * with the test-only fixture realm ({@code keycloak-test-realm.json}) and that the
 * WebAuthn Passwordless authenticator is present and active in the browser flow.
 *
 * <p>This test is independent of the real Keycloak instance and its manual console
 * setup (see {@code docs/keycloak-console-setup.md}). It only exercises the ephemeral
 * fixture used for automated integration testing (see
 * {@code src/test/resources/README-fixture-realm.md}).</p>
 *
 * <p>Requires Docker to be available in the environment running the test (per the
 * project's confirmed decision to keep Testcontainers for integration tests).</p>
 */
@Testcontainers
class KeycloakFixtureRealmIT {

    private static final String REALM_NAME = "lifemiles-test";

    private static KeycloakContainer keycloakContainer;
    private static Keycloak adminClient;

    @BeforeAll
    static void startContainer() {
        keycloakContainer = new KeycloakContainer()
            .withRealmImportFile("/keycloak-test-realm.json");
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
        var realmRepresentation = adminClient.realm(REALM_NAME).toRepresentation();

        assertThat(realmRepresentation.getRealm()).isEqualTo(REALM_NAME);
        assertThat(realmRepresentation.isEnabled()).isTrue();
    }

    @Test
    void webAuthnPasswordlessAuthenticatorIsActiveAsAlternativeInBrowserFlow() {
        List<AuthenticationExecutionInfoRepresentation> executions =
            adminClient.realm(REALM_NAME).flows().getExecutions("lifemiles-test browser");

        boolean webAuthnStepPresent = executions.stream()
            .anyMatch(execution ->
                "webauthn-authenticator-passwordless".equals(execution.getProviderId())
                    && "ALTERNATIVE".equals(execution.getRequirement()));

        assertThat(webAuthnStepPresent)
            .as("WebAuthn Passwordless authenticator should be present as an ALTERNATIVE execution")
            .isTrue();
    }
}

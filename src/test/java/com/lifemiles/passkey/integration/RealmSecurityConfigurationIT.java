package com.lifemiles.passkey.integration;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.RealmEventsConfigRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Task 8 (configuration half) — asserts the realm-level security settings that Unit 3's application
 * code cannot enforce on its own (NFR-5, SECURITY-14, SECURITY-11 partial).
 *
 * <p><b>Why assert configuration at all.</b> Audit retention, event capture and brute-force
 * protection are Keycloak settings, so the only way they can be part of a test suite is by reading
 * them back from a running instance. Documenting them in a console guide and hoping is the
 * alternative, and it is how configuration silently drifts. These assertions turn the fixture realm
 * into the executable statement of what the real realm must also look like.</p>
 *
 * <p>Scope limit worth stating: this verifies the <em>fixture</em> realm. It cannot verify the real
 * LifeMiles realm, which is configured manually per {@code docs/keycloak-console-setup.md}. The
 * fixture is the specification, not the deployment.</p>
 */
class RealmSecurityConfigurationIT {

    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:26.1";
    private static final String REALM = "lifemiles-test";

    /** 90 days in seconds — the retention floor SECURITY-14 requires. */
    private static final int NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

    private static KeycloakContainer keycloakContainer;
    private static Keycloak adminClient;
    private static RealmRepresentation realm;
    private static RealmEventsConfigRepresentation eventsConfig;

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

        realm = adminClient.realm(REALM).toRepresentation();
        eventsConfig = adminClient.realm(REALM).getRealmEventsConfig();
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
    void userEventsAreCaptured() {
        assertThat(eventsConfig.isEventsEnabled())
            .as("without event capture there is no Keycloak-side audit trail at all (NFR-5)")
            .isTrue();
    }

    @Test
    void theCredentialLifecycleEventsPasskeyAuditingDependsOnAreEnabled() {
        // These four are the Passkey lifecycle as Keycloak sees it. The application-side audit log
        // from Unit 3 records what the API did; these record what Keycloak did, including ceremonies
        // that never touch our API.
        assertThat(eventsConfig.getEnabledEventTypes())
            .contains("REGISTER_CREDENTIAL", "REMOVE_CREDENTIAL", "LOGIN", "LOGIN_ERROR");
    }

    @Test
    void failureEventsAreCapturedAndNotOnlySuccesses() {
        assertThat(eventsConfig.getEnabledEventTypes())
            .as("an audit trail that only records successes cannot answer the questions audits exist for")
            .contains("LOGIN_ERROR", "REGISTER_CREDENTIAL_ERROR", "REMOVE_CREDENTIAL_ERROR");
    }

    @Test
    void eventRetentionMeetsTheNinetyDayFloor() {
        assertThat(eventsConfig.getEventsExpiration())
            .as("SECURITY-14 requires retention of at least 90 days")
            .isNotNull()
            .isGreaterThanOrEqualTo((long) NINETY_DAYS_SECONDS);
    }

    @Test
    void adminEventsAreCapturedWithDetail() {
        // Passkey deletion performed through the Admin API by this service surfaces as an admin
        // event, not a user event. Without this, API-driven revocations would be invisible on the
        // Keycloak side.
        assertThat(eventsConfig.isAdminEventsEnabled()).isTrue();
        assertThat(eventsConfig.isAdminEventsDetailsEnabled()).isTrue();
    }

    @Test
    void bruteForceProtectionIsActive() {
        assertThat(realm.isBruteForceProtected())
            .as("SECURITY-11 at the Keycloak level; the API gateway limit is separate, see EX-003")
            .isTrue();
        assertThat(realm.getFailureFactor()).isNotNull().isLessThanOrEqualTo(10);
    }

    @Test
    void lockoutIsTemporaryRatherThanPermanent() {
        // Permanent lockout turns a credential-stuffing attempt into a denial of service against the
        // legitimate account holder, so temporary lockout with a backoff is the safer default.
        assertThat(realm.isPermanentLockout()).isFalse();
        assertThat(realm.getMaxFailureWaitSeconds()).isNotNull().isPositive();
    }

    @Test
    void theWebAuthnPasswordlessPolicyStillRequiresUserVerificationAndResidentKeys() {
        // Re-asserted here because these two settings are what make the "attestation verified" and
        // "phishing resistant" BDD scenarios true. We cannot test those properties, but we can test
        // that the configuration they depend on has not drifted.
        assertThat(realm.getWebAuthnPolicyPasswordlessUserVerificationRequirement()).isEqualTo("required");
        assertThat(realm.getWebAuthnPolicyPasswordlessRequireResidentKey()).isEqualTo("Yes");
    }
}

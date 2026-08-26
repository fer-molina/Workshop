package com.lifemiles.passkey.service;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.exception.PasskeyNotFoundException;
import com.lifemiles.passkey.exception.PasskeyOperationForbiddenException;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for the Passkey services against a real Keycloak container and the Unit 1
 * fixture realm.
 *
 * <p><b>Why no test registers an actual Passkey.</b> WebAuthn credentials cannot be created through
 * the Keycloak Admin API — they only come into existence through the browser ceremony, which needs a
 * virtual authenticator. So this suite deliberately does not pretend to cover the ceremony; that is
 * Unit 4's job with Playwright.</p>
 *
 * <p>What it does cover is more valuable than a mock could be: the fixture user has a <em>real</em>
 * password credential, which means the type filter and the "not a Passkey" guard are exercised
 * against genuine Keycloak data rather than a hand-built {@code CredentialRepresentation}. The test
 * that an attempt to delete the user's password through this API is refused is the single most
 * important assertion in Unit 3 — without the guard, a Passkey management endpoint would be a
 * password-deletion endpoint.</p>
 */
class PasskeyManagementIT {

    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:26.1";
    private static final String REALM = "lifemiles-test";
    private static final String USERNAME = "testuser";
    private static final String UNKNOWN_ID = "99999999-9999-9999-9999-999999999999";

    private static KeycloakContainer keycloakContainer;
    private static Keycloak adminClient;
    private static PasskeyManagementService managementService;
    private static PasskeyRegistrationService registrationService;
    private static String subject;

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

        LifeMilesKeycloakProperties properties = new LifeMilesKeycloakProperties();
        properties.setRealm(REALM);

        PasskeyAuditLogger auditLogger = new PasskeyAuditLogger();
        managementService = new PasskeyManagementService(adminClient, properties, auditLogger);
        registrationService = new PasskeyRegistrationService(adminClient, properties, auditLogger);

        subject = findUserId();
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

    private static RealmResource realm() {
        return adminClient.realm(REALM);
    }

    private static String findUserId() {
        List<UserRepresentation> users = realm().users().searchByUsername(USERNAME, true);
        assertThat(users)
            .as("the fixture realm must contain the test user, otherwise this suite proves nothing")
            .hasSize(1);
        return users.get(0).getId();
    }

    private static String passwordCredentialId() {
        return realm().users().get(subject).credentials().stream()
            .filter(credential -> "password".equals(credential.getType()))
            .map(CredentialRepresentation::getId)
            .findFirst()
            .orElseThrow(() -> new AssertionError("the fixture user should have a password credential"));
    }

    @Test
    void theFixtureUserReallyDoesHaveANonPasskeyCredential() {
        // Guards the premise of the two refusal tests below: if the fixture user had no password
        // credential, those tests would pass for the wrong reason.
        assertThat(realm().users().get(subject).credentials())
            .extracting(CredentialRepresentation::getType)
            .contains("password");
    }

    @Test
    void listExcludesThePasswordCredential() {
        // Against real Keycloak data: the raw credentials endpoint returns the password, and the
        // service must not surface it as a Passkey.
        assertThat(managementService.list(subject))
            .as("a Passkey listing must never include non-WebAuthn credentials")
            .isEmpty();
    }

    @Test
    void deletingThePasswordCredentialThroughThePasskeyApiIsRefused() {
        String passwordId = passwordCredentialId();

        assertThatThrownBy(() -> managementService.delete(subject, passwordId))
            .isInstanceOf(PasskeyOperationForbiddenException.class);

        // And it must still be there afterwards — a refusal that still mutated state would be worse
        // than no refusal at all.
        assertThat(realm().users().get(subject).credentials())
            .extracting(CredentialRepresentation::getId)
            .contains(passwordId);
    }

    @Test
    void renamingThePasswordCredentialThroughThePasskeyApiIsRefused() {
        assertThatThrownBy(() -> managementService.rename(subject, passwordCredentialId(), "not a passkey"))
            .isInstanceOf(PasskeyOperationForbiddenException.class);
    }

    @Test
    void deletingAnUnknownCredentialYieldsNotFound() {
        assertThatThrownBy(() -> managementService.delete(subject, UNKNOWN_ID))
            .isInstanceOf(PasskeyNotFoundException.class);
    }

    @Test
    void renamingAnUnknownCredentialYieldsNotFound() {
        assertThatThrownBy(() -> managementService.rename(subject, UNKNOWN_ID, "whatever"))
            .isInstanceOf(PasskeyNotFoundException.class);
    }

    @Test
    void initiatingRegistrationSchedulesTheRequiredActionAndIsIdempotent() {
        // Use a dedicated user so the shared fixture user is not left with a pending action that
        // could affect the other tests in this class.
        String isolatedUserId = createIsolatedUser("enrolment-target");

        try {
            var first = registrationService.initiate(isolatedUserId);
            assertThat(first.alreadyPending()).isFalse();

            assertThat(realm().users().get(isolatedUserId).toRepresentation().getRequiredActions())
                .containsExactly("webauthn-register-passwordless");

            var second = registrationService.initiate(isolatedUserId);
            assertThat(second.alreadyPending())
                .as("a second call must report the action as already pending")
                .isTrue();

            assertThat(realm().users().get(isolatedUserId).toRepresentation().getRequiredActions())
                .as("the required action must not be duplicated")
                .containsExactly("webauthn-register-passwordless");
        } finally {
            realm().users().get(isolatedUserId).remove();
        }
    }

    private static String createIsolatedUser(String username) {
        UserRepresentation user = new UserRepresentation();
        user.setUsername(username);
        user.setEnabled(true);

        try (var response = realm().users().create(user)) {
            assertThat(response.getStatus())
                .as("could not create the isolated test user")
                .isEqualTo(201);
        }

        return realm().users().searchByUsername(username, true).get(0).getId();
    }
}

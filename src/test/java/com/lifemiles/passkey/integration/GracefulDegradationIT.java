package com.lifemiles.passkey.integration;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.exception.KeycloakUnavailableException;
import com.lifemiles.passkey.service.PasskeyManagementService;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import jakarta.ws.rs.client.ClientBuilder;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;

import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies NFR-3 as it is actually specified: a WebAuthn/Passkey failure must not affect password or
 * social login — <em>graceful degradation, not fail-open</em>.
 *
 * <p>That requirement has two halves and it is easy to test only the comfortable one. Both are
 * asserted here:</p>
 * <ol>
 *   <li><b>Passkey degrades closed.</b> With its Keycloak dependency unreachable, the management
 *       service raises {@link KeycloakUnavailableException} — which the API maps to 503. It does not
 *       return an empty list, which would be the dangerous failure: a user shown "you have no
 *       Passkeys" during an outage might reasonably conclude their credentials were deleted.</li>
 *   <li><b>Other methods are untouched.</b> A password grant against the real Keycloak still issues a
 *       token while the Passkey path is broken. This is the half that makes the claim meaningful:
 *       degradation is confined to the Passkey feature.</li>
 * </ol>
 *
 * <p>The failure is injected by pointing a second admin client at a closed port, rather than by
 * stopping the container. Stopping it would break both halves at once and prove nothing about
 * confinement.</p>
 */
class GracefulDegradationIT {

    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:26.1";
    private static final String REALM = "lifemiles-test";
    private static final String SUBJECT = "11111111-1111-1111-1111-111111111111";

    /** Reserved-for-documentation port that nothing listens on, so connections fail fast. */
    private static final String UNREACHABLE_URL = "http://127.0.0.1:9";

    private static KeycloakContainer keycloakContainer;
    private static PasskeyManagementService serviceWithBrokenDependency;

    @BeforeAll
    static void startContainer() {
        keycloakContainer = new KeycloakContainer(KEYCLOAK_IMAGE)
            .withRealmImportFile("/lifemiles-test-realm.json");
        keycloakContainer.start();

        LifeMilesKeycloakProperties properties = new LifeMilesKeycloakProperties();
        properties.setRealm(REALM);

        Keycloak brokenClient = KeycloakBuilder.builder()
            .serverUrl(UNREACHABLE_URL)
            .realm("master")
            .clientId("admin-cli")
            .grantType(OAuth2Constants.PASSWORD)
            .username("admin")
            .password("admin")
            // Short timeouts so the test fails fast rather than waiting on the default.
            .resteasyClient(ClientBuilder.newBuilder()
                .connectTimeout(2, TimeUnit.SECONDS)
                .readTimeout(2, TimeUnit.SECONDS)
                .build())
            .build();

        serviceWithBrokenDependency =
            new PasskeyManagementService(brokenClient, properties, new PasskeyAuditLogger());
    }

    @AfterAll
    static void stopContainer() {
        if (keycloakContainer != null) {
            keycloakContainer.stop();
        }
    }

    @Test
    void passkeyManagementDegradesClosedWhenKeycloakIsUnreachable() {
        assertThatThrownBy(() -> serviceWithBrokenDependency.list(SUBJECT))
            .as("an unreachable Keycloak must surface as a failure, never as an empty Passkey list")
            .isInstanceOf(KeycloakUnavailableException.class);
    }

    @Test
    void destructiveOperationsAlsoFailClosed() {
        // A delete that silently succeeded, or reported success without reaching Keycloak, would be
        // worse than an error: the user would believe a credential was revoked when it was not.
        assertThatThrownBy(() ->
            serviceWithBrokenDependency.delete(SUBJECT, "22222222-2222-2222-2222-222222222222"))
            .isInstanceOf(KeycloakUnavailableException.class);

        assertThatThrownBy(() ->
            serviceWithBrokenDependency.rename(SUBJECT, "22222222-2222-2222-2222-222222222222", "x"))
            .isInstanceOf(KeycloakUnavailableException.class);
    }

    @Test
    void passwordAuthenticationStillWorksWhileThePasskeyPathIsBroken() {
        // The other half of NFR-3: degradation is confined to the Passkey feature.
        String token = keycloakContainer.getAccessToken(
            REALM, "passkey-service-test", "test-only-client-secret", "testuser", "test-only-password");

        assertThat(token)
            .as("password login must be unaffected by a Passkey dependency failure")
            .isNotBlank();
    }
}

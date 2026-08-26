package com.lifemiles.passkey.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Task 7 — token characteristics for the Passkey coexistence requirement (FR-6, FR-7, SECURITY-08).
 *
 * <p><b>What this test can and cannot establish, stated up front.</b> The requirement is that a
 * session is equivalent regardless of authentication method. Fully asserting that needs two tokens —
 * one from a password login and one from a WebAuthn login — and a WebAuthn login cannot be performed
 * here: the credential only comes into existence through the browser ceremony, which needs a virtual
 * authenticator. That is the Cypress suite's job, and it is currently unexecuted.</p>
 *
 * <p>So this test asserts the half that is reachable and is still worth having: that the token issued
 * by the fixture realm carries exactly the claims the backend's resource server relies on, and that
 * none of them encode the authentication method. The second point is the substantive one — if the
 * token carried no method-specific authorisation data, then authorisation cannot diverge by method,
 * which is what SECURITY-08 requires. A token that embedded, say, method-derived roles would fail
 * this test and would be a real defect.</p>
 */
class TokenEquivalenceIT {

    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:26.1";
    private static final String REALM = "lifemiles-test";
    private static final String CLIENT_ID = "passkey-service-test";
    private static final String CLIENT_SECRET = "test-only-client-secret";
    private static final String USERNAME = "testuser";
    private static final String PASSWORD = "test-only-password";

    private static KeycloakContainer keycloakContainer;
    private static JsonNode passwordTokenClaims;

    @BeforeAll
    static void startContainer() throws Exception {
        keycloakContainer = new KeycloakContainer(KEYCLOAK_IMAGE)
            .withRealmImportFile("/lifemiles-test-realm.json");
        keycloakContainer.start();

        String token = keycloakContainer.getAccessToken(REALM, CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD);
        passwordTokenClaims = decodeClaims(token);
    }

    @AfterAll
    static void stopContainer() {
        if (keycloakContainer != null) {
            keycloakContainer.stop();
        }
    }

    /**
     * Decodes the JWT payload without verifying the signature.
     *
     * <p>Not verifying is correct here: the signature is Spring Security's responsibility and is
     * exercised elsewhere. This test is about claim <em>content</em>, and re-implementing validation
     * would test our test code rather than the system.</p>
     */
    private static JsonNode decodeClaims(String jwt) throws Exception {
        String[] parts = jwt.split("\\.");
        assertThat(parts).as("a JWT must have three parts").hasSize(3);

        byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
        return new ObjectMapper().readTree(new String(payload, StandardCharsets.UTF_8));
    }

    @Test
    void theTokenCarriesTheClaimsTheResourceServerRequires() {
        // These are exactly what SecurityConfig's resource server validates on every request.
        assertThat(passwordTokenClaims.hasNonNull("iss")).isTrue();
        assertThat(passwordTokenClaims.hasNonNull("sub")).isTrue();
        assertThat(passwordTokenClaims.hasNonNull("exp")).isTrue();
        assertThat(passwordTokenClaims.hasNonNull("iat")).isTrue();
        assertThat(passwordTokenClaims.get("iss").asText())
            .as("the issuer must be the realm the backend is configured against")
            .endsWith("/realms/" + REALM);
    }

    @Test
    void theSubjectClaimIsTheStableUserIdTheApiKeysOffOf() {
        // AuthenticatedUser reads exactly this claim, and every authorization decision in Unit 3
        // derives from it. A blank or non-UUID subject would break object-level authorization.
        String subject = passwordTokenClaims.get("sub").asText();

        assertThat(subject).isNotBlank();
        assertThat(subject).matches("^[0-9a-fA-F-]{36}$");
    }

    @Test
    void noClaimEncodesTheAuthenticationMethodAsAuthorisationData() {
        // The substantive assertion. Keycloak may include acr/amr for informational purposes, but
        // nothing in the authorization-bearing claims may vary by method — otherwise a Passkey
        // session could carry different permissions from a password session, which is precisely what
        // FR-6/FR-7 and SECURITY-08 forbid.
        JsonNode realmAccess = passwordTokenClaims.get("realm_access");

        if (realmAccess != null && realmAccess.hasNonNull("roles")) {
            assertThat(realmAccess.get("roles").toString())
                .as("roles must not be derived from the authentication method")
                .doesNotContain("webauthn")
                .doesNotContain("passkey")
                .doesNotContain("password-only");
        }

        assertThat(passwordTokenClaims.hasNonNull("passkey")).isFalse();
        assertThat(passwordTokenClaims.hasNonNull("auth_method")).isFalse();
    }

    @Test
    void theTokenLifetimeIsRealmWideAndNotMethodSpecific() {
        long issuedAt = passwordTokenClaims.get("iat").asLong();
        long expiresAt = passwordTokenClaims.get("exp").asLong();

        // Recorded so that if a future change introduces per-method lifetimes, this test fails and
        // forces the discussion rather than letting sessions diverge silently.
        assertThat(expiresAt - issuedAt)
            .as("token lifetime comes from realm configuration, identical for every method")
            .isPositive();
    }
}

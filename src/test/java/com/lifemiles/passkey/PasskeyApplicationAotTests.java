package com.lifemiles.passkey;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.aot.DisabledInAotMode;
import org.springframework.test.context.TestPropertySource;

/**
 * Verifies that the Spring application context loads successfully, including under
 * Ahead-Of-Time (AOT) processing, which is a prerequisite for a successful GraalVM
 * native-image build (NFR-6).
 *
 * <p>Keycloak connectivity environment variables are stubbed with harmless placeholder
 * values purely to satisfy property binding validation
 * ({@code LifeMilesKeycloakProperties}) and JWT issuer-uri binding; no network call to
 * Keycloak is made by this test.</p>
 */
@SpringBootTest
@TestPropertySource(properties = {
    "KEYCLOAK_ISSUER_URI=http://localhost:8080/realms/lifemiles-test",
    "KEYCLOAK_CLIENT_ID=passkey-service-test",
    "KEYCLOAK_ADMIN_URL=http://localhost:8080",
    "KEYCLOAK_ADMIN_USER=test-admin",
    "KEYCLOAK_ADMIN_PASSWORD=test-admin-password",
    // Added in Unit 3: both are required with no default, so the context would fail to start
    // without them. That is the intended behaviour (fail closed), not a test inconvenience.
    "KEYCLOAK_REALM=lifemiles-test",
    "LIFEMILES_CORS_ALLOWED_ORIGINS=https://www.lifemiles.com"
})
class PasskeyApplicationAotTests {

    @Test
    void contextLoads() {
        // Intentionally empty: a successful context load (including under AOT test
        // processing, per Spring Boot's test AOT support) is the assertion itself.
    }
}

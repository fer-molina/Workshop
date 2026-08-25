package com.lifemiles.passkey;

import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Entry point for the LifeMiles Passkey (FIDO2/WebAuthn) authentication service.
 *
 * <p>This service provides the Passkey registration and management REST API that
 * complements Keycloak's native WebAuthn Passwordless authenticator. Keycloak itself
 * (realm, WebAuthn policy, browser flow) is configured separately - either manually via
 * the Admin Console for real environments (see {@code docs/keycloak-console-setup.md})
 * or via a test-only fixture realm for Testcontainers-based integration tests
 * (see {@code src/test/resources/keycloak-test-realm.json}).</p>
 */
@SpringBootApplication
@EnableConfigurationProperties(LifeMilesKeycloakProperties.class)
public class PasskeyApplication {

    public static void main(String[] args) {
        SpringApplication.run(PasskeyApplication.class, args);
    }
}

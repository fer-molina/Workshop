package com.lifemiles.passkey.config;

import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Supplies the Keycloak Admin Client used for Passkey credential operations.
 *
 * <p><b>Documented security exception EX-002 (SECURITY-06).</b> This client authenticates with the
 * password grant as the account in {@code KEYCLOAK_ADMIN_USER}, which by the naming convention of
 * the deployment contract is a full realm administrator. The service only ever needs
 * {@code view-users} and {@code manage-users}, so it holds materially broader rights than it
 * exercises. A least-privilege service account was offered and explicitly declined in favour of
 * keeping the Unit 1 environment contract unchanged (see {@code unit-3-questions.md}, Q3 = B).
 * The residual risk and the remediation path are recorded in {@code docs/security-exceptions.md}.
 * This comment exists so the next reader does not mistake the choice for an oversight.</p>
 *
 * <p>The client is a singleton because each instance holds a connection pool and refreshes its own
 * access token; creating one per request would both leak connections and hammer the token
 * endpoint.</p>
 */
@Configuration
public class KeycloakAdminClientConfig {

    /**
     * JAX-RS client with explicit timeouts.
     *
     * <p>Timeouts are the point of this bean. Without them a stalled Keycloak holds servlet
     * threads until the pool is exhausted, which converts a slow dependency into a full outage of
     * this service and makes the NFR-3 graceful-degradation claim untrue. Failing fast lets the
     * 503 path run instead (SECURITY-15, fail closed).</p>
     */
    @Bean
    public Client keycloakJaxRsClient(LifeMilesKeycloakProperties properties) {
        return ClientBuilder.newBuilder()
            .connectTimeout(properties.getConnectTimeoutMs(), TimeUnit.MILLISECONDS)
            .readTimeout(properties.getReadTimeoutMs(), TimeUnit.MILLISECONDS)
            .build();
    }

    @Bean
    public Keycloak keycloakAdminClient(LifeMilesKeycloakProperties properties, Client keycloakJaxRsClient) {
        return KeycloakBuilder.builder()
            .serverUrl(properties.getAdminUrl())
            // Realm the admin account authenticates against (master by default), which is not the
            // realm whose users we manage. Conflating the two is a common misconfiguration.
            .realm(properties.getAuthRealm())
            .clientId(properties.getClientId())
            .grantType(OAuth2Constants.PASSWORD)
            .username(properties.getAdminUser())
            .password(properties.getAdminPassword())
            .resteasyClient(keycloakJaxRsClient)
            .build();
    }
}

package com.lifemiles.passkey.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * Binds the {@code lifemiles.keycloak.*} configuration properties, all of which are
 * sourced from environment variables (see {@code application.yml}):
 * {@code KEYCLOAK_ADMIN_URL}, {@code KEYCLOAK_ADMIN_USER}, {@code KEYCLOAK_ADMIN_PASSWORD},
 * {@code KEYCLOAK_CLIENT_ID}, {@code KEYCLOAK_REALM}, {@code KEYCLOAK_AUTH_REALM},
 * {@code KEYCLOAK_CONNECT_TIMEOUT_MS}, {@code KEYCLOAK_READ_TIMEOUT_MS},
 * {@code LIFEMILES_CORS_ALLOWED_ORIGINS}.
 *
 * <p>No default values are supplied for any field. If an environment variable is missing,
 * property binding validation fails fast at startup rather than allowing the application to
 * run with an undefined or default credential (SECURITY-09, SECURITY-12).</p>
 *
 * <p>Consumed by the Keycloak Admin Client configuration introduced in Unit 3, which
 * performs the actual Passkey registration/management REST calls against the real
 * standalone Keycloak instance.</p>
 */
@Validated
@ConfigurationProperties(prefix = "lifemiles.keycloak")
public class LifeMilesKeycloakProperties {

    @NotBlank
    private String adminUrl;

    @NotBlank
    private String adminUser;

    @NotBlank
    private String adminPassword;

    @NotBlank
    private String clientId;

    /**
     * Realm whose users own the Passkeys this service manages (for example {@code lifemiles}).
     *
     * <p>Required with no default. Deriving it from the issuer URI would work most of the time
     * and fail confusingly when it did not, so it is stated explicitly instead.</p>
     */
    @NotBlank
    private String realm;

    /**
     * Realm the admin account itself lives in. {@code master} for a standard Keycloak install,
     * which is why this is the one property here that carries a default.
     */
    @NotBlank
    private String authRealm = "master";

    /**
     * Connect and read timeouts for Keycloak calls, in milliseconds.
     *
     * <p>Set explicitly and kept short on purpose. With no timeout, a stalled Keycloak would hold
     * servlet threads until the pool is exhausted, turning a dependency slowdown into a total
     * outage of this service. Failing fast lets the 503 path run and keeps NFR-1 meaningful.</p>
     */
    @Positive
    private int connectTimeoutMs = 3000;

    @Positive
    private int readTimeoutMs = 5000;

    /**
     * Exact origins allowed to call this API (SECURITY-08).
     *
     * <p>Required and non-empty, with no default. An empty default would be silently
     * permissive-looking in config review while actually blocking every browser client; a
     * wildcard default would be worse. Startup fails instead.</p>
     */
    @NotEmpty
    private List<String> corsAllowedOrigins;

    public String getAdminUrl() {
        return adminUrl;
    }

    public void setAdminUrl(String adminUrl) {
        this.adminUrl = adminUrl;
    }

    public String getAdminUser() {
        return adminUser;
    }

    public void setAdminUser(String adminUser) {
        this.adminUser = adminUser;
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getRealm() {
        return realm;
    }

    public void setRealm(String realm) {
        this.realm = realm;
    }

    public String getAuthRealm() {
        return authRealm;
    }

    public void setAuthRealm(String authRealm) {
        this.authRealm = authRealm;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    public List<String> getCorsAllowedOrigins() {
        return corsAllowedOrigins;
    }

    public void setCorsAllowedOrigins(List<String> corsAllowedOrigins) {
        this.corsAllowedOrigins = corsAllowedOrigins;
    }
}

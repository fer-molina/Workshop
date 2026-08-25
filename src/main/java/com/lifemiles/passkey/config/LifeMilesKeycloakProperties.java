package com.lifemiles.passkey.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Binds the {@code lifemiles.keycloak.*} configuration properties, all of which are
 * sourced from environment variables (see {@code application.yml}):
 * {@code KEYCLOAK_ADMIN_URL}, {@code KEYCLOAK_ADMIN_USER}, {@code KEYCLOAK_ADMIN_PASSWORD},
 * {@code KEYCLOAK_CLIENT_ID}.
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
}

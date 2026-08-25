package com.lifemiles.passkey.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Baseline security configuration for the Passkey service.
 *
 * <p><b>Unit 1 scope</b>: establishes a minimal, deny-by-default {@link SecurityFilterChain}
 * so the application context loads under both standard and AOT (native-image) processing.
 * Every request requires a valid JWT issued by the Keycloak realm configured via
 * {@code KEYCLOAK_ISSUER_URI} (server-side signature/expiration/issuer validation is
 * performed by Spring Security's OAuth2 resource server support automatically).</p>
 *
 * <p>Unit 3 (Spring Boot Backend) extends this configuration with: CORS restricted to
 * LifeMiles domain origins (SECURITY-08), the {@code RateLimitFilter} (SECURITY-11), and
 * object-level authorization checks in {@code PasskeyController} (SECURITY-08). This
 * class intentionally does not open any endpoint as public in Unit 1 since no controllers
 * exist yet.</p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Stateless REST API: no server-side HTTP session is created or used for auth.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Deny by default (SECURITY-08): every request must be authenticated.
            .authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated())
            // Validate JWTs server-side on every request (signature, expiration, issuer).
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults -> {}))
            // CSRF protection is not needed for a stateless, token-authenticated JSON API.
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}

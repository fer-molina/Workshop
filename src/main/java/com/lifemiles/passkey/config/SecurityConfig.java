package com.lifemiles.passkey.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.List;

/**
 * Security configuration for the Passkey service.
 *
 * <p>Deny by default: every request must carry a JWT that Spring Security validates against the
 * Keycloak realm named by {@code KEYCLOAK_ISSUER_URI} — signature, expiration and issuer are all
 * checked server-side on every request (SECURITY-08).</p>
 *
 * <p><b>Unit 3 addition</b>: CORS restricted to configured LifeMiles origins.</p>
 *
 * <p>No health or metrics endpoint is opened, because Spring Boot Actuator is not a dependency of
 * this project. Deployment liveness probes will need it added deliberately, with only
 * {@code health} exposed — exposing {@code /actuator/**} would disclose environment, beans and
 * mappings, which is the information leak SECURITY-09 exists to prevent. Left as a deployment
 * decision rather than pulled in unrequested.</p>
 *
 * <p><b>Documented security exception EX-003 (SECURITY-11).</b> There is deliberately no
 * application-level rate limiter. Rate limiting was assigned to the API gateway
 * (see {@code unit-3-questions.md}, Q4 = C). Note that this codebase therefore cannot verify the
 * control exists: if the gateway does not enforce it, nothing here does. Recorded with that caveat
 * in {@code docs/security-exceptions.md}.</p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
        throws Exception {
        http
            // Stateless REST API: no server-side HTTP session is created or used for auth.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            // Deny by default (SECURITY-08): every request requires a valid token. No endpoint is
            // public.
            .authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults -> {}))
            // CSRF protection is not needed for a stateless, token-authenticated JSON API: there
            // is no ambient credential a browser would attach automatically.
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    /**
     * CORS restricted to the exact origins supplied by configuration (SECURITY-08).
     *
     * <p>Uses {@code setAllowedOrigins}, not {@code setAllowedOriginPatterns}: patterns invite
     * wildcards, and a wildcard combined with {@code allowCredentials} is the classic way to make a
     * credentialed API readable by any site. The origin list is required configuration with no
     * default, so a missing value fails startup rather than shipping a permissive guess.</p>
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(LifeMilesKeycloakProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.copyOf(properties.getCorsAllowedOrigins()));
        // Only the methods this API actually serves.
        configuration.setAllowedMethods(List.of(
            HttpMethod.GET.name(),
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.DELETE.name(),
            HttpMethod.OPTIONS.name()));
        // Only the headers a client needs to send. Not "*", which would also permit anything a
        // future browser decides to allow.
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(Duration.ofMinutes(30));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }
}

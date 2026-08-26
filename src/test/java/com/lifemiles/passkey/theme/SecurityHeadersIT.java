package com.lifemiles.passkey.theme;

import dasniko.testcontainers.keycloak.KeycloakContainer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the HTTP security headers Keycloak emits for the LifeMiles realm (SECURITY-04).
 *
 * <p>Security headers cannot be set by a theme — they are HTTP response headers driven by the
 * realm's Security Defenses configuration, and a {@code <meta>} tag cannot set HSTS at all.
 * They are therefore configured in {@code lifemiles-test-realm.json} under
 * {@code browserSecurityHeaders} and asserted here against a real Keycloak response, so the
 * claim is verified rather than merely documented.</p>
 *
 * <p><strong>Why this test asserts headers and not page markup:</strong> the login page body is
 * rendered by {@code hub-keycloack-login-ui}, a single-page application served from CloudFront
 * and executed in the browser. An HTTP fetch from this test suite receives only the FreeMarker
 * shell, so asserting body content here would prove nothing about what a user sees. Rendering
 * and behaviour of the Passkey UI are covered by the SPA's own Vitest suite and, end to end, by
 * Unit 4.</p>
 *
 * <p>The Content-Security-Policy assertion intentionally pins the exact policy, including its
 * approved {@code 'unsafe-inline'} deviation. That deviation is recorded in
 * {@code docs/security-exceptions.md} (EX-001); pinning it here means the policy cannot drift —
 * loosening it further, or silently dropping it, fails the build.</p>
 */
class SecurityHeadersIT {

    private static final String KEYCLOAK_IMAGE = "quay.io/keycloak/keycloak:26.1";
    private static final String REALM_NAME = "lifemiles-test";

    private static final String EXPECTED_CSP =
        "default-src 'self'; "
            + "script-src 'self' 'unsafe-inline' https://d296xu67oj0g2g.cloudfront.net https://d2ptwux79zic3h.cloudfront.net; "
            + "style-src 'self' 'unsafe-inline' https://d296xu67oj0g2g.cloudfront.net https://d2ptwux79zic3h.cloudfront.net; "
            + "img-src 'self' data: https://d296xu67oj0g2g.cloudfront.net https://d2ptwux79zic3h.cloudfront.net; "
            + "font-src 'self' https://d296xu67oj0g2g.cloudfront.net https://d2ptwux79zic3h.cloudfront.net; "
            + "connect-src 'self' https://d296xu67oj0g2g.cloudfront.net https://d2ptwux79zic3h.cloudfront.net; "
            + "frame-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";

    private static KeycloakContainer keycloakContainer;
    private static HttpResponse<String> loginPageResponse;

    @BeforeAll
    static void startContainerAndFetchLoginPage() throws Exception {
        keycloakContainer = new KeycloakContainer(KEYCLOAK_IMAGE)
            .withRealmImportFile("/lifemiles-test-realm.json");
        keycloakContainer.start();

        // The account console's login redirect is the simplest way to reach a realm-scoped
        // HTML page without needing a configured client redirect URI.
        String loginPageUrl = keycloakContainer.getAuthServerUrl()
            + "/realms/" + REALM_NAME + "/account/";

        try (HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(10))
            .build()) {

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(loginPageUrl))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

            loginPageResponse = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        }
    }

    @AfterAll
    static void stopContainer() {
        if (keycloakContainer != null) {
            keycloakContainer.stop();
        }
    }

    private static String header(String name) {
        return loginPageResponse.headers().firstValue(name).orElse(null);
    }

    @Test
    void realmScopedPageIsReachable() {
        assertThat(loginPageResponse.statusCode())
            .as("the realm login page should be served, otherwise the header assertions are meaningless")
            .isBetween(200, 399);
    }

    @Test
    void xContentTypeOptionsPreventsMimeSniffing() {
        assertThat(header("X-Content-Type-Options")).isEqualTo("nosniff");
    }

    @Test
    void xFrameOptionsDeniesFraming() {
        assertThat(header("X-Frame-Options")).isEqualTo("DENY");
    }

    @Test
    void referrerPolicyLimitsCrossOriginLeakage() {
        assertThat(header("Referrer-Policy")).isEqualTo("strict-origin-when-cross-origin");
    }

    @Test
    void strictTransportSecurityIsAtLeastOneYearAndCoversSubdomains() {
        String hsts = header("Strict-Transport-Security");

        assertThat(hsts)
            .as("SECURITY-04 requires a max-age of at least 31536000 (one year)")
            .isEqualTo("max-age=31536000; includeSubDomains");
    }

    @Test
    void contentSecurityPolicyMatchesTheApprovedException() {
        assertThat(header("Content-Security-Policy"))
            .as("CSP must match EX-001 in docs/security-exceptions.md exactly, so the policy cannot drift")
            .isEqualTo(EXPECTED_CSP);
    }

    @Test
    void contentSecurityPolicyRestrictsTheDangerousDirectives() {
        String csp = header("Content-Security-Policy");

        // Asserted separately from the exact-match test so that a future rewrite of the policy
        // still has to keep these properties.
        assertThat(csp).contains("default-src 'self'");
        assertThat(csp).contains("object-src 'none'");
        assertThat(csp).contains("frame-ancestors 'none'");
        assertThat(csp).contains("form-action 'self'");
        assertThat(csp)
            .as("unsafe-eval is not covered by any approved exception")
            .doesNotContain("unsafe-eval");
    }
}

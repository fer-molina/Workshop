package com.lifemiles.passkey.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Resolves the Keycloak user id of the caller from the validated JWT.
 *
 * <p><b>This is the structural defence against IDOR (SECURITY-08).</b> The subject is read only
 * from the {@code sub} claim of a token that Spring Security has already validated. It is never
 * accepted from a path variable, query parameter, header or request body. That is a deliberate
 * design constraint rather than a check: because no endpoint takes a user identifier as input,
 * there is no request a caller can construct that targets another user's credentials, so there is
 * no ownership check that can be forgotten on some future endpoint.</p>
 *
 * <p>If any later endpoint does need to act on another user, it must go through an explicitly
 * authorised admin path and not through this class.</p>
 */
@Component
public class AuthenticatedUser {

    /**
     * @return the {@code sub} claim of the current JWT, which is the Keycloak user id
     * @throws IllegalStateException if there is no authenticated JWT. This is a programming error,
     *         not a client error: the security filter chain denies unauthenticated requests before
     *         a controller runs, so reaching here without a token means the chain was misconfigured
     *         and the request must fail rather than proceed with an unknown subject.
     */
    public String requireSubject() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException(
                "No authenticated JWT in the security context; the filter chain is misconfigured");
        }

        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new IllegalStateException("Authenticated JWT has no 'sub' claim");
        }

        return subject;
    }
}

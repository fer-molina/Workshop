package com.lifemiles.passkey.exception;

/**
 * Raised when Keycloak cannot be reached, times out, or answers with an error this service
 * cannot act on.
 *
 * <p>Exists so that transport-level detail never escapes the service layer. A raw
 * {@code ProcessingException} or a JAX-RS {@code WebApplicationException} carries the Keycloak
 * URL, its HTTP status and sometimes its response body; surfacing any of that would disclose
 * internal topology (SECURITY-09). The cause is retained for the log and dropped from the
 * response.</p>
 *
 * <p>Maps to 503, and the failure is audited (NFR-5): an availability problem in the Passkey
 * dependency is exactly the kind of event that has to be visible after the fact.</p>
 */
public class KeycloakUnavailableException extends RuntimeException {

    public KeycloakUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}

package com.lifemiles.passkey.model;

import java.time.Instant;
import java.util.List;

/**
 * The single error shape returned by every failing endpoint.
 *
 * <p>Deliberately narrow (SECURITY-09): it carries a stable machine-readable {@code code}, a
 * message safe to show a user, and a {@code traceId} for correlating with server logs. It never
 * carries a stack trace, an exception class name, an internal path, a Keycloak URL, or a version
 * string — anything that would help map the deployment's internals from the outside.</p>
 *
 * <p>{@code fieldErrors} reports <em>which</em> field failed and <em>which</em> constraint, but
 * never the rejected value. Echoing input back is how a validation error becomes a reflection
 * gadget, so the value is dropped even though it would be convenient for debugging.</p>
 *
 * @param code        stable error code, safe to branch on from a client
 * @param message     user-safe description
 * @param timestamp   when the error was produced
 * @param traceId     correlation id, also emitted in the server log for this request
 * @param fieldErrors per-field validation detail; empty for non-validation failures
 */
public record ApiErrorResponse(
    String code,
    String message,
    Instant timestamp,
    String traceId,
    List<FieldError> fieldErrors
) {

    /**
     * @param field      the offending property name
     * @param constraint the violated constraint, without the rejected value
     */
    public record FieldError(String field, String constraint) {
    }

    public static ApiErrorResponse of(String code, String message, String traceId) {
        return new ApiErrorResponse(code, message, Instant.now(), traceId, List.of());
    }

    public static ApiErrorResponse validation(String message, String traceId, List<FieldError> fieldErrors) {
        return new ApiErrorResponse("VALIDATION_FAILED", message, Instant.now(), traceId, fieldErrors);
    }
}

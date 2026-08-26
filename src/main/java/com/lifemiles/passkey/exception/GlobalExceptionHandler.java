package com.lifemiles.passkey.exception;

import com.lifemiles.passkey.model.ApiErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;

/**
 * Turns every failure into the single {@link ApiErrorResponse} shape (SECURITY-09, SECURITY-15).
 *
 * <p><b>The rule this class exists to enforce:</b> the client learns what it needs to correct its
 * request and nothing about how the service is built. No stack traces, no exception class names, no
 * Keycloak URLs, no framework versions, and — for validation failures — no echo of the rejected
 * value.</p>
 *
 * <p>Each response carries a generated {@code traceId} which is also logged server-side, so an
 * operator can find the full detail from a user's screenshot without that detail ever crossing the
 * network.</p>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOG = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(PasskeyNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(PasskeyNotFoundException exception) {
        String traceId = newTraceId();
        LOG.info("Passkey not found for the authenticated user, traceId={}", traceId);

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiErrorResponse.of("PASSKEY_NOT_FOUND", "Passkey not found.", traceId));
    }

    @ExceptionHandler(PasskeyOperationForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> handleForbidden(PasskeyOperationForbiddenException exception) {
        String traceId = newTraceId();
        LOG.warn("Rejected an attempt to manage a non-Passkey credential, traceId={}", traceId);

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiErrorResponse.of(
                "NOT_A_PASSKEY",
                "This credential cannot be managed through the Passkey API.",
                traceId));
    }

    @ExceptionHandler(KeycloakUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleDependencyUnavailable(KeycloakUnavailableException exception) {
        String traceId = newTraceId();
        // The cause is logged in full and never returned: it carries the Keycloak URL and status.
        LOG.error("Keycloak dependency unavailable, traceId={}", traceId, exception);

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ApiErrorResponse.of(
                "PASSKEY_SERVICE_UNAVAILABLE",
                "Passkey management is temporarily unavailable. Please try again later.",
                traceId));
    }

    /** Validation failures on a request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleBodyValidation(MethodArgumentNotValidException exception) {
        String traceId = newTraceId();

        List<ApiErrorResponse.FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
            // Only the field name and the constraint message. getRejectedValue() is deliberately
            // not read: echoing hostile input back is how a 400 becomes a reflection gadget.
            .map(error -> new ApiErrorResponse.FieldError(error.getField(), error.getDefaultMessage()))
            .toList();

        LOG.info("Request body validation failed, traceId={}, fields={}", traceId, fieldErrors.size());

        return ResponseEntity.badRequest()
            .body(ApiErrorResponse.validation("Request validation failed.", traceId, fieldErrors));
    }

    /** Validation failures on path variables and request parameters. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleParameterValidation(ConstraintViolationException exception) {
        String traceId = newTraceId();

        List<ApiErrorResponse.FieldError> fieldErrors = exception.getConstraintViolations().stream()
            .map(violation -> new ApiErrorResponse.FieldError(
                violation.getPropertyPath().toString(),
                violation.getMessage()))
            .toList();

        LOG.info("Request parameter validation failed, traceId={}, fields={}", traceId, fieldErrors.size());

        return ResponseEntity.badRequest()
            .body(ApiErrorResponse.validation("Request validation failed.", traceId, fieldErrors));
    }

    /**
     * Catch-all. Anything reaching here is a bug, so the response is deliberately opaque and the
     * detail goes to the log (fail closed, SECURITY-15).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        String traceId = newTraceId();
        LOG.error("Unhandled exception, traceId={}", traceId, exception);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiErrorResponse.of("INTERNAL_ERROR", "An unexpected error occurred.", traceId));
    }

    private static String newTraceId() {
        return UUID.randomUUID().toString();
    }
}

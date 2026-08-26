package com.lifemiles.passkey.model;

/**
 * Result of asking Keycloak to enrol a Passkey for the authenticated user (FR-3).
 *
 * <p><b>Why this shape, and not a WebAuthn challenge.</b> Task 3 originally specified
 * {@code POST /register/initiate} and {@code POST /register/complete} as if this service
 * performed the WebAuthn ceremony. It does not, and it should not: Keycloak's
 * {@code webauthn-register-passwordless} required action owns the challenge, the browser calls
 * {@code navigator.credentials.create}, and the attestation is posted back to Keycloak, which
 * stores the credential. Nothing in that flow calls this service, so a challenge-issuing
 * endpoint here would be a parallel implementation that no client uses, and
 * {@code /register/complete} would be unreachable.</p>
 *
 * <p>What this endpoint does instead is the one useful, Keycloak-native thing available: it
 * flags the user so the enrolment ceremony runs on their next login. Keeping credential
 * creation entirely inside Keycloak is also what satisfies SECURITY-12 — this service never
 * handles or stores credential material.</p>
 *
 * <p>Decision recorded in {@code unit-3-questions.md}, Q2 = A.</p>
 *
 * @param requiredAction the Keycloak required action that was ensured on the user
 * @param alreadyPending {@code true} when the action was already present, so the caller can tell
 *                       the user "you already have an enrolment pending" instead of implying a
 *                       new one was created
 */
public record RegistrationInitiatedResponse(String requiredAction, boolean alreadyPending) {
}

package com.lifemiles.passkey.model;

import java.time.Instant;

/**
 * A single Passkey belonging to the authenticated user (FR-9).
 *
 * <p><b>On the absent {@code lastUsed} field.</b> Task 5 originally specified
 * {@code PasskeyResponse(id, name, createdAt, lastUsed)}. Keycloak's
 * {@code CredentialRepresentation} — the only source the Admin API offers for a user's
 * credentials — exposes just {@code id}, {@code type}, {@code userLabel} and
 * {@code createdDate}. There is no last-used timestamp anywhere in that model, so the field
 * was deliberately dropped rather than populated with a fabricated or misleading value
 * (decision recorded in {@code unit-3-questions.md}, Q1 = A). Sourcing it would require
 * enabling Keycloak event storage and querying the admin events API per credential, which was
 * judged not worth the operational cost and the extra latency against NFR-1.</p>
 *
 * <p>This is a record so that JSON serialisation needs no reflection configuration, which is
 * what keeps native-image readiness (NFR-6) cheap.</p>
 *
 * @param id        Keycloak credential id
 * @param name      user-facing label; Keycloak's {@code userLabel}. May be {@code null} when the
 *                  user never named the device, and callers must tolerate that
 * @param createdAt when the credential was registered
 */
public record PasskeyResponse(String id, String name, Instant createdAt) {
}

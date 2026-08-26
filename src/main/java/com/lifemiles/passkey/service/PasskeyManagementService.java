package com.lifemiles.passkey.service;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.audit.PasskeyAuditLogger.Action;
import com.lifemiles.passkey.audit.PasskeyAuditLogger.Outcome;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.exception.KeycloakUnavailableException;
import com.lifemiles.passkey.exception.PasskeyNotFoundException;
import com.lifemiles.passkey.exception.PasskeyOperationForbiddenException;
import com.lifemiles.passkey.model.PasskeyResponse;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * List, rename and revoke the authenticated user's Passkeys (FR-9, FR-11).
 *
 * <p>Every operation is scoped to the caller's own user id, which comes from the validated JWT and
 * never from the request. The Keycloak endpoints used are themselves user-scoped
 * ({@code users/{id}/credentials/...}), so an attacker cannot reach another user's credential even
 * by guessing a credential id.</p>
 *
 * <p>This service never persists credential material; Keycloak remains the sole store
 * (SECURITY-12).</p>
 */
@Service
public class PasskeyManagementService {

    /**
     * Keycloak's credential type for passwordless WebAuthn, as opposed to {@code "webauthn"} which
     * is the second-factor variant. Unit 1 configured the passwordless authenticator, so this is
     * the type this API owns.
     */
    static final String WEBAUTHN_PASSWORDLESS_TYPE = "webauthn-passwordless";

    private final Keycloak keycloak;
    private final LifeMilesKeycloakProperties properties;
    private final PasskeyAuditLogger auditLogger;

    public PasskeyManagementService(
        Keycloak keycloak,
        LifeMilesKeycloakProperties properties,
        PasskeyAuditLogger auditLogger
    ) {
        this.keycloak = keycloak;
        this.properties = properties;
        this.auditLogger = auditLogger;
    }

    /**
     * @return the caller's Passkeys, newest first so the list is stable and the most recently
     *         registered device — the one a user is most likely looking for — appears at the top
     */
    public List<PasskeyResponse> list(String subject) {
        List<CredentialRepresentation> credentials = fetchPasskeys(subject);

        auditLogger.record(Action.LIST, subject, Outcome.SUCCESS);

        return credentials.stream()
            .map(PasskeyManagementService::toResponse)
            .sorted(Comparator.comparing(
                PasskeyResponse::createdAt,
                Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
    }

    /**
     * Renames a Passkey by setting Keycloak's {@code userLabel} on the credential.
     */
    public void rename(String subject, String credentialId, String newName) {
        // Resolve first: this is what turns a request for someone else's credential, or for the
        // caller's own password credential, into a refusal before anything is mutated.
        requireOwnPasskey(subject, credentialId, Action.RENAME);

        try {
            userResource(subject).setCredentialUserLabel(credentialId, newName);
        } catch (RuntimeException exception) {
            auditLogger.record(Action.RENAME, subject, credentialId, Outcome.DEPENDENCY_UNAVAILABLE);
            throw new KeycloakUnavailableException("Could not rename the Passkey", exception);
        }

        auditLogger.record(Action.RENAME, subject, credentialId, Outcome.SUCCESS);
    }

    /**
     * Revokes a Passkey by removing the credential from Keycloak.
     */
    public void delete(String subject, String credentialId) {
        requireOwnPasskey(subject, credentialId, Action.DELETE);

        try {
            userResource(subject).removeCredential(credentialId);
        } catch (RuntimeException exception) {
            auditLogger.record(Action.DELETE, subject, credentialId, Outcome.DEPENDENCY_UNAVAILABLE);
            throw new KeycloakUnavailableException("Could not delete the Passkey", exception);
        }

        auditLogger.record(Action.DELETE, subject, credentialId, Outcome.SUCCESS);
    }

    /**
     * Confirms the credential exists on this user and is a Passkey.
     *
     * <p>Two distinct refusals, deliberately kept apart:</p>
     * <ul>
     *   <li>absent from the caller's credentials → {@link PasskeyNotFoundException} (404). Also the
     *       answer when the credential belongs to someone else, so the API cannot be used to probe
     *       for valid credential ids</li>
     *   <li>present but not a Passkey → {@link PasskeyOperationForbiddenException} (403). Without
     *       this branch, a caller could delete their own password or OTP credential through an API
     *       documented as managing Passkeys</li>
     * </ul>
     */
    private void requireOwnPasskey(String subject, String credentialId, Action action) {
        List<CredentialRepresentation> allCredentials = fetchAllCredentials(subject, action);

        Optional<CredentialRepresentation> match = allCredentials.stream()
            .filter(credential -> credentialId.equals(credential.getId()))
            .findFirst();

        if (match.isEmpty()) {
            auditLogger.record(action, subject, credentialId, Outcome.NOT_FOUND);
            throw new PasskeyNotFoundException(credentialId);
        }

        if (!WEBAUTHN_PASSWORDLESS_TYPE.equals(match.get().getType())) {
            auditLogger.record(action, subject, credentialId, Outcome.FORBIDDEN);
            throw new PasskeyOperationForbiddenException(credentialId);
        }
    }

    private List<CredentialRepresentation> fetchPasskeys(String subject) {
        return fetchAllCredentials(subject, Action.LIST).stream()
            .filter(credential -> WEBAUTHN_PASSWORDLESS_TYPE.equals(credential.getType()))
            .toList();
    }

    private List<CredentialRepresentation> fetchAllCredentials(String subject, Action action) {
        try {
            List<CredentialRepresentation> credentials = userResource(subject).credentials();
            return credentials == null ? List.of() : credentials;
        } catch (RuntimeException exception) {
            auditLogger.record(action, subject, Outcome.DEPENDENCY_UNAVAILABLE);
            throw new KeycloakUnavailableException("Could not read credentials from Keycloak", exception);
        }
    }

    private UserResource userResource(String subject) {
        return keycloak.realm(properties.getRealm()).users().get(subject);
    }

    private static PasskeyResponse toResponse(CredentialRepresentation credential) {
        // createdDate is epoch millis and is nullable in the representation, so it is mapped
        // defensively rather than unboxed.
        Instant createdAt = credential.getCreatedDate() == null
            ? null
            : Instant.ofEpochMilli(credential.getCreatedDate());

        return new PasskeyResponse(credential.getId(), credential.getUserLabel(), createdAt);
    }
}

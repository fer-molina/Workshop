package com.lifemiles.passkey.service;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.audit.PasskeyAuditLogger.Action;
import com.lifemiles.passkey.audit.PasskeyAuditLogger.Outcome;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.exception.KeycloakUnavailableException;
import com.lifemiles.passkey.model.RegistrationInitiatedResponse;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Triggers Passkey enrolment for the authenticated user (FR-3).
 *
 * <p><b>What this does and does not do.</b> It does not perform a WebAuthn ceremony. Keycloak's
 * {@code webauthn-register-passwordless} required action owns the challenge and the attestation
 * verification, and the browser talks to Keycloak directly through the theme templates delivered in
 * Unit 2. All this service does is set the required action so the ceremony runs at the user's next
 * login. Keeping credential creation inside Keycloak is what keeps SECURITY-12 true — this service
 * never sees or stores credential material.</p>
 *
 * <p>Decision recorded in {@code unit-3-questions.md}, Q2 = A. The originally specified
 * {@code /register/complete} endpoint was dropped because Keycloak completes the ceremony itself,
 * so nothing would ever call it.</p>
 */
@Service
public class PasskeyRegistrationService {

    /**
     * Keycloak's required-action alias for passwordless WebAuthn enrolment. Distinct from
     * {@code webauthn-register}, which enrols a second-factor authenticator.
     */
    static final String REQUIRED_ACTION_REGISTER_PASSWORDLESS = "webauthn-register-passwordless";

    private final Keycloak keycloak;
    private final LifeMilesKeycloakProperties properties;
    private final PasskeyAuditLogger auditLogger;

    public PasskeyRegistrationService(
        Keycloak keycloak,
        LifeMilesKeycloakProperties properties,
        PasskeyAuditLogger auditLogger
    ) {
        this.keycloak = keycloak;
        this.properties = properties;
        this.auditLogger = auditLogger;
    }

    /**
     * Ensures the enrolment required action is pending for the caller.
     *
     * <p>Idempotent by design: calling it twice leaves exactly one pending action. A user who taps
     * "Register a Passkey" twice should not be forced through two ceremonies, and Keycloak's
     * {@code requiredActions} is a plain list that would happily hold duplicates.</p>
     */
    public RegistrationInitiatedResponse initiate(String subject) {
        UserResource userResource = keycloak.realm(properties.getRealm()).users().get(subject);

        UserRepresentation user;
        try {
            user = userResource.toRepresentation();
        } catch (RuntimeException exception) {
            auditLogger.record(Action.REGISTRATION_INITIATED, subject, Outcome.DEPENDENCY_UNAVAILABLE);
            throw new KeycloakUnavailableException("Could not read the user from Keycloak", exception);
        }

        List<String> requiredActions = user.getRequiredActions() == null
            ? new ArrayList<>()
            : new ArrayList<>(user.getRequiredActions());

        if (requiredActions.contains(REQUIRED_ACTION_REGISTER_PASSWORDLESS)) {
            auditLogger.record(Action.REGISTRATION_INITIATED, subject, Outcome.SUCCESS);
            return new RegistrationInitiatedResponse(REQUIRED_ACTION_REGISTER_PASSWORDLESS, true);
        }

        requiredActions.add(REQUIRED_ACTION_REGISTER_PASSWORDLESS);
        user.setRequiredActions(requiredActions);

        try {
            userResource.update(user);
        } catch (RuntimeException exception) {
            auditLogger.record(Action.REGISTRATION_INITIATED, subject, Outcome.DEPENDENCY_UNAVAILABLE);
            throw new KeycloakUnavailableException("Could not schedule Passkey enrolment", exception);
        }

        auditLogger.record(Action.REGISTRATION_INITIATED, subject, Outcome.SUCCESS);
        return new RegistrationInitiatedResponse(REQUIRED_ACTION_REGISTER_PASSWORDLESS, false);
    }
}

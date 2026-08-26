package com.lifemiles.passkey.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Emits one structured event per Passkey lifecycle operation (NFR-5, SECURITY-03).
 *
 * <p>Uses Spring Boot's built-in structured logging, configured via
 * {@code logging.structured.format.console} in {@code application.yml}. No JSON-encoder
 * dependency is added: the framework already provides this, and every avoided dependency is one
 * fewer thing to keep patched (SECURITY-10).</p>
 *
 * <p><b>What is deliberately never logged.</b> Access tokens, the {@code Authorization} header,
 * email addresses, usernames, device labels, and any WebAuthn public-key or attestation material.
 * The only identifier recorded is the Keycloak user UUID, which is pseudonymous and meaningless
 * without access to Keycloak itself. Device labels are excluded even though they would be useful
 * for support, because they are free text the user controls and therefore both potentially
 * personal and a log-injection vector.</p>
 *
 * <p><b>Failures are audited, not just successes.</b> An audit trail that only records what
 * worked cannot answer the questions an audit trail exists for — who tried to delete a credential
 * they did not own, or when the dependency was unavailable.</p>
 */
@Component
public class PasskeyAuditLogger {

    /**
     * Dedicated logger name so audit events can be routed and retained separately from
     * application logs, which typically have a much shorter retention.
     */
    private static final Logger AUDIT = LoggerFactory.getLogger("PASSKEY_AUDIT");

    public enum Action {
        LIST,
        RENAME,
        DELETE,
        REGISTRATION_INITIATED
    }

    public enum Outcome {
        SUCCESS,
        NOT_FOUND,
        FORBIDDEN,
        DEPENDENCY_UNAVAILABLE,
        VALIDATION_FAILED,
        ERROR
    }

    /**
     * @param action       what was attempted
     * @param subject      Keycloak user id of the caller
     * @param credentialId target credential, or {@code null} for operations without one
     * @param outcome      how it ended
     */
    public void record(Action action, String subject, String credentialId, Outcome outcome) {
        // Key-value pairs are passed as structured arguments rather than interpolated into the
        // message, so the log backend receives real fields and the message stays constant and
        // greppable. It also means no caller-controlled value can alter the log structure.
        AUDIT.atInfo()
            .setMessage("passkey.lifecycle")
            .addKeyValue("action", action.name())
            .addKeyValue("subject", subject)
            .addKeyValue("credentialId", credentialId)
            .addKeyValue("outcome", outcome.name())
            .log();
    }

    public void record(Action action, String subject, Outcome outcome) {
        record(action, subject, null, outcome);
    }
}

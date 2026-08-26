package com.lifemiles.passkey.exception;

/**
 * Raised when the requested credential is not among the authenticated user's Passkeys.
 *
 * <p>This covers both "no such credential anywhere" and "exists, but belongs to someone else".
 * Collapsing the two is intentional: distinguishing them would let a caller enumerate valid
 * credential ids belonging to other users, turning a 403 into an oracle. Callers therefore see a
 * 404 in both cases, while the audit log records what actually happened (SECURITY-08).</p>
 */
public class PasskeyNotFoundException extends RuntimeException {

    private final String credentialId;

    public PasskeyNotFoundException(String credentialId) {
        super("Passkey not found for the authenticated user");
        this.credentialId = credentialId;
    }

    public String getCredentialId() {
        return credentialId;
    }
}

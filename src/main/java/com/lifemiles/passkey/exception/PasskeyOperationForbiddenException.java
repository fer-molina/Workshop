package com.lifemiles.passkey.exception;

/**
 * Raised when an operation targets a credential that exists on the authenticated user but is not
 * a Passkey — for example an attempt to rename or delete their password or OTP credential.
 *
 * <p>The Keycloak credentials endpoint returns every credential type for a user, so without this
 * guard the Passkey API would be a general-purpose credential-deletion API. That would let a
 * client remove a user's password through an endpoint documented as managing Passkeys. Refusing
 * with 403 keeps the API's authority matched to its stated purpose (SECURITY-08).</p>
 */
public class PasskeyOperationForbiddenException extends RuntimeException {

    private final String credentialId;

    public PasskeyOperationForbiddenException(String credentialId) {
        super("The target credential is not a Passkey and cannot be managed through this API");
        this.credentialId = credentialId;
    }

    public String getCredentialId() {
        return credentialId;
    }
}

package com.lifemiles.passkey.service;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.exception.KeycloakUnavailableException;
import com.lifemiles.passkey.exception.PasskeyNotFoundException;
import com.lifemiles.passkey.exception.PasskeyOperationForbiddenException;
import com.lifemiles.passkey.model.PasskeyResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link PasskeyManagementService} with a mocked Keycloak Admin Client.
 *
 * <p>The cases that matter most here are the refusals. A management API that happily deletes any
 * credential id handed to it, or that treats a password credential as a Passkey, is the failure
 * mode worth guarding — so those are tested as thoroughly as the happy paths.</p>
 */
class PasskeyManagementServiceTest {

    private static final String REALM = "lifemiles-test";
    private static final String SUBJECT = "11111111-1111-1111-1111-111111111111";
    private static final String PASSKEY_ID = "22222222-2222-2222-2222-222222222222";
    private static final String PASSWORD_ID = "33333333-3333-3333-3333-333333333333";
    private static final String UNKNOWN_ID = "44444444-4444-4444-4444-444444444444";

    private UserResource userResource;
    private PasskeyManagementService service;

    @BeforeEach
    void setUp() {
        Keycloak keycloak = mock(Keycloak.class);
        RealmResource realmResource = mock(RealmResource.class);
        UsersResource usersResource = mock(UsersResource.class);
        userResource = mock(UserResource.class);

        when(keycloak.realm(REALM)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.get(SUBJECT)).thenReturn(userResource);

        LifeMilesKeycloakProperties properties = new LifeMilesKeycloakProperties();
        properties.setRealm(REALM);

        service = new PasskeyManagementService(keycloak, properties, new PasskeyAuditLogger());
    }

    private static CredentialRepresentation credential(String id, String type, String label, Long created) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setId(id);
        credential.setType(type);
        credential.setUserLabel(label);
        credential.setCreatedDate(created);
        return credential;
    }

    @Test
    void listReturnsOnlyWebAuthnPasswordlessCredentials() {
        when(userResource.credentials()).thenReturn(List.of(
            credential(PASSKEY_ID, "webauthn-passwordless", "iPhone", 1000L),
            credential(PASSWORD_ID, "password", null, 500L),
            credential("55555555-5555-5555-5555-555555555555", "otp", "Authenticator", 700L)
        ));

        List<PasskeyResponse> result = service.list(SUBJECT);

        assertThat(result)
            .as("password and OTP credentials must never appear in a Passkey listing")
            .extracting(PasskeyResponse::id)
            .containsExactly(PASSKEY_ID);
    }

    @Test
    void listSortsNewestFirst() {
        when(userResource.credentials()).thenReturn(List.of(
            credential(PASSKEY_ID, "webauthn-passwordless", "older", 1000L),
            credential(UNKNOWN_ID, "webauthn-passwordless", "newer", 2000L)
        ));

        assertThat(service.list(SUBJECT))
            .extracting(PasskeyResponse::name)
            .containsExactly("newer", "older");
    }

    @Test
    void listToleratesAMissingCreatedDate() {
        // createdDate is nullable in the Keycloak representation; a null must not blow up mapping
        // or sorting.
        when(userResource.credentials()).thenReturn(List.of(
            credential(PASSKEY_ID, "webauthn-passwordless", "no date", null),
            credential(UNKNOWN_ID, "webauthn-passwordless", "dated", 2000L)
        ));

        assertThat(service.list(SUBJECT))
            .extracting(PasskeyResponse::name)
            .containsExactly("dated", "no date");
    }

    @Test
    void listReturnsEmptyWhenKeycloakReturnsNull() {
        when(userResource.credentials()).thenReturn(null);

        assertThat(service.list(SUBJECT)).isEmpty();
    }

    @Test
    void renameSetsTheUserLabel() {
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSKEY_ID, "webauthn-passwordless", "old", 1000L)));

        service.rename(SUBJECT, PASSKEY_ID, "new name");

        verify(userResource).setCredentialUserLabel(PASSKEY_ID, "new name");
    }

    @Test
    void renameRejectsACredentialThatIsNotAPasskey() {
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSWORD_ID, "password", null, 500L)));

        assertThatThrownBy(() -> service.rename(SUBJECT, PASSWORD_ID, "hijacked"))
            .isInstanceOf(PasskeyOperationForbiddenException.class);

        verify(userResource, never()).setCredentialUserLabel(anyString(), anyString());
    }

    @Test
    void renameRejectsAnUnknownCredential() {
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSKEY_ID, "webauthn-passwordless", "mine", 1000L)));

        assertThatThrownBy(() -> service.rename(SUBJECT, UNKNOWN_ID, "whatever"))
            .isInstanceOf(PasskeyNotFoundException.class);

        verify(userResource, never()).setCredentialUserLabel(anyString(), anyString());
    }

    @Test
    void deleteRemovesTheCredential() {
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSKEY_ID, "webauthn-passwordless", "iPhone", 1000L)));

        service.delete(SUBJECT, PASSKEY_ID);

        verify(userResource).removeCredential(PASSKEY_ID);
    }

    @Test
    void deleteRefusesToRemoveAPasswordCredential() {
        // The single most important refusal in this class: without the type check, an API
        // documented as managing Passkeys could delete a user's password.
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSWORD_ID, "password", null, 500L)));

        assertThatThrownBy(() -> service.delete(SUBJECT, PASSWORD_ID))
            .isInstanceOf(PasskeyOperationForbiddenException.class);

        verify(userResource, never()).removeCredential(anyString());
    }

    @Test
    void deleteRejectsACredentialTheUserDoesNotHave() {
        // A credential id belonging to another user is indistinguishable from a non-existent one,
        // which is what prevents this endpoint being used to probe for valid ids.
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSKEY_ID, "webauthn-passwordless", "mine", 1000L)));

        assertThatThrownBy(() -> service.delete(SUBJECT, UNKNOWN_ID))
            .isInstanceOf(PasskeyNotFoundException.class);

        verify(userResource, never()).removeCredential(anyString());
    }

    @Test
    void keycloakFailureOnReadIsWrapped() {
        when(userResource.credentials()).thenThrow(new RuntimeException("connection reset"));

        assertThatThrownBy(() -> service.list(SUBJECT))
            .as("transport detail must not escape the service layer")
            .isInstanceOf(KeycloakUnavailableException.class);
    }

    @Test
    void keycloakFailureOnDeleteIsWrapped() {
        when(userResource.credentials())
            .thenReturn(List.of(credential(PASSKEY_ID, "webauthn-passwordless", "iPhone", 1000L)));
        org.mockito.Mockito.doThrow(new RuntimeException("read timeout"))
            .when(userResource).removeCredential(PASSKEY_ID);

        assertThatThrownBy(() -> service.delete(SUBJECT, PASSKEY_ID))
            .isInstanceOf(KeycloakUnavailableException.class);
    }
}

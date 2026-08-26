package com.lifemiles.passkey.service;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.exception.KeycloakUnavailableException;
import com.lifemiles.passkey.model.RegistrationInitiatedResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PasskeyRegistrationServiceTest {

    private static final String REALM = "lifemiles-test";
    private static final String SUBJECT = "11111111-1111-1111-1111-111111111111";
    private static final String ACTION = "webauthn-register-passwordless";

    private UserResource userResource;
    private PasskeyRegistrationService service;

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

        service = new PasskeyRegistrationService(keycloak, properties, new PasskeyAuditLogger());
    }

    @Test
    void addsTheRequiredActionWhenAbsent() {
        UserRepresentation user = new UserRepresentation();
        user.setRequiredActions(new ArrayList<>());
        when(userResource.toRepresentation()).thenReturn(user);

        RegistrationInitiatedResponse response = service.initiate(SUBJECT);

        ArgumentCaptor<UserRepresentation> captor = ArgumentCaptor.forClass(UserRepresentation.class);
        verify(userResource).update(captor.capture());

        assertThat(captor.getValue().getRequiredActions()).containsExactly(ACTION);
        assertThat(response.alreadyPending()).isFalse();
        assertThat(response.requiredAction()).isEqualTo(ACTION);
    }

    @Test
    void handlesANullRequiredActionsList() {
        // Keycloak omits the field entirely for users that have none, so it arrives as null.
        UserRepresentation user = new UserRepresentation();
        user.setRequiredActions(null);
        when(userResource.toRepresentation()).thenReturn(user);

        service.initiate(SUBJECT);

        ArgumentCaptor<UserRepresentation> captor = ArgumentCaptor.forClass(UserRepresentation.class);
        verify(userResource).update(captor.capture());
        assertThat(captor.getValue().getRequiredActions()).containsExactly(ACTION);
    }

    @Test
    void isIdempotentWhenTheActionIsAlreadyPending() {
        // Tapping "Register a Passkey" twice must not queue two ceremonies, and requiredActions is
        // a plain list that would otherwise hold duplicates.
        UserRepresentation user = new UserRepresentation();
        user.setRequiredActions(new ArrayList<>(List.of(ACTION)));
        when(userResource.toRepresentation()).thenReturn(user);

        RegistrationInitiatedResponse response = service.initiate(SUBJECT);

        verify(userResource, never()).update(org.mockito.ArgumentMatchers.any());
        assertThat(response.alreadyPending()).isTrue();
    }

    @Test
    void preservesOtherRequiredActions() {
        UserRepresentation user = new UserRepresentation();
        user.setRequiredActions(new ArrayList<>(List.of("VERIFY_EMAIL")));
        when(userResource.toRepresentation()).thenReturn(user);

        service.initiate(SUBJECT);

        ArgumentCaptor<UserRepresentation> captor = ArgumentCaptor.forClass(UserRepresentation.class);
        verify(userResource).update(captor.capture());
        assertThat(captor.getValue().getRequiredActions()).containsExactly("VERIFY_EMAIL", ACTION);
    }

    @Test
    void wrapsAKeycloakReadFailure() {
        when(userResource.toRepresentation()).thenThrow(new RuntimeException("connection refused"));

        assertThatThrownBy(() -> service.initiate(SUBJECT))
            .isInstanceOf(KeycloakUnavailableException.class);
    }

    @Test
    void wrapsAKeycloakUpdateFailure() {
        UserRepresentation user = new UserRepresentation();
        user.setRequiredActions(new ArrayList<>());
        when(userResource.toRepresentation()).thenReturn(user);
        org.mockito.Mockito.doThrow(new RuntimeException("read timeout"))
            .when(userResource).update(org.mockito.ArgumentMatchers.any());

        assertThatThrownBy(() -> service.initiate(SUBJECT))
            .isInstanceOf(KeycloakUnavailableException.class);
    }
}

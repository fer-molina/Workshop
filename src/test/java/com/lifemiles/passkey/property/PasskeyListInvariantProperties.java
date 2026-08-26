package com.lifemiles.passkey.property;

import com.lifemiles.passkey.audit.PasskeyAuditLogger;
import com.lifemiles.passkey.config.LifeMilesKeycloakProperties;
import com.lifemiles.passkey.model.PasskeyResponse;
import com.lifemiles.passkey.service.PasskeyManagementService;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * PBT-03 — invariants of the Passkey listing.
 *
 * <p><b>NOT EXECUTED.</b> Excluded from the build by Surefire/Failsafe configuration per the
 * standing instruction of 2026-08-26. See {@link PasskeyResponseRoundTripProperties} for the
 * rationale.</p>
 *
 * <p>Invariants asserted over arbitrary credential sets, which is what a property test buys here:
 * the filtering rule is checked against mixed collections nobody would think to write by hand.</p>
 * <ul>
 *   <li>the listing contains exactly the passwordless-WebAuthn credentials, never more</li>
 *   <li>removing one Passkey from the source shrinks the listing by exactly one</li>
 *   <li>removing a non-Passkey credential leaves the listing unchanged</li>
 * </ul>
 */
class PasskeyListInvariantProperties {

    private static final String REALM = "lifemiles-test";
    private static final String SUBJECT = "11111111-1111-1111-1111-111111111111";
    private static final String PASSKEY_TYPE = "webauthn-passwordless";

    private static PasskeyManagementService serviceReturning(List<CredentialRepresentation> credentials) {
        Keycloak keycloak = mock(Keycloak.class);
        RealmResource realmResource = mock(RealmResource.class);
        UsersResource usersResource = mock(UsersResource.class);
        UserResource userResource = mock(UserResource.class);

        when(keycloak.realm(REALM)).thenReturn(realmResource);
        when(realmResource.users()).thenReturn(usersResource);
        when(usersResource.get(SUBJECT)).thenReturn(userResource);
        when(userResource.credentials()).thenReturn(credentials);

        LifeMilesKeycloakProperties properties = new LifeMilesKeycloakProperties();
        properties.setRealm(REALM);

        return new PasskeyManagementService(keycloak, properties, new PasskeyAuditLogger());
    }

    @Property
    void theListingContainsExactlyThePasskeys(@ForAll("credentialSets") List<CredentialRepresentation> credentials) {
        List<PasskeyResponse> result = serviceReturning(credentials).list(SUBJECT);

        long expected = credentials.stream()
            .filter(credential -> PASSKEY_TYPE.equals(credential.getType()))
            .count();

        assertThat(result).hasSize((int) expected);
    }

    @Property
    void removingOnePasskeyShrinksTheListingByExactlyOne(
        @ForAll("credentialSetsWithAtLeastOnePasskey") List<CredentialRepresentation> credentials
    ) {
        int before = serviceReturning(credentials).list(SUBJECT).size();

        List<CredentialRepresentation> remaining = new ArrayList<>(credentials);
        remaining.removeIf(credential -> PASSKEY_TYPE.equals(credential.getType()));
        // Put back everything except one passkey.
        List<CredentialRepresentation> passkeys = credentials.stream()
            .filter(credential -> PASSKEY_TYPE.equals(credential.getType()))
            .toList();
        remaining.addAll(passkeys.subList(1, passkeys.size()));

        int after = serviceReturning(remaining).list(SUBJECT).size();

        assertThat(after).isEqualTo(before - 1);
    }

    @Property
    void removingANonPasskeyLeavesTheListingUnchanged(
        @ForAll("credentialSetsWithANonPasskey") List<CredentialRepresentation> credentials
    ) {
        int before = serviceReturning(credentials).list(SUBJECT).size();

        List<CredentialRepresentation> remaining = new ArrayList<>(credentials);
        remaining.remove(remaining.stream()
            .filter(credential -> !PASSKEY_TYPE.equals(credential.getType()))
            .findFirst()
            .orElseThrow());

        assertThat(serviceReturning(remaining).list(SUBJECT)).hasSize(before);
    }

    @Provide
    Arbitrary<List<CredentialRepresentation>> credentialSets() {
        return credentials().list().ofMinSize(0).ofMaxSize(12);
    }

    @Provide
    Arbitrary<List<CredentialRepresentation>> credentialSetsWithAtLeastOnePasskey() {
        return credentialSets()
            .filter(list -> list.stream().anyMatch(credential -> PASSKEY_TYPE.equals(credential.getType())));
    }

    @Provide
    Arbitrary<List<CredentialRepresentation>> credentialSetsWithANonPasskey() {
        return credentialSets()
            .filter(list -> list.stream().anyMatch(credential -> !PASSKEY_TYPE.equals(credential.getType())));
    }

    private Arbitrary<CredentialRepresentation> credentials() {
        Arbitrary<String> types = Arbitraries.of(PASSKEY_TYPE, "password", "otp", "webauthn");
        Arbitrary<String> ids = Arbitraries.strings().alpha().numeric().ofLength(12);
        Arbitrary<Long> created = Arbitraries.longs().between(0L, 4_000_000_000_000L);

        return ids.flatMap(id -> types.flatMap(type -> created.map(date -> {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setId(id);
            credential.setType(type);
            credential.setUserLabel("label-" + id);
            credential.setCreatedDate(date);
            return credential;
        })));
    }
}

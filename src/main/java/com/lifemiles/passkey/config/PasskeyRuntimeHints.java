package com.lifemiles.passkey.config;

import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

/**
 * Registers GraalVM native-image hints for classes reached only reflectively (NFR-6).
 *
 * <p>The project's own DTOs are records serialised by Jackson's record support, which Spring Boot's
 * AOT processing already handles, so they are not listed here. What AOT cannot see is the Keycloak
 * Admin Client's representation classes: they are deserialised reflectively from JAX-RS responses,
 * and without these hints the native image would strip their constructors and accessors, producing
 * an empty or failing deserialisation at runtime rather than a compile-time error.</p>
 *
 * <p>Only the two representations this service actually touches are registered. Registering the
 * whole Keycloak model would bloat the image and hide which types genuinely matter.</p>
 */
public class PasskeyRuntimeHints implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.reflection()
            .registerType(CredentialRepresentation.class,
                MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                MemberCategory.INVOKE_DECLARED_METHODS,
                MemberCategory.ACCESS_DECLARED_FIELDS)
            .registerType(UserRepresentation.class,
                MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                MemberCategory.INVOKE_DECLARED_METHODS,
                MemberCategory.ACCESS_DECLARED_FIELDS);
    }
}

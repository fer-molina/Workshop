package com.lifemiles.passkey.config;

import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

/**
 * Registers GraalVM native-image reflection/proxy hints required for classes that are
 * accessed reflectively at runtime and would otherwise be stripped or fail under
 * native-image compilation.
 *
 * <p><b>Unit 1 scope</b>: this class is scaffolded as the single registration point for
 * native hints, but does not yet register any Keycloak Admin Client DTOs, since no
 * production code depends on them yet. Unit 3 (Spring Boot Backend) extends this class
 * with the concrete hints required by {@code PasskeyRegistrationService} and
 * {@code PasskeyManagementService} once they are implemented, per the native-readiness
 * requirement (NFR-6) and the guidance in {@code implementation-plan-passkey-lifemiles.md}
 * Task 1 / Task 3.</p>
 */
public class PasskeyRuntimeHints implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        // Intentionally empty in Unit 1. Populated in Unit 3 when Keycloak Admin Client
        // request/response classes are introduced for Passkey registration and management.
    }
}

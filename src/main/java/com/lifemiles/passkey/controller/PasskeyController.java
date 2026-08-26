package com.lifemiles.passkey.controller;

import com.lifemiles.passkey.model.PasskeyResponse;
import com.lifemiles.passkey.model.RegistrationInitiatedResponse;
import com.lifemiles.passkey.model.RenamePasskeyRequest;
import com.lifemiles.passkey.security.AuthenticatedUser;
import com.lifemiles.passkey.service.PasskeyManagementService;
import com.lifemiles.passkey.service.PasskeyRegistrationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Passkey management API for the authenticated user (FR-9, FR-11).
 *
 * <p><b>No endpoint accepts a user identifier.</b> The subject is always taken from the validated
 * JWT via {@link AuthenticatedUser}. That is what makes IDOR structurally impossible here rather
 * than a check that a future endpoint might omit (SECURITY-08).</p>
 *
 * <p>Every request reaching this class has already been authenticated by the deny-by-default filter
 * chain in {@code SecurityConfig}; there is no anonymous path into it.</p>
 */
@RestController
@RequestMapping("/api/v1/passkeys")
@Validated
public class PasskeyController {

    /**
     * Keycloak credential ids are UUIDs. Constraining the path variable rejects malformed input at
     * the edge with a 400 instead of forwarding it to Keycloak (SECURITY-05), and keeps hostile
     * values out of the audit log.
     */
    private static final String UUID_PATTERN =
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    private final PasskeyManagementService managementService;
    private final PasskeyRegistrationService registrationService;
    private final AuthenticatedUser authenticatedUser;

    public PasskeyController(
        PasskeyManagementService managementService,
        PasskeyRegistrationService registrationService,
        AuthenticatedUser authenticatedUser
    ) {
        this.managementService = managementService;
        this.registrationService = registrationService;
        this.authenticatedUser = authenticatedUser;
    }

    /** Lists the caller's Passkeys, newest first. */
    @GetMapping
    public List<PasskeyResponse> list() {
        return managementService.list(authenticatedUser.requireSubject());
    }

    /** Renames one of the caller's Passkeys. */
    @PutMapping("/{id}/name")
    public ResponseEntity<Void> rename(
        @PathVariable @Pattern(regexp = UUID_PATTERN, message = "must be a UUID") String id,
        @Valid @RequestBody RenamePasskeyRequest request
    ) {
        managementService.rename(authenticatedUser.requireSubject(), id, request.name());
        return ResponseEntity.noContent().build();
    }

    /** Revokes one of the caller's Passkeys. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable @Pattern(regexp = UUID_PATTERN, message = "must be a UUID") String id
    ) {
        managementService.delete(authenticatedUser.requireSubject(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Schedules Passkey enrolment for the caller (FR-3).
     *
     * <p>Returns 202 rather than 201: nothing has been created yet. The enrolment ceremony runs in
     * Keycloak at the user's next login, so the correct semantics are "accepted, will happen".</p>
     */
    @PostMapping("/register/initiate")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.ACCEPTED)
    public RegistrationInitiatedResponse initiateRegistration() {
        return registrationService.initiate(authenticatedUser.requireSubject());
    }
}

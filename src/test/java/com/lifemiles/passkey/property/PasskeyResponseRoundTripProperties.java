package com.lifemiles.passkey.property;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lifemiles.passkey.model.PasskeyResponse;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PBT-02 — JSON round-trip property for {@link PasskeyResponse}.
 *
 * <p><b>NOT EXECUTED.</b> Property tests are excluded from the build by explicit Surefire and
 * Failsafe configuration, per the standing instruction of 2026-08-26 ("no ejecutes las property
 * test"). They are generated because the PBT Partial extension rules remain enabled, so the
 * artifacts are required; the exclusion is in {@code pom.xml} rather than merely "not run once", so
 * the instruction holds for anyone who builds this project later.</p>
 *
 * <p>The property being asserted: serialising a {@code PasskeyResponse} and reading it back yields
 * an equal value for every input, including the awkward ones — a {@code null} label (Keycloak
 * returns one when the user never named the device) and a {@code null} timestamp.</p>
 */
class PasskeyResponseRoundTripProperties {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Property
    void serialisingAndReadingBackYieldsAnEqualValue(@ForAll("passkeyResponses") PasskeyResponse original)
        throws Exception {
        String json = objectMapper.writeValueAsString(original);
        PasskeyResponse restored = objectMapper.readValue(json, PasskeyResponse.class);

        assertThat(restored).isEqualTo(original);
    }

    @Provide
    Arbitrary<PasskeyResponse> passkeyResponses() {
        Arbitrary<String> ids = Arbitraries.strings().alpha().numeric().ofMinLength(1).ofMaxLength(40);

        // Includes null: Keycloak leaves userLabel unset when the user never named the device, and
        // the DTO documents that callers must tolerate it.
        Arbitrary<String> names = Arbitraries.oneOf(
            Arbitraries.just(null),
            Arbitraries.strings().ofMinLength(1).ofMaxLength(100));

        // Milliseconds only: Instant has nanosecond precision but Keycloak's createdDate is epoch
        // millis, so generating sub-millisecond values would test a case that cannot occur and
        // would fail on a precision loss that does not matter.
        Arbitrary<Instant> createdAt = Arbitraries.oneOf(
            Arbitraries.just(null),
            Arbitraries.longs().between(0L, 4_000_000_000_000L).map(Instant::ofEpochMilli));

        return Arbitraries.of(0).flatMap(ignored ->
            ids.flatMap(id ->
                names.flatMap(name ->
                    createdAt.map(created -> new PasskeyResponse(id, name, created)))));
    }
}

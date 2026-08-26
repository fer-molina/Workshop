package com.lifemiles.passkey.property;

import com.lifemiles.passkey.model.RenamePasskeyRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PBT-07 — domain-specific generators for {@link RenamePasskeyRequest}, and the validation
 * properties that follow from them.
 *
 * <p><b>NOT EXECUTED.</b> Excluded from the build by Surefire/Failsafe configuration per the
 * standing instruction of 2026-08-26. See {@link PasskeyResponseRoundTripProperties} for the
 * rationale.</p>
 *
 * <p>Two complementary properties: every value the domain generator produces is accepted, and every
 * value from the hostile generator is rejected. The second is the one worth having — it asserts the
 * control-character rule holds for arbitrary control characters rather than just the newline someone
 * happened to think of.</p>
 */
class RenamePasskeyRequestProperties {

    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();

    @Property
    void everyValidLabelIsAccepted(@ForAll("validLabels") String name) {
        assertThat(VALIDATOR.validate(new RenamePasskeyRequest(name))).isEmpty();
    }

    @Property
    void anyLabelContainingAControlCharacterIsRejected(@ForAll("labelsWithControlCharacters") String name) {
        // Control characters matter because the label reaches the audit log: a newline would let a
        // user forge log lines and corrupt the trail NFR-5 depends on.
        assertThat(VALIDATOR.validate(new RenamePasskeyRequest(name))).isNotEmpty();
    }

    @Property
    void anyLabelOverTheLengthLimitIsRejected(@ForAll("tooLongLabels") String name) {
        assertThat(VALIDATOR.validate(new RenamePasskeyRequest(name))).isNotEmpty();
    }

    @Provide
    Arbitrary<String> validLabels() {
        // Realistic device names: letters, digits, spaces and common punctuation, within the bound.
        return Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars(' ', '-', '_', '.', '\'')
            .ofMinLength(1)
            .ofMaxLength(100)
            // A label of only spaces is blank and legitimately rejected, so it does not belong in
            // the "valid" generator.
            .filter(candidate -> !candidate.isBlank());
    }

    @Provide
    Arbitrary<String> labelsWithControlCharacters() {
        // C0 control characters plus DEL. Composed with oneOf rather than a fluent `or`, which
        // CharacterArbitrary does not expose in jqwik 1.9.3.
        Arbitrary<Character> controlCharacters = Arbitraries.oneOf(
            Arbitraries.chars().range((char) 0, (char) 31),
            Arbitraries.just((char) 127));

        return Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(50)
            .flatMap(prefix -> controlCharacters.map(control -> prefix + control));
    }

    @Provide
    Arbitrary<String> tooLongLabels() {
        return Arbitraries.strings().alpha().ofMinLength(101).ofMaxLength(300);
    }
}

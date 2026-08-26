<#--
  Passkey registration (enrolamiento) ceremony (FR-3, UI portion).

  Rendered by Keycloak for the "Webauthn Register Passwordless" required action. The policy
  values (relying party, signature algorithms, resident-key and user-verification
  requirements, attestation preference, timeout) come from the realm's WebAuthn Passwordless
  Policy configured in Unit 1 — this template does not decide them.

  Field names match Keycloak's own webauthn-register template and must not be renamed:
  clientDataJSON, attestationObject, publicKeyCredentialId, authenticatorLabel, transports,
  error.

  The device label is bounded here for the user's benefit only. Authoritative validation is
  server-side in Unit 3 (SECURITY-05 — a client-side bound is not a control).
-->
<#import "login-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section = "form">
    <form id="register" action="${url.loginAction}" method="post">
      <input type="hidden" id="clientDataJSON" name="clientDataJSON"/>
      <input type="hidden" id="attestationObject" name="attestationObject"/>
      <input type="hidden" id="publicKeyCredentialId" name="publicKeyCredentialId"/>
      <input type="hidden" id="authenticatorLabel" name="authenticatorLabel"/>
      <input type="hidden" id="transports" name="transports"/>
      <input type="hidden" id="error" name="error"/>
    </form>

    <div id="passkey-register"></div>

    <script>
      (function () {
        <#-- COSE algorithm identifiers permitted by the realm policy (for example -7 for ES256). -->
        const signatureAlgorithms = [
          <#if signatureAlgorithms??>
            <#list signatureAlgorithms as algorithm>
              ${algorithm?c}<#if algorithm_has_next>,</#if>
            </#list>
          </#if>
        ];

        <#-- Credentials the user already registered, so the authenticator can avoid duplicates. -->
        const excludeCredentialIds = [
          <#if excludeCredentialIds?? && excludeCredentialIds?has_content>
            <#list excludeCredentialIds?split(",") as credentialId>
              "${credentialId?trim?js_string}"<#if credentialId_has_next>,</#if>
            </#list>
          </#if>
        ];

        window.renderPasskeyRegister({
          action_url: "${url.loginAction}",
          language: "${locale.current}",
          client_id: "${client.clientId}",
          challenge: "${(challenge!"")?js_string}",
          rpId: "${(rpId!"")?js_string}",
          rpEntityName: "${(rpEntityName!"")?js_string}",
          userId: "${(userid!"")?js_string}",
          username: "${(username!"")?js_string}",
          signatureAlgorithms: signatureAlgorithms,
          userVerification: "${(userVerificationRequirement!"required")?js_string}",
          requireResidentKey: "${(requireResidentKey!"Yes")?js_string}",
          attestationConveyancePreference: "${(attestationConveyancePreference!"none")?js_string}",
          authenticatorAttachment: "${(authenticatorAttachment!"platform")?js_string}",
          createTimeout: ${(createTimeout!0)?c},
          excludeCredentialIds: excludeCredentialIds,
          restartFlow: "${url.loginRestartFlowUrl}"
        });
      })();
    </script>
  </#if>
</@layout.registrationLayout>

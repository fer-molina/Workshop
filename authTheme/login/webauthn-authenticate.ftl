<#--
  Passwordless authentication ceremony (FR-5, UI portion).

  Keycloak renders this screen when the WebAuthn Passwordless authenticator is selected in
  the browser flow (configured as an ALTERNATIVE execution in Unit 1). The values below —
  challenge, allowed credentials, relying-party id and the policy settings — are placed in
  the template model by Keycloak itself; this template only forwards them to the SPA.

  The form fields are the ones Keycloak's own webauthn-authenticate template posts back, so
  the names must not be changed: clientDataJSON, authenticatorData, signature, credentialId,
  userHandle, error.

  Deliberately does NOT reference hub-mfa-auth-ui, which is out of scope for this solution.
-->
<#import "login-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section = "form">
    <form id="webauth" action="${url.loginAction}" method="post">
      <input type="hidden" id="clientDataJSON" name="clientDataJSON"/>
      <input type="hidden" id="authenticatorData" name="authenticatorData"/>
      <input type="hidden" id="signature" name="signature"/>
      <input type="hidden" id="credentialId" name="credentialId"/>
      <input type="hidden" id="userHandle" name="userHandle"/>
      <input type="hidden" id="error" name="error"/>
    </form>

    <div id="passkey-authenticate"></div>

    <script>
      (function () {
        <#--
          Credential ids Keycloak will accept for this user. Empty means a discoverable
          (usernameless) credential is expected.
        -->
        const allowCredentials = [
          <#if authenticators??>
            <#list authenticators.authenticators as authenticator>
              "${authenticator.credentialId?js_string}"<#if authenticator_has_next>,</#if>
            </#list>
          </#if>
        ];

        window.renderPasskeyAuthenticate({
          action_url: "${url.loginAction}",
          language: "${locale.current}",
          client_id: "${client.clientId}",
          challenge: "${(challenge!"")?js_string}",
          rpId: "${(rpId!"")?js_string}",
          allowCredentials: allowCredentials,
          userVerification: "${(userVerification!"required")?js_string}",
          createTimeout: ${(createTimeout!0)?c},
          isUserIdentified: ${(isUserIdentified!"false")?js_string} === "true",
          restartFlow: "${url.loginRestartFlowUrl}"
        });
      })();
    </script>
  </#if>
</@layout.registrationLayout>

<#import "login-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#if section = "form">
    <div id="login">
      <script>
        const providers = [
          <#list social.providers as provider>
            {
              alias: "${provider.alias?js_string}",
              displayName: "${provider.displayName?js_string}",
              url: "${provider.loginUrl}"
            }
            <#if provider_has_next>,</#if>
          </#list>
        ];

        let loginUri = "", errorCode = null, traceId= null, errorDescription = null, restartFlow=null;
        <#if errorCode?has_content>
          errorCode = "${errorCode?js_string}";
          traceId = "${traceID?js_string}";
          errorDescription = "${errorDescription?js_string}";
          restartFlow= "${url.loginRestartFlowUrl}"
        </#if>

        <#if login_uri?has_content>
          loginUri = "${login_uri?js_string}";
        </#if>

        let rememberMe = false
        <#if realm.rememberMe>
          rememberMe = "${realm.rememberMe???c}";
        </#if>

        let registrationUrl = ""
        <#if realm.registrationAllowed && !registrationDisabled??>
            registrationUrl = "${url.registrationUrl}"
        </#if>

        /*
         * Authenticator choices Keycloak is offering for this step of the browser flow.
         *
         * Needed so the SPA can offer Passkey (FR-1): unlike a federated identity provider,
         * an ALTERNATIVE execution is selected by POSTing `authenticationExecution` to
         * `action_url`, which requires its execution id. `providerId` is included so the SPA
         * can identify the WebAuthn execution without matching on a localized label.
         *
         * Every access is guarded with FreeMarker's default operator: `auth` is absent on
         * some screens, and a missing value must degrade to an empty list rather than break
         * the login page (NFR-3).
         */
        const authenticationSelections = [
          <#if auth?? && auth.authenticationSelections??>
            <#list auth.authenticationSelections as selection>
              {
                authExecId: "${(selection.authExecId)!""?js_string}",
                providerId: "${((selection.authenticationExecution.authenticator)!"")?js_string}",
                displayName: "${((selection.displayName)!"")?js_string}",
                helpText: "${((selection.helpText)!"")?js_string}"
              }
              <#if selection_has_next>,</#if>
            </#list>
          </#if>
        ];

        window.renderLogin({ loginUri, rememberMe, providers, realmName: "${realm.displayNameHtml?js_string}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", errorCode, traceId, errorDescription, restartFlow, registrationUrl, authenticationSelections});
      </script>
    </div>
  </#if>
</@layout.registrationLayout>

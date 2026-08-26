<#import "template-mfa.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
    <#if section="form">
        <div id="mfa">
            <script>
                let methodId = ""
                <#if appMethod == "Google Authenticator">
                    methodId = "${properties['kcAppID-GoogleAuthenticator']}"
                <#elseif appMethod == "Microsoft Authenticator">
                    methodId = "${properties['kcAppID-MicrosoftAuthenticator']}"
                </#if>

                const methodApp = {
                    methodId,
                    qrApp: "data:image/png;base64,${qrCodeImage}",
                    secretKey: "${totpSecret}"
                }

                let error = {};
                <#if errorCode?has_content>
                    error.errorCode = "${errorCode?js_string}";
                    error.traceId = "${traceID?js_string}";
                    error.errorDescription = "${errorDescription?js_string}";
                </#if>

                window.renderMFA({ error, methodApp, methodSelected: "APP", realmName: "${realm.displayNameHtml?js_string}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", isTemplate: true, componentId: "mfa-app-preactivation" });
            </script>
        </div>
    </#if>
</@layout.registrationLayout>

<#import "template-mfa.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
    <#if section="form">
        <div id="mfa">
            <script>
                let methodId = ""
                <#if authenticatorApp?has_content>
                    <#if authenticatorApp == "Google Authenticator">
                        methodId = "${properties['kcAppID-GoogleAuthenticator']}"
                    <#elseif authenticatorApp == "Microsoft Authenticator">
                        methodId = "${properties['kcAppID-MicrosoftAuthenticator']}"
                    </#if>
                </#if>

                
                const methodApp = {
                    methodId
                }

                let error = {};
                <#if errorCode?has_content>
                    error.errorCode = "${errorCode?js_string}";
                    error.traceId = "${traceID?js_string}";
                    error.errorDescription = "${errorDescription?js_string}";
                </#if>

                window.renderMFA({ error, methodApp, restartFlow: "${url.loginRestartFlowUrl}", realmName: "${realm.displayNameHtml?js_string}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", isTemplate: true, componentId: "mfa-app-confirm" });
            </script> 
        </div>
    </#if>
</@layout.registrationLayout>
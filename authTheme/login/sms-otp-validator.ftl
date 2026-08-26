<#import "template-mfa.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
    <#if section="form">
        <div id="mfa">
            <script>
                let error = {};
                <#if errorCode?has_content>
                    error.errorCode = "${errorCode?js_string}";
                    error.traceId = "${traceID?js_string}";
                    error.errorDescription = "${errorDescription?js_string}";
                </#if>

                window.renderMFA({ error, methodSelected: "SMS", destination: "${destination}", restartFlow: "${url.loginRestartFlowUrl}", realmName: "${realm.displayNameHtml?js_string}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", isTemplate: true, componentId: "mfa-sms-confirm" });
            </script> 
        </div>
    </#if>
</@layout.registrationLayout>

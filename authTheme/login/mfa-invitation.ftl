<#import "template-mfa.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
  <#assign offerMethods = (offerMethods)![] />
  <#if section="form">
    <div id="mfa">
      <script>
        <#if offerMethods?has_content>
          const offerMethods = [
						<#list offerMethods as method>
							"${method?js_string}"
							<#if method_has_next>,</#if>
						</#list>
          ];
        </#if>

				let error = {};
				<#if errorCode?has_content>
						error.errorCode = "${errorCode?js_string}";
						error.traceId = "${traceID?js_string}";
						error.errorDescription = "${errorDescription?js_string}";
				</#if>

        window.renderMFA({ error, offerMethods, restartFlow: "${url.loginRestartFlowUrl}", realmName: "${realm.displayNameHtml?js_string}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", isTemplate: true, componentId: "mfa-initial-page" });
      </script> 
    </div>
  </#if>
</@layout.registrationLayout>
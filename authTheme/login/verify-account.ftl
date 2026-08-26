<#import "enrollment-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
	<#if section="form">
		<div id="hub-enrollment-app">
      <script>
				let error = {};
				<#if errorCode?has_content>
					error.errorCode = "${errorCode?js_string}";
					error.traceId = "${traceID?js_string}";
					error.errorDescription = "${errorDescription?js_string}";
				</#if>

        window.renderHubEnrollment({ error, restartFlow: "${url.loginRestartFlowUrl}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", isTemplate: true, componentId: "create-password-form" });
      </script>
    </div>
  </#if>
</@layout.registrationLayout>
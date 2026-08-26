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

				let emailSender = "";
				<#if emailSender?has_content>
					emailSender = "${emailSender?js_string}";
				</#if>

				window.renderHubEnrollment({ 
					error: error, 
					emailSender,
					restartFlow: "${url.loginRestartFlowUrl}", 
					language: "${locale.current}", 
					client_id: "${client.clientId}", 
					action_url: "${url.registrationAction}", 
					isTemplate: true, 
					componentId: "validate-otp-form" 
				});
			</script>
		</div>
	</#if>
</@layout.registrationLayout>
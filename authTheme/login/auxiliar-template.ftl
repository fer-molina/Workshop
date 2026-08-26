<#import "login-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
  <#if section="form">
		<#assign cleanedJSON = loginCredentials?replace("&quot;", "\"") />
		<#assign jsonObj = cleanedJSON?eval />
		<form id="auxiliar-form" action="${url.loginAction}" method="post">
			<div id="success-login" class="activation-auxiliar-container">
				<script>
					window.renderLoginSuccess({
						loginCredentials: {
							"user": "${jsonObj.username}",
							"pass": "${jsonObj.password}"
						},
						hasMfa: "${hasMfa!'false'}",
						language: "${locale.current}",
						client_id: "${client.clientId}"
					});
				</script>
			</div>
		</form>
  </#if>
</@layout.registrationLayout>

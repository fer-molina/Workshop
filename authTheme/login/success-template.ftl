<#import "template-mfa.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
  <#if section = "form">
    <div id="mfa">
      <script>
        let skipView = false
        <#if skipView?has_content>
          skipView = true;
        </#if>
        window.renderMFA({ skipView, realmName: "${realm.displayNameHtml?js_string}", language: "${locale.current}", client_id: "${client.clientId}", action_url:"${url.loginAction}", isTemplate: true, componentId: "mfa-confirmation-success" });
      </script> 
    </div>
  </#if>
</@layout.registrationLayout>
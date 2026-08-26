<#import "error-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
  <#if section="form">
    <div id="generalError">
      <script>
        let errorCode = "unknown_error";
        let traceId = "generalErrorTraceId";
        <#if errorCode?has_content>
          errorCode = "${errorCode?js_string}";
        </#if>
        <#if traceID?has_content>
          traceId = "${traceID?js_string}";
        </#if>
        window.renderGeneralError({ restartFlow: "${url.loginRestartFlowUrl}", language: "${locale.current}", errorCode, traceId: traceId, client_id: "${client.clientId}"  });
      </script>
    </div>
  </#if>
</@layout.registrationLayout>

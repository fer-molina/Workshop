<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=false displayRequiredFields=false>
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8"> 
      <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,minimum-scale=1,maximum-scale=1">
      <meta http-equiv="Cache-Control" content="no-store" />
      <meta http-equiv="Pragma" content="no-cache" />
      <meta http-equiv="Expires" content="0" />
      
      <title>lifemiles</title>
      <link rel="icon" href="https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/ICO.ico" />
      
      <script type="module">
        import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";
        startSessionPolling("${url.ssoLoginInOtherTabsUrl?no_esc}");
      </script>

      <#assign dateHash = .now?string("yyyyMMddHHmmss") />
      <#assign apiUrl = (cms_env == "prd")?then("https://d296xu67oj0g2g.cloudfront.net", "https://d2ptwux79zic3h.cloudfront.net")>
      <script type="text/javascript" src="${apiUrl}/v1/lm-tecnologias-interactivas/hub-keycloack-login-ui/${cms_env}/env-config.js?v=${dateHash}"></script>
      <script type="text/javascript" src="${apiUrl}/v1/lm-tecnologias-interactivas/hub-keycloack-login-ui/${cms_env}/assets/main.js?v=${dateHash}"></script>
      <link rel="stylesheet" href="${apiUrl}/v1/lm-tecnologias-interactivas/hub-keycloack-login-ui/${cms_env}/assets/main.css?v=${dateHash}" />
    </head>
    <body>
      <#nested "form">
    </body>
  </html>
</#macro>

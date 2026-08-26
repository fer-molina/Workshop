<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=false displayRequiredFields=false>
	<!DOCTYPE html>
	<html <#if realm.internationalizationEnabled> lang="${locale.currentLanguageTag}" dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="robots" content="noindex, nofollow">
      <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,minimum-scale=1,maximum-scale=1">

      <title>lifemiles</title>
      <link rel="icon" href="https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/ICO.ico" />
        
      <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
          <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
      </#if>
      <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
          <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
      </#if>
			
      <script type="importmap">{"imports": { "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js" }}</script>
    </head>
    <body>
      <div id="kc-content">
        <#nested "form">
      </div>
    </body>
</html>
</#macro>

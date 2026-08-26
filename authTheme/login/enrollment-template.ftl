<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=false displayRequiredFields=false>
	<!DOCTYPE html>
  <html <#if realm.internationalizationEnabled> lang="${locale.currentLanguageTag}" dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>
    <head>
			<meta charset="UTF-8"> 
			<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,minimum-scale=1,maximum-scale=1">
			<meta http-equiv="Cache-Control" content="no-store" />
			<meta http-equiv="Pragma" content="no-cache" />
			<meta http-equiv="Expires" content="0" />

			<title>lifemiles</title>
			<link rel="icon" href="https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/ICO.ico" />

			<#assign dateHash = .now?string("yyyyMMddHHmmss") />
			<#assign apiUrl = (cms_env == "prd")?then("https://d296xu67oj0g2g.cloudfront.net", "https://d2ptwux79zic3h.cloudfront.net")>
			<script type="text/javascript" src="${apiUrl}/v1/lm-tecnologias-interactivas/hub-enrollment-ui/${cms_env}/env-config.js?v=${dateHash}"></script>
      <script type="text/javascript" src="${apiUrl}/v1/lm-tecnologias-interactivas/hub-enrollment-ui/${cms_env}/hub-enrollment-ui.js?v=${dateHash}"></script>
      <link rel="stylesheet" href="${apiUrl}/v1/lm-tecnologias-interactivas/hub-enrollment-ui/${cms_env}/hub-enrollment-ui.css?v=${dateHash}" />
		</head>
		<body>
			<#nested "form">
		</body>
		<script async type="text/javascript">
			if (!!window.MSInputMethodContext && !!document.documentMode) {
				document.querySelector("body").classList.add("ie")
				document.querySelector("body").classList.add("ie11")
			} else if (navigator.userAgent.search("MSIE") >= 0) {
				document.querySelector("body").classList.add("ie")
				document.querySelector("body").classList.add("ie10")
			}
		</script>
  </html>
</#macro>

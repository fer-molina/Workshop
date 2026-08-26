<#import "general-template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section="form">
        <script>
            window.location.reload();
        </script>
        <div class="loader-content">
            <img src="https://d37uon415krwv2.cloudfront.net/website_assets/public/images/full-page-loader.gif"/>
        </div>
    </#if>
</@layout.registrationLayout>
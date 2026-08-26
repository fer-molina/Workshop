<#import "template-mfa.ftl" as layout>
    <@layout.registrationLayout displayMessage=false displayInfo=false; section>
        <#if section="header">
            <#elseif section="form">
            <div class="mfa-alert-body">
                <form action="${url.loginAction}" method="post" id="mfa-form">
                    <button type="submit" class="mfa-alert-back-button" name="mfa_action" value="back_to_invitation">
                        <img src="${url.resourcesPath}/img/mfa-go-back-icon.png" alt="Back Arrow">
                        <span>${msg('dsta.back.text')}</span>
                    </button>

                    <h1 class="alert-title">${msg('dsta.title')}</h1>

                    <div class="alert-mfa-container">
                        <span>${msg('dsta.message')}</span>

                        <div class="alert-mfa-checkbox">
                            <input type="checkbox" id="dont-show-again" name="dontShowAgain">
                            <label for="dont-show-again">${msg('dsta.checkbox.message')}</label>
                        </div>

                        <div class="alert-btn-container">
                            <button type="submit" class="alert-mfa-button" name="mfa_action" value="confirm_dont_show_again" id="continue-button" disabled>
                                <span>${msg('dsta.continue.text')}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Add MFA-specific class to the card-pf element for styling
                        const cardElement = document.querySelector('.card-pf');
                        if (cardElement) {
                            cardElement.classList.add('dont-show-again-mfa');
                        }

                        // Handle checkbox and button state
                        const checkbox = document.getElementById('dont-show-again');
                        const continueButton = document.getElementById('continue-button');

                        if (checkbox && continueButton) {
                            // Enable/disable button based on checkbox state
                            checkbox.addEventListener('change', function() {
                                continueButton.disabled = !this.checked;
                            });
                        }
                    });
                </script>
                <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
        </#if>
    </@layout.registrationLayout>
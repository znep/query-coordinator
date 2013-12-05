$(function ()
{
    if ($('body').is('.signup'))
    {
        $("#signup #signup_email").focus();
    }

    $("#signup_submit").click(function() {
        $("#signup #signupForm").submit();
    });

    $("#signup #signupForm").submit(function() {
        if ($(this).valid())
        {
            $('.actionButtons .signup_loadingIndicatorContainer').show();
        }
    });

    var $content = $('<div/>').append($.t('account.common.form.password_requirements_html'));

    $('.passwordHint').socrataTip({ content: $content });

    blist.util.loadCaptcha('captchaPlaceholder');

    // Signup form validation.
    var $validator = $("#signup #signupForm, .loginScreen #signupForm").validate({
        rules: {
            "signup[screenName]": {
                required: true
            },
            "signup[email]": {
                required: true,
                email: true
            },
            "signup[emailConfirm]": {
                required: true,
                equalTo: "#signup_email"
            },
            "signup[password]": {
                required: true,
                minlength: 8
            },
            "signup[passwordConfirm]": {
                required: true,
                equalTo: "#signup_password"
            },
            "signup[accept_terms]": {
                required: true
            }
        },
        messages: {
            "signup[login]": {
                remote: "That username is unavailable."
            }
        }
    });
});

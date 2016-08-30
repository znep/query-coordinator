$(function ()
{
    $("#password").focus();
    
    // Signup form validation.
    $("#resetPasswordForm").validate({
        rules: {
            "password": {
                required: true,
                minlength: 8
            },
            confirm_password: {
                required: true,
                equalTo: "#password"
            }
        }
    });

    var $content = $('<div/>').append($.t('account.common.form.password_requirements_html'));

    $('.passwordHint').socrataTip({ content: $content });
});

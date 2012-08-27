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

    var $content = $('<p>Your password must be <b>between 8 and 40 characters</b> and satisfy <b>three of the following four criteria</b>:</p><p></p><ul><li>&bull; contain a digit</li><li>&bull; contain a lowercase letter</li><li>&bull; contain an uppercase letter</li><li>&bull; contain a non-alphanumeric symbol</li></ul>');

    $('.passwordHint').socrataTip({ content: $content });
});

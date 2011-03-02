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
});

$(function ()
{
    $("#password").focus();
    
    // Signup form validation.
    $("#resetPasswordForm").validate({
        rules: {
            "password": {
                required: true,
                minlength: 6
            },
            confirm_password: {
                required: true,
                equalTo: "#password"
            }
        }
    });
});

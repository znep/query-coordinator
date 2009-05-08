$(function ()
{
    $("#password").focus();
    
    // Signup form validation.
    $("#resetPasswordForm").validate({
        rules: {
            "password": "required",
            confirm_password: {
                required: true,
                equalTo: "#password"
            }
        }
    });
});

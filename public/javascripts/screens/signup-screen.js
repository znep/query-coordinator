$(function ()
{
    if ($('body').is('.signup'))
    {
        $("#signup #account_firstName").focus();
    }

    $("#signup .fileInputContainer input[type='file']").change(function()
    {
        $("#signup .fileInputContainer input[type='text']").val($(this).val());
    });

    // Signup form validation.
    $("#signup #signupForm").validate({
        rules: {
            "account[firstName]": "required",
            "account[lastName]": "required",
            "account[email]": {
                required: true,
                email: true
            },
            emailConfirm: {
                required: true,
                equalTo: "#account_email"
            },
            "account[login]": "required",
            "account[password]": "required",
            passwordConfirm: {
                required: true,
                equalTo: "#account_password"
            }
        }
    });
});

$(function ()
{
    if ($('body').is('.signup'))
    {
        $("#signup #firstName").focus();
    }

    $("#signup .fileInputContainer input[type='file']").change(function()
    {
        $("#signup .fileInputContainer input[type='text']").val($(this).val());
    });

    $.validator.addMethod("loginRegex", function(value, element) {
        return this.optional(element) || /^[a-z0-9\-]+$/i.test(value);
    }, "Username must contain only letters, numbers, or dashes.");

    $.validator.addMethod("login4x4", function(value, element) {
        return this.optional(element) || !/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(value);
    }, "Username cannot be in the form nnnn-nnnn.");

    // Signup form validation.
    $("#signup #signupForm").validate({
        rules: {
            "firstName": "required",
            "lastName": "required",
            "email": {
                required: true,
                email: true
            },
            "emailConfirm": {
                required: true,
                equalTo: "#email"
            },
            "login": {
                required: true,
                loginRegex: true,
                login4x4: true,
                remote: "/users?method=loginAvailable"
            },
            "password": "required",
            "passwordConfirm": {
                required: true,
                equalTo: "#password"
            }
        },
        messages: {
            "login": {
                remote: $.format("'{0}' is already taken.")
            }
        }
    });
});

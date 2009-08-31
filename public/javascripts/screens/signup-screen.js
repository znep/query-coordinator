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

    $.validator.addMethod("loginRegex", function(value, element) {
        return this.optional(element) || /^[a-z0-9\-]+$/i.test(value);
    }, "Username must contain only letters, numbers, or dashes.");

    $.validator.addMethod("login4x4", function(value, element) {
        return this.optional(element) || !/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(value);
    }, "Username cannot be in the form nnnn-nnnn.");

    // Signup form validation.
    $("#signup #signupForm").validate({
        rules: {
            "account[firstName]": "required",
            "account[lastName]": "required",
            "account[email]": {
                required: true,
                email: true
            },
            "emailConfirm": {
                required: true,
                equalTo: "#account_email"
            },
            "account[login]": {
                required: true,
                loginRegex: true,
                login4x4: true,
                remote: {
                    url: "/users?method=loginAvailable",
                    data: {
                        login: function() { 
                            return $("#account_login").val();
                        }
                    }
                }
            },
            "account[password]": "required",
            "passwordConfirm": {
                required: true,
                equalTo: "#account_password"
            }
        },
        messages: {
            "account[login]": {
                remote: $.format("'{0}' is already taken.")
            }
        }
    });
});

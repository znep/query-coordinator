$(function ()
{
    if ($('body').is('.signup'))
    {
        $("#signup #signup_login").focus();
    }

    $.validator.addMethod("loginRegex", function(value, element) {
        return this.optional(element) || /^[a-z0-9\-]+$/i.test(value);
    }, "Username must contain only letters, numbers, or dashes.");

    $.validator.addMethod("login4x4", function(value, element) {
        return this.optional(element) || !/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(value);
    }, "Username cannot be in the form nnnn-nnnn.");

    $("#signup_submit").click(function() {
        $("#signup #signupForm").submit();
    });

    // Signup form validation.
    var $validator = $("#signup #signupForm").validate({
        rules: {
            "signup[email]": {
                required: true,
                email: true
            },
            "signup[emailConfirm]": {
                required: true,
                equalTo: "#signup_email"
            },
            "signup[login]": {
                required: true,
                loginRegex: true,
                login4x4: true,
                remote: {
                    url: "/users?method=loginAvailable",
                    data: {
                        login: function() { 
                            return $("#signup_login").val();
                        }
                    }
                }
            },
            "signup[password]": "required",
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
                remote: $.format("'{0}' is already taken.")
            }
        }
    });
});

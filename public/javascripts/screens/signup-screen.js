$(function ()
{
    if ($('body').is('.signup'))
    {
        $("#signup #signup_email").focus();
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

    $("#signup #signupForm").submit(function() {
        if ($(this).valid())
        {
            $('.actionButtons .signup_loadingIndicatorContainer').show();
        }
    });

    // Signup form validation.
    var $validator = $("#signup #signupForm").validate({
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
                minlength: 4
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

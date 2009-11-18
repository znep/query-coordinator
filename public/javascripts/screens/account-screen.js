var accountNS = blist.namespace.fetch('blist.account');

blist.account.toggleNoOpenId = function()
{
    var $table = $('div.openIdTableContainer table');
    if ($table.find('tbody tr').length <= 1)
    {
        $table.find('#no_openid_identifiers').removeClass('hidden');
        $("#accountEditSection").removeClass("has_openid").addClass("no_openid");
    }
    else
    {
        $table.find('#no_openid_identifiers').addClass('hidden');
        $("#accountEditSection").removeClass("no_openid").addClass("has_openid");
    }
};

blist.account.handleResponseErrors = function(responseData, form)
{
    if (responseData.error)
    {
        form.find('.errorMessage').text(responseData.error);
    }
    else
    {
        form.find('.errorMessage').text('');
        form.closest(".listSection").showEdit("displayShowSection");
    }
};

$(function ()
{
    var cachedWindowHeight = 0;
    $(window).resize(function()
    {
        if ($(window).height() != cachedWindowHeight)
        {
            $(".outerContent").blistStretchWindow();
            cachedWindowHeight = $(window).height();
        }
    });
    $(".outerContent").blistStretchWindow();


    $(".emailSection").showEdit({
        displayEdit: function(event, ui) {
            $(this).showEdit("clear");
        }
    });
    $(".passwordSection").showEdit({
        // IE7 doesn't hide the buttons, so hide them for it.
        displayShow: function(event, ui) {
            $(this).find('.actionButtons').css('display', 'none');
        },
        displayEdit: function(event, ui) {
            $(this).showEdit("clear");
            $(this).find('.actionButtons').css('display', '');
        }
    });
    $(".openIdSection").showEdit();

    var hash = window.location.href.match(/#/) ? window.location.href.replace(/^.*#/, '') : '';
    if (hash !== '')
    {
        var $elemToClick = $("a#" + hash);
        $elemToClick.closest(".listSection").showEdit("displayEditSection");
    }

    // Form validation.
    $.validator.setDefaults({
        submitHandler: function(form)
        {
            $form = $(form);

            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                dataType: "jsonp",
                contentType: "application/json",
                data: requestData,
                success: function(responseData)
                {
                    blist.account.handleResponseErrors(responseData, $form);
                }
            });
        }
    });

    // Email form.
    $(".emailSection form").validate({
        rules: {
            'user[email]': {
                required: true,
                email: true
            },
            'user[email_confirm]': {
                required: true,
                equalTo: "#user_email"
            },
            'user[email_password]': "required"
        },
        submitHandler: function(form)
        {
            $form = $(form);

            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                dataType: "jsonp",
                contentType: "application/json",
                data: requestData,
                success: function(responseData)
                {
                    blist.account.handleResponseErrors(responseData, $form);
                    if (!responseData.error)
                    {
                        $(".dataEmail").text(responseData.user.email);
                    }
                }
            });
        }
    });

    // Password form.
    $passwordForm = $(".passwordSection form");
    $passwordValidator = $passwordForm.validate({
        rules: {
            'user[password_new]': "required",
            'user[password_confirm]': {
                required: true,
                equalTo: "#user_password_new"
            }
        },
        submitHandler: function(form)
        {
            $form = $(form);

            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                dataType: "jsonp",
                contentType: "application/json",
                data: requestData,
                success: function(responseData)
                {
                    blist.account.handleResponseErrors(responseData, $form);
                    if (!responseData.error)
                    {
                        $("#accountEditSection").removeClass("no_password").addClass("has_password");
                    }
                }
            });
        }
    });
    $passwordForm.find("#passwordFormSave").click(function() {
        $passwordForm.submit();
    });
    $passwordForm.find("#passwordFormClear").click(function() {
        old_password = $passwordForm.find('#user_password_old').val();
        $passwordValidator.resetForm();
        $passwordForm.find('#user_password_old').val(old_password);

        $passwordForm.find(":input").not("#user_password_old").val("");
        var requestData = $.param($passwordForm.find(":input"));
        $.ajax({
            url: $passwordForm.attr("action"),
            dataType: "jsonp",
            data: requestData,
            success: function(responseData)
            {
                blist.account.handleResponseErrors(responseData, $passwordForm);
                if (!responseData.error)
                {
                    $("#accountEditSection").removeClass("has_password").addClass("no_password");
                }
            }
        });
    });

    $('.sectionEdit form input').keypress(function (e)
    {
        $(e.currentTarget).closest('form').find('.errorMessage').text('');
    });

    // OpenID form.
    $.live(".openIdSection td.edit_handle a", "click", function(event)
    {
        event.preventDefault();

        if ($('#accountEditSection').hasClass('no_password') &&
            $(this).closest('table').find('tbody tr').length <= 2)
        {
            alert("You cannot delete your last OpenID identifier without first setting a password.");
            $(".passwordSection").showEdit("displayEditSection");
        }
        else if (confirm("Are you sure you want to delete this identifier?"))
        {
            var $link = $(this);
            $.ajax({
                url: $link.attr("href"),
                type: "DELETE",
                dataType: "json",
                data: {'identifier': $(this).closest('tr').find('td.edit_identifier p').text() },
                contentType: "application/json",
                success: function(data) {
                    $("#openid_row_" + data.id).remove();
                    accountNS.toggleNoOpenId();
                }
            });
        }
    });

    accountNS.toggleNoOpenId();
});

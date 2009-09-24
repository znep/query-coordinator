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
        form.closest(".sectionEdit").slideUp("fast");
        form.closest(".listSection")
            .find(".sectionShow").slideDown("fast");
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

    $(".sectionShow p").hover(
        function() { $(this).addClass("hover"); },
        function() { $(this).removeClass("hover"); }
    );

    $(".sectionShow p, .sectionShow a.showAction").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionShow").slideUp("fast");
        $(this).closest(".listSection").find(".sectionEdit")
          .find("form :input")
            .val("")
          .end()
          .find('.error').remove().end()
          .slideDown("fast");
        var $form = $(this).closest(".listSection").find(".sectionEdit form");
        if ($form.length > 0)
        {
            $form.validate().resetForm();
            $form.find('.errorMessage').empty();
        }
    });

    $(".formListBoxClose a").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionEdit").slideUp("fast");
        $(this).closest(".listSection").find(".sectionShow").slideDown("fast");
    });

    if (window.location.hash)
    {
        var $elemToClick = $("a" + window.location.hash);
        $elemToClick.closest(".sectionShow").slideUp("fast");
        $elemToClick.closest(".listSection").find(".sectionEdit").slideDown("fast");
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
    $passwordForm.validate({
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
        rules1 = $passwordForm.find('#user_password_new').rules('remove');
        rules2 = $passwordForm.find('#user_password_confirm').rules('remove');

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

        $passwordForm.find('#user_password_new').rules('add', rules1);
        $passwordForm.find('#user_password_confirm').rules('add', rules2);
    });

    $('.sectionEdit form input').keypress(function (e)
    {
        $(e.currentTarget).closest('form').find('.errorMessage').text('');
    });

    // OpenID form.
    $(".openIdSection td.edit_handle a").live("click", function(event)
    {
        event.preventDefault();
        if (confirm("Are you sure you want to delete this identifier?"))
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

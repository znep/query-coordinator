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
          .slideDown("fast");
        $(this).closest(".listSection").find(".sectionEdit form").validate().resetForm();
    });

    $(".formListBoxClose a").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionEdit").slideUp("fast");
        $(this).closest(".listSection").find(".sectionShow").slideDown("fast");
    });

    // Form validation.
    $.validator.setDefaults({
        submitHandler: function(form)
        {
            $form = $(form);

            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                dataType: "jsonp",
                data: requestData,
                success: function(responseData)
                {
                    if (responseData.error)
                    {
                        $form.find('.errorMessage').text(responseData.error);
                    }
                    else
                    {
                        $(".dataEmail").text(responseData.user.email);

                        $form.find('.errorMessage').text('');
                        $form.closest(".sectionEdit").slideUp("fast");
                        $form.closest(".listSection")
                            .find(".sectionShow").slideDown("fast");
                    }
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
        }
    });
    // Password form.
    $(".passwordSection form").validate({
        rules: {
            'user[password_old]': "required",
            'user[password_new]': "required",
            'user[password_confirm]': {
                required: true,
                equalTo: "#user_password_new"
            }
        }
    });

    $('.sectionEdit form input').keypress(function (e)
    {
        $(e.currentTarget).closest('form').find('.errorMessage').text('');
    });

});

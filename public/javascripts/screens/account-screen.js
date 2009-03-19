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
        $(this).closest(".listSection").find(".sectionEdit").slideDown("fast");
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
            requestData += "&" + form_authenticity_token + "=" + encodeURIComponent(request_forgery_protection_token);
            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                dataType: "json",
                data: requestData,
                success: function(responseData, textStatus) {
                    $(".dataEmail").text(responseData.data.email);
                    
                    $form.closest(".sectionEdit").slideUp("fast");
                    $form.closest(".listSection").find(".sectionShow").slideDown("fast");
                }
            });
        }
    });
    
    // Email form.
    $(".emailSection form").validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            email_confirm: {
                required: true,
                equalTo: "#email"
            },
            email_password: "required",
        }
    });
    // Password form.
    $(".passwordSection form").validate({
        rules: {
            password_old: "required",
            password_new: "required",
            password_confirm: {
                required: true,
                equalTo: "#password_new"
            }
        }
    });
    
});

var profileNS = blist.namespace.fetch('blist.profile');

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    var cachedWindowHeight = 0;
    $(window).resize(function()
    {
        if ($(window).height() != cachedWindowHeight)
        {
            $(".infoContent").blistStretchWindow();
            cachedWindowHeight = $(window).height();
        }
    });
    $(".infoContent").blistStretchWindow();
    
    $(".showListBoxLink").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionShow").slideUp("fast");
        $(this).closest(".sectionContainer").find(".sectionEdit").slideDown("fast");
    });

    $(".formListBoxClose a").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionEdit").slideUp("fast");
        $(this).closest(".sectionContainer").find(".sectionShow").slideDown("fast");
    });
    
    // Form validation.
    $.validator.setDefaults({
        submitHandler: function(form)
        {
            $form = $(form);
            
            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                dataType: "json",
                data: requestData,
                success: function(user, textStatus) {
                    // TODO: this should use user.displayName.
                    $(".userName h1").text(user.firstName + " " + user.lastName);
                    $(".userLocation h5").text(user.displayLocation);
                    // TODO: add user title.
                    // TODO: add user tags.
                    
                    $form.closest(".sectionEdit").slideUp("fast");
                    $form.closest(".sectionContainer").find(".sectionShow").slideDown("fast");
                }
            });
        }
    });
    
    // Profile form.
    $(".profileContent form").validate({
        rules: {
            first_name: "required",
            last_name: "required",
            login: "required"
        }
    });
    
    $("#country").change(function()
    {
        $this = $(this);
        if ($this.val() != "US")
        {
            $("label[for='state'], #state").hide();
        }
        else
        {
            $("label[for='state']:not(:visible), #state:not(:visible)").show();
        }
    });
    
    $(".descriptionContent form").submit(function(event)
    {
        event.preventDefault();
        $form = $(this);
        var requestData = $.param($form.find(":input"));
        $.ajax({
            url: $form.attr("action"),
            type: "PUT",
            dataType: "json",
            data: requestData,
            success: function(responseData, textStatus) {
                // TODO: add description.
                
                $form.closest(".sectionEdit").slideUp("fast");
                $form.closest(".sectionContainer").find(".sectionShow").slideDown("fast");
            }
        });
    });
    
    $('#profile .publicBlists table.gridList').blistListHoverItems();
});

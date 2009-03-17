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

    $(".sectionClose a").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionEdit").slideUp("fast");
        $(this).closest(".listSection").find(".sectionShow").slideDown("fast");
    });
    
    $(".sectionEdit form").submit(function(event)
    {
        $this = $(this);
        event.preventDefault();
        
        var requestData = $.param($this.find(":input"));
        requestData += "&" + form_authenticity_token + "=" + encodeURIComponent(request_forgery_protection_token);
        $.ajax({
            url: window.location.path,
            type: "PUT",
            dataType: "json",
            data: requestData,
            success: function(responseData, textStatus) {
                $(".dataEmail").text(responseData.data.email);
                
                $this.closest(".sectionEdit").slideUp("fast");
                $this.closest(".listSection").find(".sectionShow").slideDown("fast");
            }
        });
    });
});
$(function ()
{
    var cachedWindowHeight = 0;
    $(window).resize(function()
    {
        if ($(window).height() != cachedWindowHeight)
        {
            $(".communityContainer").blistStretchWindow();
            cachedWindowHeight = $(window).height();
        }
    });
    $(".communityContainer").blistStretchWindow();
});
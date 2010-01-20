$(function ()
{
    var cachedWindowHeight = 0;
    $(window).resize(function()
    {
        if ($(window).height() != cachedWindowHeight)
        {
            $(".outerContent .content").blistStretchWindow();
            cachedWindowHeight = $(window).height();
        }
    });
    $(".outerContent .content").blistStretchWindow();
});

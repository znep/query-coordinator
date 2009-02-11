var commonNS = blist.namespace.fetch('blist.common');

// Default function to do generic resizing to fill the screen
//  If you need more detailed behavior, remove .scrollContent and
//  implement a separate resize for your screen
var cachedWinHeight = 0;
blist.common.adjustSize = function ()
{
    // Test to see if the cached window height matches the current window height.
    // We need to cache this because IE8 will throw itself into an infinite loop if we don't.
    if ($(window).height() != cachedWinHeight) 
    {
    $('.scrollContent').each(function ()
    {
        blist.util.sizing.fitWindow($(this));
    });
        cachedWinHeight = $(window).height();
    }
}

$(function ()
{
    $(window).resize(function () 
    {
        commonNS.adjustSize();
    });
    commonNS.adjustSize();
});

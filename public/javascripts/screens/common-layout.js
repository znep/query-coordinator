var commonNS = blist.namespace.fetch('blist.common');

// Default function to do generic resizing to fill the screen
//  If you need more detailed behavior, remove .scrollContent and
//  implement a separate resize for your screen
blist.common.adjustSize = function ()
{
    $('.scrollContent').each(function ()
    {
        blist.util.sizing.fitWindow($(this));
    });
}

$(window).resize(commonNS.adjustSize);

$(function ()
{
    commonNS.adjustSize();
});

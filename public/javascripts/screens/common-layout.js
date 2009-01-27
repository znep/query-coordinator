var commonNS = blist.namespace.fetch('blist.common');

// Default function to do generic resizing to fill the screen
//  If you need more detailed behavior, remove .mainScrollContent and
//  implement a separate resize for your screen
blist.common.adjustSize = function ()
{
    var $scrollContent = $('.mainScrollContent');
    if ($scrollContent.length == 1)
    {
        blist.util.sizing.fitWindow($scrollContent);
    }
}

$(window).resize(commonNS.adjustSize);

$(function ()
{
    commonNS.adjustSize();
});

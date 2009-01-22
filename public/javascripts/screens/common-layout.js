// Create blist namespace if DNE
if (!blist)
{
    var blist = {};
}
// Create file namespace if DNE
if (!blist.common)
{
    blist.common = {};
}

// Default function to do generic resizing to fill the screen
//  If you need more detailed behavior, remove .mainScrollContent and
//  implement a separate resize for your screen
blist.common.adjustSize = function ()
{
    var $scrollContent = $('.mainScrollContent');
    if ($scrollContent.length == 1)
    {
        // First size content to full window height
        $scrollContent.height($(window).height());
        // Then clip it by how much the document overflows the window
        $scrollContent.height(Math.max(0,
                    $scrollContent.height() -
                    ($(document).height() - $(window).height())));
    }
}

$(window).resize(blist.common.adjustSize);

$(function ()
{
    blist.common.adjustSize();
});

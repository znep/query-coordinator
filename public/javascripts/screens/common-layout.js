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

blist.common.adjustSize = function ()
{
    // First size content to full window height
    $('.mainScrollContent').height($(window).height());
    // Then clip it by how much the document overflows the window
    $('.mainScrollContent').height(Math.max(0,
        $('.mainScrollContent').height() -
            ($(document).height() - $(window).height())));
}

$(window).resize(blist.common.adjustSize);

$(function ()
{
    blist.common.adjustSize();
});

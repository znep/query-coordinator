blist.namespace.fetch('blist.util.sizing');

blist.util.sizing.fitWindow = function ($elem)
{
    // First size content to full window height
    $elem.height($(window).height());
    // Then clip it by how much the document overflows the window
    $elem.height(Math.max(0,
                $elem.height() - ($(document).height() - $(window).height())));
}

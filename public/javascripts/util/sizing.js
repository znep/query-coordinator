blist.namespace.fetch('blist.util.sizing');

blist.util.sizing.fitWindow = function ($elem)
{
    // First size content to full document height, to make sure it is the
    //  largest thing on the page and causing the overflow
    $elem.height($(document).height());
    // Then clip it by how much the document overflows the window
    $elem.height(Math.max(0,
                $elem.height() - ($(document).height() -
                    Math.max($('body').minSize().height, $(window).height()))));
}

// Create blist namespace if DNE
if (!blist)
{
    var blist = {};
}
// Create file namespace if DNE
if (!blist.myBlists)
{
    blist.myBlists = {};
}
// Alias local namespace
var ns = blist.myBlists;

/* Functions for main blists screen */

blist.myBlists.adjustSize = function ()
{
    var $tbody = $('#blistList tbody');
    var $content = $('#blists .content');
    $content.height('auto');
    // First size to nothing to determine row height
    $tbody.height(0);
    var rowHeight = $tbody.children().height();
    // Now size content to full window height
    $tbody.height($(window).height());
    // Then clip it by how much the document overflows the window
    $tbody.height(Math.max(0,
                $tbody.height() - ($(document).height() - $(window).height())));
    // Then if it is too large, adjust it
    if ($tbody.height() > $tbody.children().length * rowHeight)
    {
        $tbody.height($tbody.children().length * rowHeight);
        // Adjust the content container to fill the missing gap
        $content.height($(window).height());
        // Then clip it by how much the document overflows the window
        $content.height(Math.max(0,
                    $content.height() -
                        ($(document).height() - $(window).height())));
    }
}

blist.myBlists.getTotalRowCount = function ()
{
    return $('#blistList tr.item').length;
}

blist.myBlists.rowClickedHandler = function (event)
{
    var $target = $(event.target);
    if ($target.is("td"))
    {
        $target.siblings().andSelf().toggleClass('selected');
        $(event.currentTarget).trigger(blist.events.ROW_SELECTION);
    }
}


/* Functions for info pane related to blists */

if (!blist.myBlists.infoPane)
{
    blist.myBlists.infoPane = {};
}
blist.myBlists.infoPane.updateSummary = function (numSelect)
{
    var itemState;
    if (numSelect === undefined || numSelect < 1)
    {
        numSelect = ns.getTotalRowCount();
        $('#infoPane .infoContent .selectPrompt').show();
        itemState = 'total';
    }
    else
    {
        $('#infoPane .infoContent .selectPrompt').hide();
        itemState = 'selected';
    }
    $('#infoPane .infoContent .itemCount').text(numSelect);
    $('#infoPane .infoContent .itemSelectedText').text('item' +
        (numSelect == 1 ? '' : 's') + ' ' + itemState);
}

blist.myBlists.infoPane.rowSelectionHandler = function (event)
{
    var $target = $(event.target);
    if ($target.is('table'))
    {
        var numSelect = $('tr:has(.selected)', $target).length;
        ns.infoPane.updateSummary(numSelect);
    }
}


/* Initial start-up calls, and setting up bindings */

$(function ()
{
    $(window).resize(ns.adjustSize);
    $('#blistList').click(ns.rowClickedHandler);
    $('#blists').bind(blist.events.ROW_SELECTION, ns.infoPane.rowSelectionHandler);

    ns.infoPane.updateSummary();
    ns.adjustSize();
});

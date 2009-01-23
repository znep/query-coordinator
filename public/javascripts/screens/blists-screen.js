var ns = blist.namespace.fetch('blist.myBlists');

/* Functions for main blists screen */

blist.myBlists.adjustSize = function ()
{
    var $tbody = $('#blistList tbody');
    var $content = $('#blists .content');
    $content.height('auto');

    // First size to nothing to determine row height
    $tbody.height(0);
    var rowHeight = $tbody.children().height();
    // Then size to fit
    blist.util.sizing.fitWindow($tbody);

    // Then if it is too large, adjust it
    if ($tbody.height() > $tbody.children().length * rowHeight)
    {
        $tbody.height($tbody.children().length * rowHeight);
        // Adjust the content container to fill the missing gap
        blist.util.sizing.fitWindow($content);
    }
}

blist.myBlists.getTotalItemCount = function ()
{
    return $('#blistList tr.item').length;
}

blist.myBlists.rowClickedHandler = function (event)
{
    var $target = $(event.target);
    if ($target.is("td"))
    {
        $target.parent().toggleClass('selected');
        $(event.currentTarget).trigger(blist.events.ROW_SELECTION);
    }
}

blist.myBlists.tableMousemoveHandler = function (event)
{
    var $target = $(event.target);
    if ($target.is('tbody') || $target.is('table'))
    {
        // If they move the mouse directly on the table or tbody,
        //  they are not in a row and we should unhighlight them
        $('tr.hover', $target).removeClass('hover');
    }
    else if ($target.is('td') && $target.parent().is('tr.item') &&
            !$target.parent().is('tr.hover'))
    {
        // If they move over a tr that is not already in a hover state,
        //  and is in an item row, highlight it
        $target.parent().addClass('hover');
    }
}

blist.myBlists.tableMouseoutHandler = function (event)
{
    var $target = $(event.target);
    if ($target.is('tbody') || $target.is('table'))
    {
        // If they mouse out of the table or tbody, unhighlight everything
        $('tr.hover', $target).removeClass('hover');
    }
    else if ($target.is('td'))
    {
        // If they moused out of a cell, unhighlight that row
        $target.parent().removeClass('hover');
    }
}



/* Functions for info pane related to blists */

var infoNS = blist.namespace.fetch('blist.myBlists.infoPane');
blist.myBlists.infoPane.updateSummary = function (numSelect)
{
    var itemState;
    if (numSelect === undefined || numSelect < 1)
    {
        numSelect = ns.getTotalItemCount();
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
        var numSelect = $('tr.selected', $target).length;
        infoNS.updateSummary(numSelect);
    }
}


/* Initial start-up calls, and setting up bindings */

$(function ()
{
    $(window).resize(ns.adjustSize);
    $('#blistList').click(ns.rowClickedHandler);
    $('#blistList').mousemove(ns.tableMousemoveHandler);
    $('#blistList').mouseout(ns.tableMouseoutHandler);

    $('#blists').bind(blist.events.ROW_SELECTION, infoNS.rowSelectionHandler);

    infoNS.updateSummary();
    ns.adjustSize();
});

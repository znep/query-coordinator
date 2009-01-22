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

$(function ()
{
    ns.infoPane.updateSummary();
    $('#blistList').click(ns.rowClickedHandler);
    $('#blists').bind(blist.events.ROW_SELECTION, ns.infoPane.rowSelectionHandler);
});

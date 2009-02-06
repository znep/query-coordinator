var myBlistsNS = blist.namespace.fetch('blist.myBlists');

$.tablesorter.addWidget({
    id: "sortGrouping",
    format: function (table)
    {
        /* This function will get the group that this cell should be sorted
         *  into. For example, for text, that is the first letter of the string;
         *  for dates, that may be something like 'Today' or 'Yesterday'; or
         *  'Last week' or 'Last month'.
         */
        function getSortGroup($cell, parser)
        {
            // Get the value that is used to sort this cell
            var curVal = parser.format($cell.text(), table, $cell[0]);
            var sortVal = curVal;

            // Favorites are sorted as text, but the headers should be special
            if ($cell.hasClass('favorite'))
            {
                sortVal = curVal == '*' ? 'Favorites' : 'Unmarked';
            }
            // Type is special in a similar manner to favorites
            else if ($cell.hasClass('type'))
            {
                sortVal = curVal + 's';
            }
            // Otherwise for text, sort by the first letter
            else if (parser.type == 'text')
            {
                sortVal = curVal.slice(0, 1).toLowerCase();
            }
            // Try catch dates by looking at the parser ID
            else if (parser.id.match(/date/i))
            {
                // If date is 0, assume it is blank
                if (curVal === 0)
                {
                    sortVal = '';
                }
                else
                {
                    sortVal = blist.util.humaneDate.getFromDate(new Date(curVal));
                }
            }

            if (sortVal === '')
            {
                sortVal = 'none';
            }
            return sortVal;
        };


        // Get the column that is sorted on.  sortList is internal to tablesorter;
        //  the first element is the primary sort (it supports sorting on
        //  multiple columns); the first element of sortList[0] is the column
        //  number (the other element is asc/desc)
        var curCol = table.config.sortList[0][0];

        // Clear existing headers
        $("tr.sortGroup", table).remove();

        var groupValue = '';
        for (var i = 0; i < table.tBodies[0].rows.length; i++)
        {
            var $curRow = $(table.tBodies[0].rows[i]);
            if ($curRow.hasClass('child'))
            {
                continue;
            }

            var $curCell = $($curRow[0].cells[curCol]);
            var sortVal = getSortGroup($curCell, table.config.parsers[curCol]);
            if (groupValue != sortVal)
            {
                groupValue = sortVal;
                var $newRow = $("<tr class='sortGroup'/>");
                for (var j = 0; j < table.config.headerNode[0].rows[0].cells.length;
                    j++)
                {
                    var $refCell = $(table.config.headerNode[0].rows[0].cells[j]);
                    var $newCell = $("<td class='" + $refCell.attr('class') +
                        "'/>").removeClass('header');
                    $newRow.append($newCell);
                }
                $newRow.find("td:first-child").append(
                    "<div>" + groupValue + "</div>");
                $curRow.before($newRow);
            }
        }
    }
});

/* Functions for main blists screen */

blist.myBlists.setupTable = function ()
{
    $('#blistList').clone()
        .removeAttr('id').find('tbody').remove().end()
        .appendTo('.headerContainer').end()
        .find('thead').remove();
    $.fn.treeTable.defaults.indent = 0;
    $.fn.treeTable.defaults.treeColumn = 3;
    $('#blistList').treeTable();
    $('#blistList').bind('sortEnd', myBlistsNS.sortFinishedHandler);
    $('#blistList').tablesorter(
        {
         // Pass in a different header for doing the sorting
         headerNode: $('.headerContainer table.selectableList thead'),
         // First column is not sortable
         headers: { 0: {sorter: false} },
         // Don't use simple extraction
         textExtraction: "complex",
         // Initially sort by last updated
         sortList: [[6, 1]],
         widgets: ['sortGrouping']
        });
}

/* When sorting is finished, we need to move all child rows back under
 * their parent.  Grab them in order (since they are sorted appropriately
 * relative to each other), reverse them, then insert each one right after
 * its parent.
 */
blist.myBlists.sortFinishedHandler = function (event)
{
    $('#blistList tr.child').reverse().each(function ()
    {
        var classMatch = $(this).attr('class').match(/child-of-(\S+)/);
        if (classMatch && classMatch.length > 1)
        {
            var $parRow = $('#' + classMatch[1]);
            if ($parRow.length == 1)
            {
                $parRow.after(this);
            }
        }
    });
}

blist.myBlists.resizeTable = function ()
{
    $('#blists table.selectableList tbody td > *').each( function ()
            { blist.widget.clippedText.clipElement($(this)) });
}

blist.myBlists.getTotalItemCount = function ()
{
    return $('#blistList tr.item').length;
}

blist.myBlists.getSelectedItems = function ()
{
    return $('#blistList tr.item.selected');
}

blist.myBlists.getTableParent = function ($item)
{
    while ($item && !$item.is('table') &&
        !$item.is('tbody') && !$item.is('thead') &&
        !$item.is('td') && !$item.is('th'))
    {
        $item = $item.parent();
    }
    return $item;
}

blist.myBlists.rowClickedHandler = function (event)
{
    // If they clicked on the expand/collaspe arrow, don't select the row
    var $target = $(event.target);
    if ($target.hasClass('expander'))
    {
        return;
    }

    $target = myBlistsNS.getTableParent($target);
    if ($target.is("td"))
    {
        $target.parent().toggleClass('selected');
        $(event.currentTarget).trigger(blist.events.ROW_SELECTION);
    }
}

blist.myBlists.tableMousemoveHandler = function (event)
{
    var $target = myBlistsNS.getTableParent($(event.target));
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
    var $target = myBlistsNS.getTableParent($(event.target));
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

blist.myBlists.updateList = function (newTable)
{
    $('#blistList tbody').replaceWith($(newTable).find('tbody'));
    myBlistsNS.resizeTable();
    $('#blistList').treeTable();
    $('#blistList').trigger('update');
    // Resort new list on Last Upated
    $('#blistList').trigger('sorton', [[[6, 1]]]);
}


/* Functions for info pane related to blists */

var blistsInfoNS = blist.namespace.fetch('blist.myBlists.infoPane');
blist.myBlists.infoPane.updateSummary = function (numSelect)
{
    if (numSelect == 1)
    {
        var $items = myBlistsNS.getSelectedItems();
        $.Tache.Get({ url: '/blists/detail',
                data: { 'id': $items.attr('blist_id') },
                success: function (data)
                {
                    $('#singleSelectInfo').html(data);
                } });
        $('#singleSelectInfo').show();
        $('#multiSelectInfo').hide();
    }
    else
    {
        $('#multiSelectInfo').show();
        $('#singleSelectInfo').hide();

        var itemState;
        if (numSelect === undefined || numSelect < 1)
        {
            numSelect = myBlistsNS.getTotalItemCount();
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
}

blist.myBlists.infoPane.rowSelectionHandler = function (event)
{
    var $target = $(event.target);
    if ($target.is('table'))
    {
        // tr.item.selected is a bit specific, but tr.selected doesn't work
        //  in jQuery 1.3.1 in Safari
        //  (either this: http://dev.jquery.com/ticket/3977
        //  or this: http://dev.jquery.com/ticket/3938)
        var numSelect = $('tr.item.selected', $target).length;
        blistsInfoNS.updateSummary(numSelect);
    }
}



/* Functions for sidebar related to blists */

var blistsBarNS = blist.namespace.fetch('blist.myBlists.sidebar');

blist.myBlists.sidebar.initializeHandlers = function ()
{
    $('#blistFilters a').click(blistsBarNS.filterClickHandler);
    $('#blistFilters h4').click(blistsBarNS.toggleSection);
}

blist.myBlists.sidebar.filterClickHandler = function (event)
{
    event.preventDefault();
    var $target = $(event.target);
    $.Tache.Get({ url: $target.attr('href'),
            success: myBlistsNS.updateList });
}

blist.myBlists.sidebar.toggleSection = function (event)
{
    $(event.target).parent('.expandableSection').toggleClass('closed');
}



/* Initial start-up calls, and setting up bindings */

$(function ()
{
    myBlistsNS.setupTable();
    blistsBarNS.initializeHandlers();

    $(window).resize(myBlistsNS.resizeTable);
    $('#blistList').click(myBlistsNS.rowClickedHandler);
    $('#blistList').mousemove(myBlistsNS.tableMousemoveHandler);
    $('#blistList').mouseout(myBlistsNS.tableMouseoutHandler);

    $('#blists').bind(blist.events.ROW_SELECTION, blistsInfoNS.rowSelectionHandler);

    blistsInfoNS.updateSummary();
    // Readjust size after updating info pane
    blist.common.adjustSize();
    myBlistsNS.resizeTable();
});

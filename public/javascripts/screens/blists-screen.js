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

            // For favorites we leave off the headers since there are only two
            //  values, and they are obvious visually
            if ($cell.hasClass('favorite'))
            {
                return '';
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


        // If we have no table or sorting, bail early
        if (!table || !table.config || !table.config.sortList ||
            table.config.sortList.length < 1 ||
            table.config.sortList[0].length < 1)
        {
            return;
        }

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
                var colSpan = table.config.headerNode[0].rows[0].cells.length;

                var $newCell = $("<td colspan='" + colSpan + "'/>");
                $newRow.append($newCell);

                $newRow.find("td:first-child").append(
                    "<div>" + groupValue + "</div>");

                $curRow.before($newRow);
            }
        }
    }
});

/* Functions for main blists screen */

blist.myBlists.listSelectionHandler = function (event, title)
{
    $('#blistList tbody').hide();
    $('#listTitle').text(title);
}

blist.myBlists.setupTable = function ()
{
    $('#blistList').clone()
        .removeAttr('id').find('tbody').remove().end()
        .appendTo('.headerContainer').end().end()
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
         widgets: ['sortGrouping']
        });

    // If there are rows, sort initially on Last Updated
    if ($('#blistList tbody tr').length > 0)
    {
        $('#blistList').trigger('sorton', [[[6, 1]]]);
    }
    else
    {
        myBlistsNS.displayNoResults();
    }
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
    $('#blistList tbody').show();
}

blist.myBlists.resizeTable = function ()
{
    $('#blists table.selectableList tbody td.clipText > *').each( function ()
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
    if ($target.hasClass('expander') || $target.is('a'))
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
    blistsInfoNS.updateSummary(0);
    myBlistsNS.resizeTable();
    if ($('#blistList tbody tr').length > 0)
    {
        $('#blistList').treeTable();
        $('#blistList').trigger('update');
        // Resort new list on Last Upated
        $('#blistList').trigger('sorton', [[[6, 1]]]);
    }
    else
    {
        myBlistsNS.displayNoResults();
    }
}

blist.myBlists.displayNoResults = function ()
{
    var colSpan = $(".headerContainer table tr th").length;
    var $newRow = $("<tr class='sortGroup'><td colspan='" + colSpan + "'>" +
            "<div>No Results</div></td></tr>");
    $('#blistList tbody').append($newRow);
}

/* Functions for info pane related to blists */

var blistsInfoNS = blist.namespace.fetch('blist.myBlists.infoPane');
blist.myBlists.infoPane.updateSummary = function (numSelect)
{
    if (numSelect == 1)
    {
        var $items = myBlistsNS.getSelectedItems();
        $.Tache.Get({ url: '/blists/detail/' + $items.attr('blist_id'),
            success: blistsInfoNS.updateSummarySuccessHandler
        });
    }
    else
    {
        if (numSelect === undefined || numSelect < 1)
        {
            numSelect = myBlistsNS.getTotalItemCount();
            $('#infoPane .infoContent .selectPrompt').show();
            itemState = 'total';

            $.Tache.Get({ url: '/blists/detail',
                data: 'items=' + numSelect,
                success: blistsInfoNS.updateSummarySuccessHandler
            });

        }
        else
        {
            var $items = myBlistsNS.getSelectedItems();
            var arrMulti = $items.map(function (i, n)
            {
               return $(n).attr('blist_id');
            });
            var multi = $.makeArray(arrMulti).join(';');

            $.Tache.Get({ url: '/blists/detail',
                data: 'multi=' + multi,
                success: blistsInfoNS.updateSummarySuccessHandler
            });
        }
    }
}

blist.myBlists.infoPane.updateSummarySuccessHandler = function (data)
{
    // Load the info pane.
    $('#infoPane').html(data);

    // Wire up the hover behavior.
    $(".infoContent dl.summaryList").infoPaneItemHighlight();

    // Wire up the tab switcher/expander.
    $(".summaryTabs li").infoPaneTabSwitch();

    // Wire up a click handler for deselectors.
    $(".action.unselector").click(function (event)
    {
        event.preventDefault();
        var blist_id = $(this).attr("href").replace("#", "");
        $("#blistList tr[blist_id=" + blist_id + "] td.type").trigger("click");
    });

    // Wire up a click handler for all tab links.
    $(".tabLink").click(blistsInfoNS.tabLinkHandler);

    // Force a window resize.
    blist.util.sizing.cachedInfoPaneHeight = $("#infoPane").height();
    blist.common.forceWindowResize();
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

blist.myBlists.infoPane.tabLinkHandler = function (event)
{
    event.preventDefault();
    var $target = $(event.currentTarget);

    // Pull the tab id off of the link's href
    var tab_selector = $target.attr("href");

    // Find the a inside the tab id that's not an expander
    $(tab_selector).find("a:not(.expander)").trigger("click");
}



/* Functions for sidebar related to blists */

var blistsBarNS = blist.namespace.fetch('blist.myBlists.sidebar');

blist.myBlists.sidebar.initializeHandlers = function ()
{
    $('#blistFilters a:not(.expander, ul.menu a)')
        .click(blistsBarNS.filterClickHandler)
        .each(function ()
        {
            $(this).siblings('ul.menu').dropdownMenu({triggerButton: $(this),
                pullToTop: true,
                linkCallback: blistsBarNS.filterMenuClickHandler,
                openTest: function (event, $menu)
                {
                    return $(event.target).is('em');
                }});
        });
    $('#blistFilters a.expander').click(blistsBarNS.toggleSection);
}

blist.myBlists.sidebar.filterClickHandler = function (event)
{
    event.preventDefault();
    var $target = $(event.currentTarget);
    if ($(event.target).is('em'))
    {
        $target.siblings('ul.menu').css('left',
            $(event.target).position().left + 'px');
        return;
    }

    $target.trigger(blist.events.LIST_SELECTION, [$target.attr('title')]);
    $.Tache.Get({ url: $target.attr('href'),
            success: myBlistsNS.updateList });
}

blist.myBlists.sidebar.toggleSection = function (event)
{
    event.preventDefault();
    $(event.target).parent(".expandableContainer").toggleClass('closed');
}

blist.myBlists.sidebar.filterMenuClickHandler = function (event, $menu,
    $triggerButton)
{
    event.preventDefault();
    var $target = $(event.currentTarget);
    $triggerButton.attr('href', $target.attr('href'))
        .attr('title', $target.attr('title'))
        .find('em').text($target.text());
}



/* Initial start-up calls, and setting up bindings */

$(function ()
{
    myBlistsNS.setupTable();
    blistsBarNS.initializeHandlers();

    $(window).resize(myBlistsNS.resizeTable);
    $('#blistList').click(myBlistsNS.rowClickedHandler);
    $('.selectableList').live("mousemove", myBlistsNS.tableMousemoveHandler);
    $('.selectableList').live("mouseout", myBlistsNS.tableMouseoutHandler);

    $('#blists').bind(blist.events.ROW_SELECTION, blistsInfoNS.rowSelectionHandler);
    $('#outerContainer').bind(blist.events.LIST_SELECTION,
        myBlistsNS.listSelectionHandler);
    
    $(".expandContainer").blistPanelExpander({
        expandCompleteCallback: blistsInfoNS.updateSummary
    });

    blistsInfoNS.updateSummary();

    // Readjust size after updating info pane
    myBlistsNS.resizeTable();
});


// Author: jeff.scherpelz@blist.com

// Protect $.
(function($)
{
    $.fn.combinationList = function(options)
    {
        // Check if combo list object was already created
        var comboList = $(this[0]).data("combinationList");
        if (!comboList)
        {
            comboList = new $.combinationListObject(options, this[0]);
        }
        return comboList;
    };

    $.combinationListObject = function(options, list)
    {
        this.settings = $.extend({}, $.combinationListObject.defaults, options);
        this.currentList = list;
        this.init();
    };

    $.extend($.combinationListObject,
    {
        defaults:
        {
            clipText: false,
            headerContainerSelector: '.headerContainer',
            hoverOnly: false,
            initialSort: [],
            loadedCallback: function () {},
            scrollableBody: true,
            searchable: false,
            searchCompleteCallback: function () {},
            searchFormSelector: "form",
            selectable: true,
            selectionCallback: function ($selectedItems) {},
            sortable: true,
            sortGrouping: true,
            sortHeaders: {},
            sortTextExtraction: 'complex',
            treeTable: false,
            treeColumn: 0
        },

        prototype:
        {
            init: function ()
            {
                var comboListObj = this;
                var $comboList = $(comboListObj.currentList);
                $comboList.data("combinationList", comboListObj);

                if (comboListObj.settings.clipText)
                {
                    $(window).resize(function (event)
                    {
                        adjustClipping(comboListObj);
                    });
                }

                if (comboListObj.settings.scrollableBody)
                {
                    $comboList
                        .clone()
                            .removeAttr('id')
                            .find('tbody')
                                .remove()
                            .end()
                            .appendTo(comboListObj.settings.headerContainerSelector)
                            .end()
                        .end()
                        .find('thead')
                            .remove();
                }

                if (comboListObj.settings.selectable)
                {
                    $comboList.blistSelectableList(
                    {
                        rowSelectionHandler: function ($targetRow)
                        {
                            comboListObj.settings.selectionCallback($targetRow,
                                comboListObj.selectedItems());
                        }
                    });
                }
                else if (comboListObj.settings.hoverOnly)
                {
                    $comboList.blistListHoverItems();
                }

                if (comboListObj.settings.treeTable)
                {
                    $comboList.treeTable({indent: 0,
                        treeColumn: comboListObj.settings.treeColumn});
                }

                if (comboListObj.settings.sortable)
                {
                    $comboList.bind('sortEnd', function (event)
                    {
                        sortFinishedHandler(comboListObj, event);
                    });
                    var sorterSettings =
                    {
                        // First column is not sortable
                        headers: comboListObj.settings.sortHeaders,
                        // Don't use simple extraction
                        textExtraction: comboListObj.settings.sortTextExtraction,
                        widgets: []
                    };

                    // mark sortable columns as sortable
                    var suppressSort = {};
                    if (comboListObj.settings.sortHeaders)
                    {
                        _.each(comboListObj.settings.sortHeaders, function(value, index)
                        {
                            suppressSort[index] = (value.sorter === false);
                        });
                    }
                    $comboList.find('thead th').each(function(idx)
                    {
                        if (!suppressSort[idx])
                        {
                            $(this).addClass('sortable');
                        }
                    });

                    if (comboListObj.settings.scrollableBody)
                    {
                        // Pass in a different header for doing the sorting
                        sorterSettings['headerNode'] =
                            $(comboListObj.settings.headerContainerSelector)
                                .find('table.selectableList thead');
                    }
                    if (comboListObj.settings.sortGrouping)
                    {
                        sorterSettings['widgets'].push('sortGrouping');
                    }
                    // If there is an initial sort, set the default sort
                    //  direction opposite
                    if (comboListObj.settings.initialSort.length > 0)
                    {
                        sorterSettings['sortInitialOrder'] =
                            comboListObj.settings.initialSort[0][1] == 1 ?
                            "asc" : "desc";
                    }
                    $comboList.tablesorter(sorterSettings);
                    setupSortHeaders(comboListObj);
                }

                if (comboListObj.settings.searchable)
                {
                    $comboList.searchable(
                    {
                        searchFormSelector:
                            comboListObj.settings.searchFormSelector,
                        searchCompleteCallback: function()
                        {
                            comboListObj.settings.searchCompleteCallback();
                            $comboList.trigger("applyWidgetId", "sortGrouping");
                            adjustClipping(comboListObj);
                            if (comboListObj.settings.treeTable)
                            {
                                $comboList.find('tr.item.parent.filteredOut')
                                    .each(function ()
                                    {
                                        $(this).treeTable_disownChildren();
                                    });
                                $comboList.find('tr.item.parent:not(.filteredOut)')
                                    .each(function ()
                                    {
                                        $(this).treeTable_reparentChildren();
                                    });
                            }
                        }
                    });
                }

                // If there aren't any rows, return no results.
                // NOTE: This is where we would do the initial sort if we were going to do so.
                if ($comboList.find('tbody tr').length < 1)
                {
                    comboListObj.displayNoResults();
                }

                comboListObj.settings.loadedCallback();
            },

            updateList: function (newTable)
            {
                var comboListObj = this;
                var $comboList = $(comboListObj.currentList);

                $comboList.find('tbody').html(newTable);
                if (comboListObj.settings.sortable)
                {
                    $(comboListObj.settings.headerContainerSelector)
                        .find("table tr th")
                        .removeClass('headerSortUp')
                        .removeClass('headerSortDown');
                    setupSortHeaders(comboListObj);
                }

                comboListObj.settings.loadedCallback();
                adjustClipping(comboListObj);
                if ($comboList.find('tbody tr').length > 0)
                {
                    if (comboListObj.settings.treeTable)
                    {
                        $comboList.treeTable({indent: 0,
                                treeColumn: comboListObj.settings.treeColumn});
                    }

                    $comboList.trigger('update');
                }
                else
                {
                    comboListObj.displayNoResults();
                }
            },

            totalItemCount: function ()
            {
                return $(this.currentList).find('tr.item:not(.filteredOut)').length;
            },

            selectedItems: function ()
            {
                return $(this.currentList).find('tr.item.selected');
            },

            displayNoResults: function ()
            {
                var comboListObj = this;
                var colSpan = $(comboListObj.settings.headerContainerSelector)
                    .find("table tr th").length;
                var $newRow = $("<tr class='sortGroup'><td colspan='" +
                    colSpan + "'>" + "<div>" + $.t('controls.common.no_results') +
                    "</div></td></tr>");
                $(comboListObj.currentList).find('tbody').append($newRow);
            }
        }
    });

    /* When sorting is finished, we need to move all child rows back under
     * their parent.  Grab them in order (since they are sorted appropriately
     * relative to each other), reverse them, then insert each one right after
     * its parent.  */
    var sortFinishedHandler = function (comboListObj, event)
    {
        var $comboList = $(comboListObj.currentList);
        if (comboListObj.settings.treeTable)
        {
            $comboList.find('tr.child').reverse().each(function ()
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
    };

    var adjustClipping = function (comboListObj)
    {
        if (comboListObj.settings.clipText)
        {
            $(comboListObj.currentList).find('tbody .clipText > *')
                .each(function ()
                {
                    blist.widget.clippedText.clipElement($(this));
                });
        }
    };

    var setupSortHeaders = function (comboListObj)
    {
        $.each(comboListObj.settings.initialSort, function (i, s)
        {
            $(comboListObj.settings.headerContainerSelector)
                .find("table tr th:nth(" + s[0] + ")")
                .addClass(s[1] == 1 ?
                    'headerSortUp' : 'headerSortDown');
        });
    };

    $.tablesorter.addWidget(
    {
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
                        sortVal = blist.util.humaneDate.getFromDate
                            (new Date(curVal), blist.util.humaneDate.DAY);
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

            // Get the column that is sorted on.  sortList is internal to
            // tablesorter; the first element is the primary sort (it supports
            // sorting on multiple columns); the first element of sortList[0]
            // is the column number (the other element is asc/desc)
            var curCol = table.config.sortList[0][0];

            // Clear existing headers
            $("tr.sortGroup", table).remove();

            var groupValue = '';
            for (var i = 0; i < table.tBodies[0].rows.length; i++)
            {
                var $curRow = $(table.tBodies[0].rows[i]);
                if ($curRow.hasClass('child') || $curRow.is(":hidden"))
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

})(jQuery);

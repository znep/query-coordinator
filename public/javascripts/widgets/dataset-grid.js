(function($)
{
    $.fn.datasetGrid = function(options)
    {
        // Check if object was already created
        var datasetGrid = $(this[0]).data("datasetGrid");
        if (!datasetGrid)
        {
            datasetGrid = new $.datasetGridObject(options, this[0]);
        }
        return datasetGrid;
    };

    $.datasetGridObject = function(options, grid)
    {
        this.settings = $.extend({}, $.datasetGridObject.defaults, options);
        this.currentGrid = grid;
        this.init();
    };

    $.extend($.datasetGridObject,
    {
        defaults:
        {
            accessType: 'DEFAULT',
            clearFilterItem: null,
            clearTempViewCallback: function () {},
            filterItem: null,
            manualResize: false,
            setTempViewCallback: function (tempView) {},
            showRowHandle: false,
            showRowNumbers: true,
            viewId: null
        },

        prototype:
        {
            init: function ()
            {
                var datasetObj = this;
                var $datasetGrid = $(datasetObj.currentGrid);
                $datasetGrid.data("datasetGrid", datasetObj);

                datasetObj.settings._filterCount = 0;

                // Hook up the JS grid:
                // * Reload column summaries when loading new rows
                // * The main JS grid: headerMods hooks up the column menus
                // * blistModel: disable minimum characters for full-text search,
                //     enable progressive loading of data, and hook up Ajax info
                $datasetGrid
                    .blistTable({generateHeights: false,
                        headerMods: function (col) { headerMods(datasetObj, col); },
                        manualResize: datasetObj.settings.manualResize,
                        showGhostColumn: true, showTitle: false,
                        showRowHandle: datasetObj.settings.showRowHandle,
                        showRowNumbers: datasetObj.settings.showRowNumbers})
                    .blistModel()
                    .options({filterMinChars: 0, progressiveLoading: true})
                    .ajax({url: '/views/' + datasetObj.settings.viewId +
                                '/rows.json', cache: false,
                            data: {accessType: datasetObj.settings.accessType},
                            dataType: 'json'});

                if (datasetObj.settings.filterItem)
                {
                    datasetObj.settings.filterItem =
                        $(datasetObj.settings.filterItem);
                    datasetObj.settings.filterItem
                        .keydown(function (e) { filterTextInput(datasetObj, e); });
                }
                if (datasetObj.settings.clearFilterItem)
                {
                    datasetObj.settings.clearFilterItem =
                        $(datasetObj.settings.clearFilterItem);
                    datasetObj.settings.clearFilterItem
                        .click(function (e) { clearFilterInput(datasetObj, e); })
                        .hide();
                }
            },

            // This keeps track of when the column summary data is stale and
            // needs to be refreshed
            summaryStale: true,

            isTempView: false
        }
    });

    var filterTextInput = function (datasetObj, e)
    {
        if ($(datasetObj.currentGrid).closest('body').length < 1)
        {
            return;
        }

        setTimeout(function ()
            {
                var searchText = $(e.currentTarget).val();
                datasetObj.summaryStale = true;
                $(datasetObj.currentGrid).blistModel().filter(searchText, 250);
                if (!searchText || searchText == '')
                {
                    datasetObj.settings.clearFilterItem.hide();
                }
                else
                {
                    datasetObj.settings.clearFilterItem.show();
                }
            }, 10);
    };

    var clearFilterInput = function(datasetObj, e)
    {
        if ($(datasetObj.currentGrid).closest('body').length < 1)
        {
            return;
        }

        e.preventDefault();
        datasetObj.settings.filterItem.val('').blur();
        datasetObj.summaryStale = true;
        $(datasetObj.currentGrid).blistModel().filter('');
        $(e.currentTarget).hide();
    };

    /* Callback when rendering the grid headers.  Set up column on-object menus */
    var headerMods = function(datasetObj, col)
    {
        // We support sort & filter, so if neither is available, don't show a menu
        if (blist.data.types[col.type].sortable ||
                blist.data.types[col.type].filterable)
        {
            var $col = $(col.dom);
            var htmlStr =
                '<a class="menuLink" href="#column-menu_' +
                col.index + '"></a>\
                <ul class="menu columnHeaderMenu" id="column-menu_' + col.index + '">';
            if (blist.data.types[col.type].sortable)
            {
                htmlStr +=
                    '<li class="sortAsc">\
                    <a href="#column-sort-asc_' + col.index + '">\
                    <span class="highlight">Sort Ascending</span>\
                    </a>\
                    </li>\
                    <li class="sortDesc">\
                    <a href="#column-sort-desc_' + col.index + '">\
                    <span class="highlight">Sort Descending</span>\
                    </a>\
                    </li>';
            }
            htmlStr +=
                '<li class="footer"><div class="outerWrapper">\
                <div class="innerWrapper"><span class="colorWrapper">\
                </span></div>\
                </div></li>\
                </ul>';
            $col.append(htmlStr);
            var $menu = $col.find('ul.columnHeaderMenu');
            hookUpHeaderMenu(datasetObj, $col, $menu);
            addFilterMenu(datasetObj, col, $menu);
        }
    };

    /* Hook up JS behavior for menu.  This is safe to be applied multiple times */
    var hookUpHeaderMenu = function(datasetObj, $colHeader, $menu)
    {
        $menu.dropdownMenu({triggerButton: $colHeader.find('a.menuLink'),
                    openCallback: function ($menu)
                        {
                            var col = $colHeader.data('column');
                            loadFilterMenu(datasetObj, col, $menu);
                        },
                    linkCallback: function (e)
                        { columnHeaderMenuHandler(datasetObj, e); },
                    forcePosition: true, pullToTop: true})
            .find('.autofilter ul.menu').scrollable();
    };

    var loadFilterMenu = function(datasetObj, col, $menu)
    {
        if (datasetObj.summaryStale || datasetObj.settings._columnSummaries == null)
        {
            datasetObj.settings._columnSummaries = {};
            datasetObj.summaryStale = false;
        }

        if (!blist.data.types[col.type].filterable) { return; }

        if (datasetObj.settings._columnSummaries[col.id] != null &&
            datasetObj.settings._columnSummaries[col.id].topFrequencies != null)
        {
            addFilterMenu(datasetObj, col, $menu);
            return;
        }

        var modView = $(datasetObj.currentGrid).blistModel().meta().view;
        if (!modView) { return; }

        // Remove the old filter menu if necessary
        $menu.children('.autofilter').prev('.separator').andSelf().remove();

        var spinnerStr = '<li class="autofilter loading"></li>';
        // Find the correct spot to add it; either after sort descending, or the top
        var $sortItem = $menu.find('li.sortDesc');
        if ($sortItem.length > 0)
        {
            $sortItem.after(spinnerStr);
        }
        else
        {
            $menu.prepend(spinnerStr);
        }

        // Set up the current view to send to the server to get the appropriate
        //  summary data back
        var tempView = $.extend({}, modView,
                {originalViewId: modView.id, columns: null});
        $.ajax({url: '/views/INLINE/rows.json?method=getSummary&columnId=' + col.id,
                dataType: 'json',
                cache: false,
                type: 'POST',
                contentType: 'application/json',
                data: $.json.serialize(tempView),
                success: function (data)
                {
                    // On success, hash the summaries by column ID (they come
                    //  in an array)
                    $.each(data.columnSummaries, function (i, s)
                    {
                        datasetObj.settings._columnSummaries[s.columnId] = s;
                    });
                    // Then update the column header menu
                    addFilterMenu(datasetObj, col, $menu);
                }
        });
    };

    /* Add auto-filter sub-menu for a particular column that we get from the JS
     * grid */
    var addFilterMenu = function(datasetObj, col, $menu)
    {
        // Remove spinner
        $menu.children('.autofilter.loading').remove();

        // Make sure this column is filterable, and we have data for it
        if (datasetObj.settings._columnSummaries == null ||
                !blist.data.types[col.type].filterable)
        {
            return;
        }
        var colSum = datasetObj.settings._columnSummaries[col.id];
        if (colSum == null)
        {
            return;
        }

        // Get the current filter for this column (if it exists)
        var colFilters = $(datasetObj.currentGrid).blistModel()
            .meta().columnFilters;
        var cf;
        if (colFilters)
        {
            cf = colFilters[col.dataIndex];
        }

        // Remove the old filter menu if necessary
        $menu.children('.autofilter').prev('.separator').andSelf().remove();
        if (cf == null && (colSum.topFrequencies == null ||
                    colSum.topFrequencies.length < 1))
        {
            return;
        }

        var filterStr =
            '<li class="autofilter submenu">\
            <a href="#"><span class="highlight">Filter This Column</span></a>\
            <ul class="menu optionMenu">';
        // If we already have a filter for this column, give them a clear link
        if (cf != null)
        {
            filterStr +=
                '<li class="clearFilter">\
                <a href="#clear-filter-column_' + col.index + '">\
                <span class="highlight">Clear Column Filter</span>\
                </a>\
                </li>';
            if (colSum.topFrequencies == null)
            {
                colSum.topFrequencies = [{value: cf.value, count: 0}];
            }
        }
        // Previous button for scrolling
        filterStr +=
            '<li class="button prev"><a href="#prev" title="Previous">\
            <div class="outerWrapper"><div class="midWrapper">\
            <span class="innerWrapper">Previous</span>\
            </div></div>\
            </a></li>';

        var searchMethod = function(a, b)
        {
            return (a.value > b.value) ? 1 : -1;
        };
        if (colSum.subColumnType == "number" ||
                colSum.subColumnType == "money" ||
                colSum.subColumnType == "percent")
        {
            searchMethod = function(a, b)
            {
                return (parseFloat(a.value) > parseFloat(b.value)) ? 1 : -1;
            };
        }
        if (colSum.topFrequencies != null)
        {
            colSum.topFrequencies.sort(searchMethod);

            // Add an option for each filter item
            $.each(colSum.topFrequencies, function (i, f)
                {
                    var isMatching = cf != null && cf.value == f.value;
                    var curType = blist.data.types[col.type] ||
                        blist.data.types['text'];
                    var escapedValue = curType.filterValue != null ?
                        curType.filterValue(f.value, col) :
                        $.htmlStrip(f.value + '');
                    var renderedValue = curType.filterRender != null ?
                        curType.filterRender(f.value, col) : '';
                    filterStr +=
                        '<li class="filterItem' + (isMatching ? ' active' : '') +
                        ' scrollable">\
                            <a href="' +
                            (isMatching ? '#clear-filter-column_' :
                                '#filter-column_') +
                            col.index + '_' + escapedValue + '" title="' +
                            $.htmlStrip(renderedValue) + ' (' + f.count +
                            ')" class="clipText">' + renderedValue +
                            ' (' + f.count + ')\
                            </a>\
                        </li>';
                });
        }

        // Next button for scrolling & menu footer
        filterStr +=
            '<li class="button next"><a href="#next" title="Next">\
            <div class="outerWrapper"><div class="midWrapper">\
            <span class="innerWrapper">Next</span>\
            </div></div>\
            </a></li>\
            <li class="footer"><div class="outerWrapper">\
            <div class="innerWrapper"><span class="colorWrapper"></span></div>\
            </div></li>\
            </ul>\
            </li>';

        // Find the correct spot to add it; either after sort descending, or the top
        var $sortItem = $menu.find('li.sortDesc');
        if ($sortItem.length > 0)
        {
            filterStr = '<li class="separator" />' + filterStr;
            $sortItem.after(filterStr);
        }
        else
        {
            $menu.prepend(filterStr);
        }
        hookUpHeaderMenu(datasetObj, $(col.dom), $menu);
    };


    /* Handle clicks in the column header menus */
    var columnHeaderMenuHandler = function(datasetObj, event)
    {
        event.preventDefault();
        // Href that we care about starts with # and parts are separated with _
        // IE sticks the full thing, so slice everything up to #
        var href = $(event.currentTarget).attr('href');
        var s = href.slice(href.indexOf('#') + 1).split('_');
        if (s.length < 2)
        {
            return;
        }

        var action = s[0];
        var colIndex = s[1];
        var model = $(datasetObj.currentGrid).blistModel();
        switch (action)
        {
            case 'column-sort-asc':
                model.sort(colIndex, false);
                break;
            case 'column-sort-desc':
                model.sort(colIndex, true);
                break;
            case 'filter-column':
                datasetObj.summaryStale = true;
                // Rejoin remainder of parts in case the filter value had _
                model.filterColumn(colIndex, $.htmlUnescape(s.slice(2).join('_')));
                setTempView(datasetObj, model.meta().view);
                break;
            case 'clear-filter-column':
                datasetObj.summaryStale = true;
                model.clearColumnFilter(colIndex);
                clearTempView(datasetObj);
                break;
        }
        // Update the grid header to reflect updated sorting, filtering
        $(datasetObj.currentGrid).trigger('header_change', [model]);
    };

    var clearTempView = function(datasetObj)
    {
        datasetObj.settings._filterCount--;
        if (datasetObj.settings._filterCount > 0)
        {
            return;
        }

        if (datasetObj.settings.clearTempViewCallback != null)
        {
            datasetObj.settings.clearTempViewCallback();
        }

        datasetObj.isTempView = false;
    };

    var setTempView = function(datasetObj, tempView)
    {
        datasetObj.settings._filterCount++;
        if (datasetObj.isTempView)
        {
            return;
        }

        if (datasetObj.settings.setTempViewCallback != null)
        {
            datasetObj.settings.setTempViewCallback(tempView);
        }

        datasetObj.isTempView = true;
    };

})(jQuery);

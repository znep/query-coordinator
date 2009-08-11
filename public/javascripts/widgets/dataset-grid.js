/* Dataset grids MUST have an ID! */

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
            columnPropertiesEnabled: false,
            currentUserId: null,
            editEnabled: false,
            filterItem: null,
            manualResize: false,
            setTempViewCallback: function (tempView) {},
            showRowHandle: false,
            showRowNumbers: true,
            updateTempViewCallback: function (tempView) {},
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
                    .bind('col_width_change', function (event, c, f)
                        { columnResized(datasetObj, c, f); })
                    .bind('sort_change', function (event)
                        { sortChanged(datasetObj); })
                    .bind('columns_rearranged', function (event)
                        { columnsRearranged(datasetObj); })
                    .bind('column_filter_change', function (event, c)
                        { columnFilterChanged(datasetObj, c); })
                    .blistTable({cellNav: true, selectionEnabled: false,
                        generateHeights: false, columnDrag: true,
                        editEnabled: datasetObj.settings.editEnabled,
                        headerMods: function (col) { headerMods(datasetObj, col); },
                        manualResize: datasetObj.settings.manualResize,
                        showGhostColumn: true, showTitle: false,
                        showRowHandle: datasetObj.settings.showRowHandle,
                        rowHandleWidth: 15,
                        // This really ought to be linked to edit; but until
                        // edit is enabled, we'll check the user
                        //rowHandleRenderer: (datasetObj.settings.editEnabled ?
                        rowHandleRenderer: (datasetObj.settings.currentUserId ?
                            datasetObj.rowHandleRenderer : '""'),
                        showRowNumbers: datasetObj.settings.showRowNumbers})
                    .bind('cellclick', function (e, r, c, o)
                        { cellClick(datasetObj, e, r, c, o); })
                    .blistModel()
                    .options({filterMinChars: 0, progressiveLoading: true})
                    .ajax({url: '/views/' + datasetObj.settings.viewId +
                                '/rows.json', cache: false,
                            data: {accessType: datasetObj.settings.accessType},
                            dataType: 'json'});

                $('#' + $datasetGrid.attr('id') + ' .blist-table-row-handle')
                    .live('mouseover',
                        function (e) { hookUpRowMenu(datasetObj, this, e); });

                datasetObj.settings._model = $datasetGrid.blistModel();

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

            updateView: function(newView)
            {
                var datasetObj = this;

                datasetObj.settings._filterIds = {};
                datasetObj.settings._filterCount = 0;
                datasetObj.isTempView = false;

                datasetObj.settings.filterItem.val('').blur();
                datasetObj.settings.clearFilterItem.hide();
                datasetObj.summaryStale = true;

                if (typeof newView == 'string')
                {
                    // Assume ID
                    newView = {id: newView};
                }
                if (!newView.meta && newView.id)
                {
                    // Assume view with no rows
                    datasetObj.settings.viewId = newView.id;
                    datasetObj.settings._model
                        .ajax({url: '/views/' + datasetObj.settings.viewId +
                                '/rows.json', cache: false,
                            data: {accessType: datasetObj.settings.accessType},
                            dataType: 'json'});
                }
                else if (newView.meta && newView.data)
                {
                    datasetObj.settings.viewId = o.meta.view.id;
                    datasetObj.settings._model.meta(o.meta);
                    datasetObj.settings._model.rows(o.data);
                }
            },

            getViewCopy: function(includeColumns)
            {
                var view = $.extend({}, this.settings._model.meta().view);

                if (includeColumns)
                {
                    var viewCols = $.extend([], view.columns);
                    // Update all the widths from the meta columns
                    $.each(this.settings._model.meta().columns[0], function(i, c)
                    {
                        viewCols[c.dataIndex].width = c.width;
                        if (c.body && c.body.children)
                        {
                            $.each(c.body.children, function(j, cc)
                            {
                                viewCols[c.dataIndex]
                                    .childColumns[cc.dataIndex].width = cc.width;
                            });
                        }
                    });
                    // Filter out all metadata columns
                    viewCols = $.grep(viewCols, function(c, i)
                        { return c.id != -1; });
                    // Sort by position, because the attribute is ignored when
                    // saving columns
                    viewCols.sort(function(a, b)
                        { return a.position - b.position; });
                    var cleanColumn = function(col)
                    {
                        delete col.dataIndex;
                        delete col.options;
                        if (col.dataType)
                        {
                            delete col.dataType.picklist;
                        }
                    };
                    // Clean out dataIndexes, and clean out child metadata columns
                    $.each(viewCols, function(i, c)
                    {
                        cleanColumn(c);
                        if (c.childColumns)
                        {
                            c.childColumns = $.grep(c.childColumns, function(cc, j)
                                { return cc.id != -1; });
                            $.each(c.childColumns, function(j, cc)
                                { cleanColumn(cc); });
                        }
                    });
                    view.columns = viewCols;
                }
                else
                {
                    view.columns = null;
                }
                delete view['grants'];
                view.originalViewId = view.id;
                return view;
            },

            setColumnAggregate: function(columnId, aggregate)
            {
                var datasetObj = this;
                var view = datasetObj.settings._model.meta().view;
                $.ajax({url: '/views/' + view.id + '/columns/' + columnId + '.json',
                    dataType: 'json', type: 'PUT', contentType: 'application/json',
                    data: $.json.serialize({'format': {'aggregate':
                        (aggregate == 'none' ? null : aggregate)}}),
                    success: function(retCol)
                    {
                        datasetObj.settings._model.updateColumn(retCol);
                    }});
            },

            showHideColumns: function(columns, hide, skipRequest)
            {
                var datasetObj = this;
                var view = datasetObj.settings._model.meta().view;
                var successCount = 0;
                $.each(columns, function(i, colId)
                {
                    var matchCols = $.grep(view.columns, function(c, i)
                            { return c.id == colId; });
                    if (matchCols.length == 1)
                    {
                        var col = matchCols[0];
                        if (!col.flags) { col.flags = []; }
                        if (hide)
                        { col.flags.push('hidden'); }
                        else
                        {
                            var ind = $.inArray('hidden', col.flags);
                            if (ind > -1) { col.flags.splice(ind, 1); }
                        }
                        datasetObj.settings._model.updateColumn(col);

                        var $li = $('.columnsShowMenu a[href*="_' + colId + '"]')
                            .closest('li');
                        if (hide) { $li.removeClass('checked'); }
                        else { $li.addClass('checked'); }

                        if (!skipRequest)
                        {
                            if (datasetObj.settings.currentUserId == view.owner.id)
                            {
                                $.ajax({url: '/views/' + view.id + '/columns/' +
                                    colId + '.json',
                                    data: $.json.serialize({'hidden': hide}),
                                    type: 'PUT', dataType: 'json',
                                    contentType: 'application/json',
                                    success: function(retCol)
                                    {
                                        // Update the column as it comes from
                                        // the server if it has an aggregate
                                        if (retCol.updatedAggregate !== null &&
                                            retCol.updatedAggregate !== undefined)
                                        {
                                            datasetObj.settings._model
                                                .updateColumn(retCol);
                                        }
                                        successCount++;
                                        if (successCount == columns.length)
                                        {
                                            $(document)
                                                .trigger(blist.events.COLUMNS_CHANGED);
                                        }
                                    }
                                    });
                            }
                            else
                            {
                                setTempView(datasetObj, view,
                                    'columnShowHide-' + colId);
                            }
                        }
                    }
                });
            },

            // This keeps track of when the column summary data is stale and
            // needs to be refreshed
            summaryStale: true,

            isTempView: false,

            rowHandleRenderer: '(permissions.canDelete ? ' +
                '"<a class=\'menuLink\' href=\'#row-menu_" + ' +
                'row.id + "\'></a>' +
                '<ul class=\'menu rowMenu\' id=\'row-menu_" + row.id + "\'>' +
                '<li class=\'delete\'><a href=\'#row-delete_" + row.id + ' +
                '"\'>Delete Row</a></li>' +
                '<li class=\'footer\'><div class=\'outerWrapper\'>' +
                '<div class=\'innerWrapper\'><span class=\'colorWrapper\'>' +
                '</span></div>' +
                '</div></li>' +
                '</ul>" : "")'
        }
    });

    var hookUpRowMenu = function(datasetObj, curCell, e)
    {
        var $cell = $(curCell);
        if (!$cell.data('row-menu-applied'))
        {
            $cell.find('ul.menu').dropdownMenu({
                menuContainerSelector: ".blist-table-row-handle",
                triggerButtonSelector: "a.menuLink",
                linkCallback: function (e)
                    { rowMenuHandler(datasetObj, e); },
                pullToTop: true
            });
            $cell.data('row-menu-applied', true);
        }
    };

    /* Handle clicks in the row menus */
    var rowMenuHandler = function(datasetObj, event)
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
        var rowId = s[1];
        var model = datasetObj.settings._model;
        var view = model.meta().view;
        if (action == 'row-delete')
        {
            model.selectRow(model.getByID(rowId));
            var successCount = 0;
            var totalRows = 0;
            $.each(model.selectedRows, function(id, index)
            {
                totalRows++;
                $.ajax({url: '/views/' + view.id + '/rows/' + id + '.json',
                    contentType: 'application/json', type: 'DELETE',
                    complete: function()
                    {
                        successCount++;
                        if (successCount == totalRows)
                        { updateAggregates(datasetObj); }
                    }});
                model.remove(model.getByID(id));
            });
            datasetObj.summaryStale = true;
        }
    };

    var updateAggregates = function(datasetObj)
    {
        var model = datasetObj.settings._model;
        var view = model.meta().view;
        $.ajax({url: '/views/' + view.id + '/rows.json',
            data: {include_aggregates: true, max_rows: 0}, cache: false,
            contentType: 'application/json', dataType: 'json', type: 'GET',
            success: function(resp)
            {
                model.updateAggregateHash(resp.meta.aggregates);
                model.metaChange();
            }});
    };

    var cellClick = function(datasetObj, event, row, column, origEvent)
    {
        var model = datasetObj.settings._model;
        if (!column || row.level > 0) { return; }

        if (column.dataIndex == 'rowNumber')
        {
            if (origEvent.shiftKey)
            {
                model.selectRowsTo(row);
            }
            else
            {
                model.toggleSelectRow(row);
            }
        }
    };

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
                var model = datasetObj.settings._model;
                model.filter(searchText, 250);
                if (!searchText || searchText === '')
                {
                    clearTempView(datasetObj, 'searchString');
                    datasetObj.settings.clearFilterItem.hide();
                }
                else
                {
                    setTempView(datasetObj, model.meta().view, 'searchString');
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
        datasetObj.settings._model.filter('');
        clearTempView(datasetObj, 'searchString');
        $(e.currentTarget).hide();
    };

    /* Callback when rendering the grid headers.  Set up column on-object menus */
    var headerMods = function(datasetObj, col)
    {
        var displayMenu = false;
        var $col = $(col.dom);
        var htmlStr =
            '<a class="menuLink action-item" href="#column-menu_' +
            col.index + '"></a>' +
            '<ul class="menu columnHeaderMenu action-item" id="column-menu_' +
            col.index + '">';

        // We support sort & filter, so if neither is available, don't show a menu
        if (blist.data.types[col.type].sortable)
        {
            htmlStr +=
                '<li class="sortAsc singleItem">' +
                '<a href="#column-sort-asc_' + col.index + '">' +
                '<span class="highlight">Sort Ascending</span>' +
                '</a>' +
                '</li>' +
                '<li class="sortDesc singleItem">' +
                '<a href="#column-sort-desc_' + col.index + '">' +
                '<span class="highlight">Sort Descending</span>' +
                '</a>' +
                '</li>';
            displayMenu = true;
        }

        if (blist.data.types[col.type].filterable)
        {
            displayMenu = true;
        }

        if (displayMenu)
        {
            // There are already display items in the list, so we need to add
            // a separator.
            htmlStr += '<li class="separator singleItem" />';
        }
        htmlStr += '<li class="hide" >' +
            '<a href="#hide-column_' + col.id + '">' +
            '<span class="highlight">Hide Column</span>' +
            '</a></li>';
        displayMenu = true;

        var view = datasetObj.settings._model.meta().view;
        // TODO - use rights
        if (view.tableOwner.id == datasetObj.settings.currentUserId &&
                view.owner.id == datasetObj.settings.currentUserId)
        {
            htmlStr += '<li class="delete" >' +
                '<a href="#delete-column_' + col.id + '">' +
                '<span class="highlight">Delete Column</span>' +
                '</a></li>';
            displayMenu = true;
        }

        if (datasetObj.settings.columnPropertiesEnabled)
        {
            if (displayMenu)
            {
                // There are already display items in the list, so we need to add
                // a separator.
                htmlStr += '<li class="separator singleItem" />';
            }
            htmlStr += '<li class="properties singleItem">' +
                '<a href="/blists/' + view.id + '/columns/' + col.id +
                '.json" rel="modal">' +
                '<span class="highlight">Edit Column Properties</span>' +
                '</a>' +
                '</li>';
            displayMenu = true;
        }

        htmlStr +=
            '<li class="footer"><div class="outerWrapper">' +
            '<div class="innerWrapper"><span class="colorWrapper">' +
            '</span></div>' +
            '</div></li>' +
            '</ul>';

        if (displayMenu)
        {
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
                        { columnMenuOpenCallback(datasetObj, $colHeader, $menu); },
                    linkCallback: function (e)
                        { columnHeaderMenuHandler(datasetObj, e); },
                    forcePosition: true, pullToTop: true})
            .find('.autofilter ul.menu').scrollable();
    };

    var columnMenuOpenCallback = function(datasetObj, $colHeader, $menu)
    {
        var selCols = $(datasetObj.currentGrid).blistTableAccessor()
            .getSelectedColumns();
        var hasSel = false;
        $.each(selCols, function() { hasSel = true; return false; });

        if (!hasSel)
        {
            $menu.find('.singleItem').show();
            var col = $colHeader.data('column');
            loadFilterMenu(datasetObj, col, $menu);
        }
        else
        {
            $menu.find('.singleItem').hide();
        }
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

        var modView = datasetObj.settings._model.meta().view;
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
        var colFilters = datasetObj.settings._model
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
            '<li class="autofilter submenu singleItem">' +
            '<a href="#"><span class="highlight">Filter This Column</span></a>' +
            '<ul class="menu optionMenu">';
        // If we already have a filter for this column, give them a clear link
        if (cf != null)
        {
            filterStr +=
                '<li class="clearFilter">' +
                '<a href="#clear-filter-column_' + col.index + '">' +
                '<span class="highlight">Clear Column Filter</span>' +
                '</a>' +
                '</li>';
            if (colSum.topFrequencies == null)
            {
                colSum.topFrequencies = [{value: cf.value, count: 0}];
            }
        }
        // Previous button for scrolling
        filterStr +=
            '<li class="button prev"><a href="#prev" title="Previous">' +
            '<div class="outerWrapper"><div class="midWrapper">' +
            '<span class="innerWrapper">Previous</span>' +
            '</div></div>' +
            '</a></li>';

        var searchMethod = function(a, b)
        {
            var av = a.titleValue.toUpperCase();
            var bv = b.titleValue.toUpperCase();
            return av > bv ? 1 : av < bv ? -1 : 0;
        };
        if (colSum.subColumnType == "number" ||
                colSum.subColumnType == "money" ||
                colSum.subColumnType == "date" ||
                colSum.subColumnType == "percent")
        {
            searchMethod = function(a, b)
            {
                return a.value - b.value;
            };
        }
        if (colSum.topFrequencies != null)
        {
            // First loop through and set up variations on the value
            // to use in the menu
            $.each(colSum.topFrequencies, function (i, f)
                {
                    f.isMatching = cf != null && cf.value == f.value;
                    var curType = blist.data.types[col.type] ||
                        blist.data.types['text'];
                    f.escapedValue = curType.filterValue != null ?
                        curType.filterValue(f.value, col) :
                        $.htmlStrip(f.value + '');
                    f.renderedValue = curType.filterRender != null ?
                        curType.filterRender(f.value, col) : '';
                    f.titleValue = $.htmlStrip(f.renderedValue);
                });

            colSum.topFrequencies.sort(searchMethod);

            // Add an option for each filter item
            $.each(colSum.topFrequencies, function (i, f)
                {
                    filterStr +=
                        '<li class="filterItem' + (f.isMatching ? ' active' : '') +
                        ' scrollable">' +
                            '<a href="' +
                            (f.isMatching ? '#clear-filter-column_' :
                                '#filter-column_') +
                            col.index + '_' + f.escapedValue + '" title="' +
                            f.titleValue +
                            (f.count > 1 ? ' (' + f.count + ')' : '') +
                            '" class="clipText">' + f.renderedValue +
                            (f.count > 1 ? ' (' + f.count + ')' : '') +
                            '</a>' +
                        '</li>';
                });
        }

        // Next button for scrolling & menu footer
        filterStr +=
            '<li class="button next"><a href="#next" title="Next">' +
            '<div class="outerWrapper"><div class="midWrapper">' +
            '<span class="innerWrapper">Next</span>' +
            '</div></div>' +
            '</a></li>' +
            '<li class="footer"><div class="outerWrapper">' +
            '<div class="innerWrapper"><span class="colorWrapper"></span></div>' +
            '</div></li>' +
            '</ul>' +
            '</li>';

        // Find the correct spot to add it; either after sort descending, or the top
        var $sortItem = $menu.find('li.sortDesc');
        if ($sortItem.length > 0)
        {
            filterStr = '<li class="separator singleItem" />' + filterStr;
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
        var colIdIndex = s[1];
        var model = datasetObj.settings._model;
        switch (action)
        {
            case 'column-sort-asc':
                model.sort(colIdIndex, false);
                break;
            case 'column-sort-desc':
                model.sort(colIdIndex, true);
                break;
            case 'filter-column':
                // Rejoin remainder of parts in case the filter value had _
                model.filterColumn(colIdIndex,
                    $.htmlUnescape(s.slice(2).join('_')));
                break;
            case 'clear-filter-column':
                model.clearColumnFilter(colIdIndex);
                break;
            case 'hide-column':
                var selCols = $(datasetObj.currentGrid).blistTableAccessor()
                    .getSelectedColumns();
                selCols[colIdIndex] = true;
                var cols = [];
                $.each(selCols, function(colId, val) { cols.push(colId); });
                datasetObj.showHideColumns(cols, true);
                break;
            case 'delete-column':
                var view = model.meta().view;
                var selCols = $(datasetObj.currentGrid).blistTableAccessor()
                    .getSelectedColumns();
                selCols[colIdIndex] = true;

                var cols = [];
                var successCount = 0;
                $.each(selCols, function(colId, val)
                        { cols.push(colId); });
                var multiCols = cols.length > 1;
                if (confirm('Do you want to delete the ' +
                    (multiCols ? cols.length + ' selected columns' :
                        'selected column') + '? All data in ' +
                    (multiCols ? 'these columns' : 'this column') +
                    ' will be removed!'))
                {
                    $.each(cols, function(i, colId)
                    {
                        $.ajax({url: '/views/' + view.id + '/columns/' +
                            colId + '.json', type: 'DELETE',
                            contentType: 'application/json',
                            complete: function()
                            {
                                successCount++;
                                if (successCount == cols.length)
                                {
                                    model.deleteColumns(cols);
                                    $(document)
                                        .trigger(blist.events.COLUMNS_CHANGED);
                                }
                            }});
                    });
                    // Hide columns so they disappear immediately
                    datasetObj.showHideColumns(cols, true, true);
                }
                break;
        }
        // Update the grid header to reflect updated sorting, filtering
        $(datasetObj.currentGrid).trigger('header_change', [model]);
    };


    var columnResized = function(datasetObj, col, isFinished)
    {
        if (isFinished)
        {
            var view = datasetObj.settings._model.meta().view;
            if (datasetObj.settings.currentUserId == view.owner.id)
            {
                $.ajax({url: '/views/' + view.id + '/columns/' + col.id + '.json',
                    data: $.json.serialize({width: col.width}),
                    type: 'PUT', contentType: 'application/json'});
            }
        }
    };

    var sortChanged = function(datasetObj)
    {
        var view = datasetObj.settings._model.meta().view;
        if (datasetObj.settings.currentUserId == view.owner.id)
        {
            $.ajax({url: '/views/' + view.id + '.json',
                data: $.json.serialize({sortBys: view.sortBys}),
                type: 'PUT', contentType: 'application/json'});
        }
        else
        {
            setTempView(datasetObj, datasetObj.settings._model.meta().view, 'sort');
        }
    };

    var columnsRearranged = function(datasetObj)
    {
        var view = datasetObj.settings._model.meta().view;
        if (datasetObj.settings.currentUserId == view.owner.id)
        {
            var modView = datasetObj.getViewCopy(true);
            $.ajax({url: '/views/' + view.id + '.json',
                    data: $.json.serialize(modView),
                    type: 'PUT', contentType: 'application/json',
                    success: function()
                        { $(document).trigger(blist.events.COLUMNS_CHANGED); }
                    });
        }
    };

    var columnFilterChanged = function(datasetObj, col)
    {
        datasetObj.summaryStale = true;
        if (!col)
        {
            clearTempView(datasetObj);
        }
        else
        {
            setTempView(datasetObj, datasetObj.settings._model.meta().view);
        }
    };

    var clearTempView = function(datasetObj, countId)
    {
        if (!datasetObj.settings._filterIds) {datasetObj.settings._filterIds = {};}
        if (countId != null) { delete datasetObj.settings._filterIds[countId]; }

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

    var setTempView = function(datasetObj, tempView, countId)
    {
        if (!datasetObj.settings._filterIds) {datasetObj.settings._filterIds = {};}
        if (countId == null || datasetObj.settings._filterIds[countId] == null)
        {
            datasetObj.settings._filterCount++;
            if (countId != null) { datasetObj.settings._filterIds[countId] = true; }
        }

        if (datasetObj.settings.updateTempViewCallback != null)
        {
            datasetObj.settings.updateTempViewCallback(tempView);
        }

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

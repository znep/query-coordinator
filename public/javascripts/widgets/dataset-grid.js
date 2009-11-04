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
            columnNameEdit: false,
            columnPropertiesEnabled: false,
            currentUserId: null,
            editEnabled: true,
            filterItem: null,
            manualResize: false,
            setTempViewCallback: function () {},
            showRowHandle: false,
            showRowNumbers: true,
            showAddColumns: false,
            viewId: null
        },

        prototype:
        {
            init: function ()
            {
                var datasetObj = this;
                var $datasetGrid = datasetObj.$dom();
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
                    .bind('column_filter_change', function (event, c, s)
                        { columnFilterChanged(datasetObj, c, s); })
                    .bind('server_row_change', function(event)
                        { serverRowChange(datasetObj); })
                    .bind('columns_update', function(event)
                        { columnsUpdated(datasetObj); })
                    .bind('full_load', function(event)
                        { viewLoaded(datasetObj); })
                    .bind('column_name_dblclick', function(event, origEvent)
                        { columnNameEdit(datasetObj, event, origEvent); })
                    .blistTable({cellNav: true, selectionEnabled: false,
                        generateHeights: false, columnDrag: true,
                        editEnabled: datasetObj.settings.editEnabled,
                        headerMods: function (col) { headerMods(datasetObj, col); },
                        rowMods: function (rows) { rowMods(datasetObj, rows); },
                        manualResize: datasetObj.settings.manualResize,
                        showGhostColumn: true, showTitle: false,
                        showRowHandle: datasetObj.settings.showRowHandle,
                        rowHandleWidth: 15,
                        showAddColumns: datasetObj.settings.showAddColumns,
                        rowHandleRenderer: (datasetObj.settings.editEnabled ?
                            datasetObj.rowHandleRenderer :
                            function() { return '""'; }),
                        showRowNumbers: datasetObj.settings.showRowNumbers})
                    .bind('cellclick', function (e, r, c, o)
                        { cellClick(datasetObj, e, r, c, o); })
                    .blistModel()
                    .options({blankRow: datasetObj.settings.editEnabled,
                        filterMinChars: 0, progressiveLoading: true})
                    .ajax({url: '/views/' + datasetObj.settings.viewId +
                                '/rows.json', cache: false,
                            data: {accessType: datasetObj.settings.accessType},
                            dataType: 'json'});

                $('#' + $datasetGrid.attr('id') + ' .blist-table-row-handle')
                    .live('mouseover',
                        function (e) { hookUpRowMenu(datasetObj, this, e); });
                $('#' + $datasetGrid.attr('id') + ' .add-column')
                    .live("click", function (e) { 
                          $('<a href="/datasets/' + datasetObj.settings.viewId + '/columns/new" rel="modal" />').click();
                        });

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

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentGrid); }
                return this._$dom;
            },

            updateFilter: function(filter, saveExisting)
            {
                var datasetObj = this;
                datasetObj.settings._model.updateFilter(filter);

                var view = datasetObj.settings._model.meta().view;
                if (saveExisting && (view.flags === undefined ||
                    $.inArray('default', view.flags) < 0) &&
                    datasetObj.settings.currentUserId == view.owner.id)
                {
                    $.ajax({url: '/views/' + view.id + '.json',
                        data: $.json.serialize({viewFilters: view.viewFilters}),
                        type: 'PUT', contentType: 'application/json'});
                }
                else { this.setTempView(); }
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
                var view = $.extend(true, {}, this.settings._model.meta().view);

                if (includeColumns)
                {
                    // Update all the widths from the meta columns
                    $.each(this.settings._model.meta().columns[0], function(i, c)
                    {
                        view.columns[c.dataIndex].width = c.width;
                        if (c.body && c.body.children)
                        {
                            $.each(c.body.children, function(j, cc)
                            {
                                view.columns[c.dataIndex]
                                    .childColumns[cc.dataIndex].width = cc.width;
                            });
                        }
                    });
                    // Filter out all metadata columns
                    view.columns = $.grep(view.columns, function(c, i)
                        { return c.id != -1; });
                    // Sort by position, because the attribute is ignored when
                    // saving columns
                    view.columns.sort(function(a, b)
                        { return a.position - b.position; });
                    var cleanColumn = function(col)
                    {
                        delete col.dataIndex;
                        delete col.options;
                        delete col.dropDown;
                    };
                    // Clean out dataIndexes, and clean out child metadata columns
                    $.each(view.columns, function(i, c)
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
                    data: $.json.serialize({'format': {'aggregate': aggregate}}),
                    success: function(retCol)
                    {
                        datasetObj.settings._model.updateColumn(retCol);
                    }});
            },

            showHideColumns: function(columns, hide, skipRequest)
            {
                if (!(columns instanceof Array)) { columns = [columns]; }
                var datasetObj = this;
                var view = datasetObj.settings._model.meta().view;
                var successCount = 0;
                $.each(columns, function(i, colId)
                {
                    var col = datasetObj.settings._model.getColumnByID(colId);
                    if (col)
                    {
                        if (!col.flags) { col.flags = []; }
                        if (hide)
                        { col.flags.push('hidden'); }
                        else
                        {
                            var ind = $.inArray('hidden', col.flags);
                            if (ind > -1) { col.flags.splice(ind, 1); }
                        }
                        datasetObj.settings._model.updateColumn(col);

                        var $li = $('#columnsShowMenu a[href*="_' + colId + '"]')
                            .closest('li');
                        if (hide) { $li.removeClass('checked'); }
                        else { $li.addClass('checked'); }

                        if (!skipRequest)
                        {
                            if (datasetObj.settings.currentUserId == view.owner.id)
                            {
                                $.ajax({url: '/views/' + view.id + '/columns/' +
                                    col.id + '.json',
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
                                datasetObj.setTempView('columnShowHide-' + colId);
                            }
                        }
                    }
                });
            },

            clearTempView: function(countId, forceAll)
            {
                var datasetObj = this;
                if (!datasetObj.settings._filterIds)
                {datasetObj.settings._filterIds = {};}
                if (countId != null)
                { delete datasetObj.settings._filterIds[countId]; }

                datasetObj.settings._filterCount--;
                if (forceAll)
                {
                    datasetObj.settings._filterCount = 0;
                    datasetObj.settings._filterIds = {};
                    datasetObj.settings._model.reloadView();
                }
                if (datasetObj.settings._filterCount > 0)
                {
                    return;
                }

                if (datasetObj.settings.clearTempViewCallback != null)
                {
                    datasetObj.settings.clearTempViewCallback();
                }

                datasetObj.isTempView = false;
            },

            setTempView: function(countId)
            {
                var datasetObj = this;
                if (!datasetObj.settings._filterIds)
                {datasetObj.settings._filterIds = {};}
                if (countId == null ||
                    datasetObj.settings._filterIds[countId] == null)
                {
                    datasetObj.settings._filterCount++;
                    if (countId != null)
                    { datasetObj.settings._filterIds[countId] = true; }
                }

                if (datasetObj.isTempView)
                {
                    return;
                }

                if (datasetObj.settings.setTempViewCallback != null)
                {
                    datasetObj.settings.setTempViewCallback();
                }

                datasetObj.isTempView = true;
            },

            // This keeps track of when the column summary data is stale and
            // needs to be refreshed
            summaryStale: true,

            isTempView: false,

            rowHandleRenderer: function(col)
            {
                var colAdjust = '';
                var subRowLookup = '';
                if (col && col.header)
                {
                    colAdjust = '_' + col.header.indexInLevel;
                    subRowLookup = col.header.dataLookupExpr;
                }
                return '(permissions.canDelete && row' + subRowLookup +
                        '.type != "blank" ? ' +
                        '"<a class=\'menuLink\' href=\'#row-menu_" + ' +
                        'row.id + "' + colAdjust + '\'></a>' +
                        '<ul class=\'menu rowMenu\' id=\'row-menu_" + row.id + "' +
                        colAdjust + '\'><li class=\'delete\'>' +
                        '<a href=\'#row-delete_" + row.id + "' + colAdjust +
                        '\'>Delete Row</a></li>' +
                        '<li class=\'footer\'><div class=\'outerWrapper\'>' +
                        '<div class=\'innerWrapper\'>' +
                        '<span class=\'colorWrapper\'>' +
                        '</span></div>' +
                        '</div></li>' +
                        '</ul>" : "")';
            }
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
            if (s[2] !== undefined)
            {
                model.removeChildRows(model.getByID(rowId),
                    model.column(s[2]), true);
            }
            else
            {
                model.selectRow(model.getByID(rowId));
                var rows = [];
                $.each(model.selectedRows, function(id, index)
                        { rows.push(model.getByID(id)); });
                model.remove(rows, true);
            }
            datasetObj.summaryStale = true;
        }
    };

    var columnsUpdated = function(datasetObj)
    {
        datasetObj.summaryStale = true;
    };

    var serverRowChange = function(datasetObj)
    {
        datasetObj.summaryStale = true;
        updateAggregates(datasetObj);
    };

    var updateAggregates = function(datasetObj)
    {
        var model = datasetObj.settings._model;
        var view = model.meta().view;
        $.ajax({url: '/views/' + view.id + '/rows.json',
            data: {method: 'getAggregates'}, cache: false,
            contentType: 'application/json', dataType: 'json', type: 'GET',
            success: function(resp)
            {
                model.updateAggregateHash(resp);
                model.footerChange();
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
        else if ($(origEvent.target).closest(".blist-column-adder-icon").length > 0)
        {
            event.preventDefault();
            // Display the add column dialog.
            $('<a href="/datasets/' + model.meta().view.id + '/columns/new?parent=' + column.id + '" rel="modal" />').click();
        }
    };

    var filterTextInput = function (datasetObj, e)
    {
        if ($(datasetObj.currentGrid).closest('body').length < 1)
        {
            return;
        }

        // If they tab out of the field, we don't want to search
        if (e.keyCode == 9) { return; }

        setTimeout(function ()
            {
                var searchText = $(e.currentTarget).val();
                datasetObj.summaryStale = true;
                var model = datasetObj.settings._model;
                model.filter(searchText, 250);
                if (!searchText || searchText === '')
                {
                    datasetObj.clearTempView('searchString');
                    datasetObj.settings.clearFilterItem.hide();
                }
                else
                {
                    datasetObj.setTempView('searchString');
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
        datasetObj.clearTempView('searchString');
        $(e.currentTarget).hide();
    };

    var rowMods = function(datasetObj, renderedRows)
    {
        $.each(renderedRows, function(i, r)
        {
            var $row = $(r.row);
            if (!$row.is('.blist-tr-open')) { return true; }
            $row.find('.blist-tdh[uid]')
                .each(function(i, tdh)
                {
                    var $tdh = $(tdh);
                    if ($tdh.find('a.menuLink').length > 0) { return true; }
                    var uid = $tdh.attr('uid');
                    var col = datasetObj.settings._model.column(uid);
                    if (col) { createHeaderMenu(datasetObj, col, $tdh); }
                });
        });
    };

    /* Callback when rendering the grid headers.  Set up column on-object menus */
    var headerMods = function(datasetObj, col)
    {
        createHeaderMenu(datasetObj, col, $(col.dom));
    };

    var createHeaderMenu = function(datasetObj, col, $colDom)
    {
        var isNested = col.nestedIn !== undefined;
        // Create an object containing flags describing what should be present
        // in the menu
        var features = {};
        if (!isNested && blist.data.types[col.type].sortable)
        {
            features.sort = true;
        }
        if (!isNested && blist.data.types[col.type].filterable)
        {
            features.filter = true;
        }
        var view = datasetObj.settings._model.meta().view;
        if (view && view.rights &&
            $.inArray('remove_column', view.rights) >= 0)
        {
            features.remove = true;
        }
        if (datasetObj.settings.columnPropertiesEnabled && !datasetObj.isTempView)
        {
            features.properties = true;
        }

        // If we did not enable features, do not install the menu
        var haveFeatures = false;
        for (var x in features)
        {
            haveFeatures = true;
            break;
        }
        if (!haveFeatures) { return; }

        // Install the menu indicator DOM elements
        $colDom.append('<a class="menuLink action-item" href="#column-menu_' +
            col.uid + '"></a>');

        // Install an event handler that actually builds the menu on first
        // mouse over
        $colDom.one('mouseover', function()
        {
            if ($colDom.find('ul.menu').length > 0) { return; }
            var htmlStr =
                '<ul class="menu columnHeaderMenu action-item" id="column-menu_' +
                col.uid + '">';

            // Render sorting
            if (features.sort)
            {
                htmlStr +=
                    '<li class="sortAsc singleItem">' +
                    '<a href="#column-sort-asc_' + col.uid + '">' +
                    '<span class="highlight">Sort Ascending</span>' +
                    '</a>' +
                    '</li>' +
                    '<li class="sortDesc singleItem">' +
                    '<a href="#column-sort-desc_' + col.uid + '">' +
                    '<span class="highlight">Sort Descending</span>' +
                    '</a>' +
                    '</li>' +
                    '<li class="sortClear singleItem">' +
                    '<a href="#column-sort-clear_' + col.uid + '">' +
                    '<span class="highlight">Clear Sort</span>' +
                    '</a>' +
                    '</li>';
            }

            if (features.sort || features.filter)
            {
                // There are already display items in the list, so we need to add
                // a separator.
                htmlStr += '<li class="filterSeparator separator singleItem" />';
            }
            htmlStr += '<li class="hide" >' +
                '<a href="#hide-column_' + col.id + '">' +
                '<span class="highlight">Hide Column</span>' +
                '</a></li>';

            if(features.remove)
            {
                htmlStr += '<li class="delete" >' +
                    '<a href="#delete-column_' + col.id + '">' +
                    '<span class="highlight">Delete Column</span>' +
                    '</a></li>';
            }

            if (features.properties)
            {
                // There are already display items in the list, so we need to add
                // a separator.
                htmlStr += '<li class="separator singleItem" />';
                htmlStr += '<li class="properties singleItem">' +
                    '<a href="/datasets/' + view.id + '/columns/' + col.id +
                    '.json' + (col.nestedIn ?
                        '?parent=' + col.nestedIn.header.id : '') +
                    '" rel="modal">' +
                    '<span class="highlight">Edit Column Properties</span>' +
                    '</a>' +
                    '</li>';
            }

            htmlStr +=
                '<li class="footer"><div class="outerWrapper">' +
                '<div class="innerWrapper"><span class="colorWrapper">' +
                '</span></div>' +
                '</div></li>' +
                '</ul>';

            $colDom.append(htmlStr);
            var $menu = $colDom.find('ul.columnHeaderMenu');
            hookUpHeaderMenu(datasetObj, $colDom, $menu);
            addFilterMenu(datasetObj, col, $menu);
        });
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
        var col = $colHeader.data('column');
        var numSel = 0;
        $.each(selCols, function() { numSel++; });

        if (numSel < 1 || (numSel == 1 && selCols[col.id] !== undefined))
        {
            $menu.find('.singleItem').show();
            if (col)
            {
                loadFilterMenu(datasetObj, col, $menu);

                var curSort = datasetObj.settings._model.meta().sort[col.id];
                $menu.find('.sortAsc').toggle(!curSort || !curSort.ascending);
                $menu.find('.sortDesc').toggle(!curSort || curSort.ascending);
                $menu.find('.sortClear').toggle(curSort !== undefined);
            }
        }
        else
        {
            $menu.find('.singleItem').hide();
        }
    };

    var loadFilterMenu = function(datasetObj, col, $menu)
    {
        if (datasetObj.summaryStale ||
            datasetObj.settings._columnSummaries === undefined)
        {
            datasetObj.settings._columnSummaries = {};
            datasetObj.summaryStale = false;
        }

        var colSum = datasetObj.settings._columnSummaries;

        if (!blist.data.types[col.type].filterable) { return; }

        if (colSum[col.id] !== undefined)
        {
            addFilterMenu(datasetObj, col, $menu);
            return;
        }

        var modView = datasetObj.settings._model.meta().view;
        if (!modView) { return; }

        // Remove the old filter menu if necessary
        $menu.children('.autofilter').prev('.separator').andSelf().remove();

        var spinnerStr = '<li class="autofilter loading"></li>';
        // Find the correct spot to add it; either after sort descending, or
        // the top
        var $sortItem = $menu.find('li.filterSeparator');
        if ($sortItem.length > 0) { $sortItem.before(spinnerStr); }
        else { $menu.prepend(spinnerStr); }

        // Set up the current view to send to the server to get the appropriate
        //  summary data back
        var tempView = $.extend({}, modView,
                {originalViewId: modView.id, columns: null});
        $.ajax({url: '/views/INLINE/rows.json?method=getSummary&columnId=' +
                    col.id,
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
                        if (s.topFrequencies === undefined ||
                            s.topFrequencies.length < 1) { return true; }

                        if (colSum[s.columnId] === undefined)
                        { colSum[s.columnId] = {}; }

                        colSum[s.columnId][s.subColumnType] = s;
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
        // If this column doesn't have a dom, we don't support it yet...
        if (!col.dom) { return; }

        // Remove spinner
        $menu.children('.autofilter.loading').remove();

        // Make sure this column is filterable, and we have data for it
        if (datasetObj.settings._columnSummaries === undefined ||
                !blist.data.types[col.type].filterable)
        { return; }

        // Get the current filter for this column (if it exists)
        var colFilters = datasetObj.settings._model
            .meta().columnFilters;
        var cf = colFilters ? colFilters[col.id] || undefined : undefined;

        // Remove the old filter menu if necessary
        $menu.children('.autofilter').prev('.separator').andSelf().remove();

        var colSum = datasetObj.settings._columnSummaries[col.id];
        if (cf === undefined && colSum === undefined) { return; }

        var filterStr =
            '<li class="autofilter submenu singleItem">' +
            '<a href="#"><span class="highlight">Filter This Column</span></a>' +
            '<ul class="menu optionMenu">';
        // If we already have a filter for this column, give them a clear link
        if (cf !== undefined)
        {
            filterStr +=
                '<li class="clearFilter">' +
                '<a href="#clear-filter-column_' + col.uid + '">' +
                '<span class="highlight">Clear Column Filter</span>' +
                '</a>' +
                '</li>';
            if (colSum === undefined)
            {
                colSum = {curVal:
                    { topFrequencies: [{value: cf.value, count: 0}] } };
            }
        }
        // Previous button for scrolling
        filterStr +=
            '<li class="button prev"><a href="#prev" title="Previous">' +
            '<div class="outerWrapper"><div class="midWrapper">' +
            '<span class="innerWrapper">Previous</span>' +
            '</div></div>' +
            '</a></li>';

        var sumSections = [];
        $.each(colSum, function(k, cs)
        {
            var section = '';

            var searchMethod = function(a, b)
            {
                var av = a.titleValue.toUpperCase();
                var bv = b.titleValue.toUpperCase();
                return av > bv ? 1 : av < bv ? -1 : 0;
            };
            if (cs.subColumnType == "number" ||
                    cs.subColumnType == "money" ||
                    cs.subColumnType == "date" ||
                    cs.subColumnType == "percent")
            {
                searchMethod = function(a, b) { return a.value - b.value; };
            }

            if (cs.topFrequencies !== undefined)
            {
                // First loop through and set up variations on the value
                // to use in the menu
                $.each(cs.topFrequencies, function (i, f)
                    {
                        f.isMatching = cf !== undefined && cf.value == f.value;
                        var curType = blist.data.types[col.type] ||
                            blist.data.types['text'];
                        f.escapedValue = curType.filterValue !== undefined ?
                            curType.filterValue(f.value, col) :
                            $.htmlStrip(f.value + '');
                        f.renderedValue = curType.filterRender !== undefined ?
                            curType.filterRender(f.value, col, cs.subColumnType) :
                            '';
                        f.titleValue = $.htmlStrip(f.renderedValue + '');
                    });

                cs.topFrequencies.sort(searchMethod);

                // Add an option for each filter item
                $.each(cs.topFrequencies, function (i, f)
                    {
                        if (f.renderedValue === '') { return true; }
                        section +=
                            '<li class="filterItem' +
                            (f.isMatching ? ' active' : '') +
                            ' scrollable">' +
                                '<a href="' +
                                (f.isMatching ? '#clear-filter-column_' :
                                    '#filter-column_') +
                                col.uid + '_' + cs.subColumnType + ':' +
                                f.escapedValue + '" title="' +
                                f.titleValue +
                                (f.count > 1 ? ' (' + f.count + ')' : '') +
                                '" class="clipText">' + f.renderedValue +
                                (f.count > 1 ? ' (' + f.count + ')' : '') +
                                '</a>' +
                            '</li>';
                    });
            }
            sumSections.push(section);
        });

        filterStr += sumSections.join('<li class="separator scrollable"></li>');

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

        // Find the correct spot to add it; either after sort descending, or
        // the top
        var $sortItem = $menu.find('li.filterSeparator');
        if ($sortItem.length > 0)
        {
            filterStr = '<li class="separator singleItem" />' + filterStr;
            $sortItem.before(filterStr);
        }
        else { $menu.prepend(filterStr); }
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
            case 'column-sort-clear':
                model.clearSort(colIdIndex);
                break;
            case 'filter-column':
                // Rejoin remainder of parts in case the filter value had _
                // The sub-column type is separated by a colon, so split on that,
                // pull it off, then rejoin the remainder
                var p = s.slice(2).join('_').split(':');
                model.filterColumn(colIdIndex,
                    $.htmlUnescape(p.slice(1).join(':')), p[0]);
                break;
            case 'clear-filter-column':
                model.clearColumnFilter(colIdIndex);
                break;
            case 'hide-column':
                var selHideCols = $(datasetObj.currentGrid).blistTableAccessor()
                    .getSelectedColumns();
                selHideCols[colIdIndex] = true;
                var hideCols = [];
                $.each(selHideCols, function(colId, val) { hideCols.push(colId); });
                datasetObj.showHideColumns(hideCols, true);
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
            $.each(view.columns, function(i, c)
                { if (c.id == col.id) { c.width = col.width; return false; } });
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
        if (datasetObj.settings.currentUserId == view.owner.id &&
            !datasetObj.isTempView)
        {
            $.ajax({url: '/views/' + view.id + '.json',
                data: $.json.serialize({sortBys: view.sortBys}),
                type: 'PUT', contentType: 'application/json'});
        }
        else
        {
            var oldSorts = datasetObj.origSortBys;
            var newSorts = view.sortBys;
            var matches = oldSorts.length == newSorts.length;
            if (matches)
            {
                for (var i = 0; i < oldSorts.length; i++)
                {
                    var o = oldSorts[i];
                    var n = newSorts[i];
                    if (o.columnId != n.viewColumnId ||
                            o.ascending != (n.asc ||
                                (n.flags !== undefined &&
                                 $.inArray('asc', n.flags) >= 0)))
                    {
                        matches = false;
                        break;
                    }
                }
            }

            if (matches) { datasetObj.clearTempView('sort'); }
            else { datasetObj.setTempView('sort'); }
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
                        {
                            $(document).trigger(blist.events.COLUMNS_CHANGED);
                            // If we change the column order on the server,
                            // data will come back in a different order;
                            // so reload the view with the proper order of
                            // columns & row data
                            datasetObj.settings._model.reloadView();
                        }
                    });
        }
    };

    var columnFilterChanged = function(datasetObj, col, setFilter)
    {
        datasetObj.summaryStale = true;
        if (!setFilter) { datasetObj.clearTempView('filter_' + col.id); }
        else { datasetObj.setTempView('filter_' + col.id); }
    };

    var viewLoaded = function(datasetObj)
    {
        datasetObj.origSortBys = [];
        var view = datasetObj.settings._model.meta().view;
        if (view.sortBys !== undefined)
        {
            $.each(view.sortBys, function(i, s)
            {
                var curS = {columnId: s.viewColumnId};
                curS.ascending = (s.asc ||
                    (s.flags !== undefined && $.inArray('asc', s.flags) >= 0));
                datasetObj.origSortBys.push(curS);
            });
        }
    };

    var columnNameEdit = function(datasetObj, event, origEvent)
    {
        if (!datasetObj.settings.columnNameEdit || datasetObj.isTempView)
        { return; }

        var $target = $(origEvent.target);
        var $th = $target.closest('.blist-th').addClass('editable');
        var $container = $target.closest('.name-wrapper');
        var $edit = $container.find('form');
        if ($edit.length < 1)
        {
            $container.append('<form class="action-item">' +
                '<input type="text" /></form>');
            $edit = $container.find('form');
            $edit.submit(function(e) { columnEditSubmit(datasetObj, e); })
                .find(':input').keydown(function(e)
                    { columnEditKeyHandler(datasetObj, e); });
        }
        $edit.find(':input').removeAttr('disabled')
            .val($target.text()).focus().select();
        $(document).bind('mousedown.columnNameEdit-' + $th.data('column').id,
                function(e) { columnEditDocMouse(datasetObj, e, $th); })
            .bind('mouseup.columnNameEdit-' + $th.data('column').id,
                function(e) { columnEditDocMouse(datasetObj, e, $th); });
    };

    var columnEditEnd = function(datasetObj, $th)
    {
        // This doesn't actually give keyboard-nav in the grid; but it does
        // get the cursor out of the now-hidden edit field
        datasetObj.$dom().focus();
        $th.removeClass('editable error');
        $(document).unbind('.columnNameEdit-' + $th.data('column').id);
    };

    var columnEditSave = function(datasetObj, $th)
    {
        var $input = $th.find(':input');
        var newName = $input.val();
        if (newName === '')
        {
            alert('You must enter a name for this column');
            $th.addClass('error');
            return;
        }

        var origName = $th.find('.blist-th-name').text();
        if (origName == newName)
        {
            columnEditEnd(datasetObj, $th);
            return;
        }

        var model = datasetObj.settings._model;
        var col = model.getColumnByID($th.data('column').id);
        col.name = newName;
        $input.attr('disabled', 'disabled');

        $.ajax({url: '/views/' + model.meta().view.id + '/columns/' +
            col.id + '.json',
            data: $.json.serialize({name: col.name}),
            type: 'PUT', dataType: 'json', contentType: 'application/json',
            error: function(xhr)
            {
                var errBody = $.json.deserialize(xhr.responseText);
                alert(errBody.message);
                $th.addClass('error');
                $input.removeAttr('disabled');
            },
            success: function(newCol)
            {
                columnEditEnd(datasetObj, $th);
                model.updateColumn(newCol);
                $(document).trigger(blist.events.COLUMNS_CHANGED);
            }});
    };

    var columnEditDocMouse = function(datasetObj, event, $th)
    {
        var $target = $(event.target);
        if (($target.is('.name-wrapper :input') &&
            $target.parents().index($th) >= 0) ||
            $target.closest('#jqmAlert').length > 0) { return; }

        columnEditSave(datasetObj, $th);
    };

    var columnEditSubmit = function(datasetObj, event)
    {
        event.preventDefault();

        columnEditSave(datasetObj, $(event.target).closest('.blist-th'));
    };

    var columnEditKeyHandler = function(datasetObj, event)
    {
        if (event.keyCode == 27)
        { columnEditEnd(datasetObj, $(event.target).closest('.blist-th')); }
    };

})(jQuery);

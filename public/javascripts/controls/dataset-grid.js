/* Dataset grids MUST have an ID! */

(function($)
{
    $.fn.isDatasetGrid = function()
    {
        return !_.isUndefined($(this[0]).data("datasetGrid"));
    };

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
            addColumnCallback: function(parentId) {},
            columnDeleteEnabled: false,
            columnNameEdit: false,
            columnPropertiesEnabled: false,
            editColumnCallback: function(columnId, parentId) {},
            editEnabled: true,
            manualResize: false,
            showRowHandle: false,
            showRowNumbers: true,
            showAddColumns: false,
            view: null
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
                    .bind('column_sort', function(event, c, a)
                        { columnSorted(datasetObj, c, a); })
                    .bind('clear_filter', function(event, c)
                        { clearColumnFilter(datasetObj, c); })
                    .bind('column_resized', function (event, c, f)
                        { columnResized(datasetObj, c, f); })
                    .bind('column_moved', function (event, c, p)
                        { columnMove(datasetObj, c, p); })
                    .bind('column_name_dblclick', function(event, origEvent)
                        { columnNameEdit(datasetObj, event, origEvent); })
                    .bind('cellclick', function (e, r, c, o)
                        { cellClick(datasetObj, e, r, c, o); })
                    .blistTable({cellNav: true, selectionEnabled: false,
                        generateHeights: false, columnDrag: true,
                        editEnabled: datasetObj.settings.editEnabled,
                        headerMods: function (col)
                            { headerMods(datasetObj, col); },
                        rowMods: function (rows) { rowMods(datasetObj, rows); },
                        manualResize: datasetObj.settings.manualResize,
                        showGhostColumn: true, showTitle: false,
                        showRowHandle: datasetObj.settings.showRowHandle,
                        rowHandleWidth: 15,
                        showAddColumns: datasetObj.settings.showAddColumns,
                        rowHandleRenderer: function(col)
                            { return datasetObj.rowHandleRenderer(col) },
                        showRowNumbers: datasetObj.settings.showRowNumbers})
                    .blistModel()
                    .options({blankRow: datasetObj.settings.editEnabled,
                        filterMinChars: 0,
                        view: datasetObj.settings.view});

                $.live('#' + $datasetGrid.attr('id') +
                    ' .blist-table-row-handle', 'mouseover',
                        function (e) { hookUpRowMenu(datasetObj, this, e); });
                $.live('#' + $datasetGrid.attr('id') + ' .add-column', "click",
                    function() { datasetObj.settings.addColumnCallback(); });

                $.live('#' + $datasetGrid.attr('id') + ' .drillDown', 'click',
                    function(e){
                        e.preventDefault();
                        datasetObj.drillDown(this);
                    });

                $.live('#' + $datasetGrid.attr('id') +
                    ' .blist-table-row-numbers a', 'click',
                    function(e) { rowMenuHandler(datasetObj, e); });

                datasetObj.settings._model = $datasetGrid.blistModel();
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentGrid); }
                return this._$dom;
            },

            showHideTags: function(hide)
            {
                var datasetObj = this;
                _.each(datasetObj.settings.view.columnsForType('tag', true),
                    function(c)
                    {
                        c.setVisible(!hide,
                            function ()
                            {
                                if (!hide && c.position > 1)
                                { columnMove(datasetObj, c, 0); }
                            });
                    });
            },

            deleteColumns: function(columns, parCol)
            {
                var datasetObj = this;

                columns = $.makeArray(columns);
                var multiCols = columns.length > 1;
                if (confirm('Do you want to delete the ' +
                    (multiCols ? columns.length + ' selected columns' :
                        'selected column') + '? All data in ' +
                    (multiCols ? 'these columns' : 'this column') +
                    ' will be removed!'))
                {
                    if (!$.isBlank(parCol)) { parCol.removeChildColumns(columns); }
                    else { datasetObj.settings.view.removeColumns(columns); }
                }
            },

            drillDown: function(drillLink)
            {
                var datasetObj = this;

                var filterValue = $(drillLink).attr('cellvalue');
                var filterColumnId = parseInt($(drillLink).attr('column'), 10);
                var dataTypeName  = $(drillLink).attr('datatype');

                if ($.isBlank(filterColumnId) || filterValue == '')
                { return false; }

                var view = datasetObj.settings.view.cleanCopy();

                // Now construct our beautiful filter
                var filter;
                var columnJson = { columnId: filterColumnId,
                    type: 'column', value: dataTypeName };

                if (filterValue == 'null')
                {
                    filter = { type: 'operator', value: 'IS_BLANK',
                        children: [ columnJson ] };
                }
                else
                {
                    filter = { type: 'operator', value: 'EQUALS',
                        children: [
                            columnJson,
                            { type: 'literal',
                                value: $.unescapeQuotes(filterValue) }
                        ]
                    };
                }

                if ((view.query.filterCondition || {}).type == 'operator')
                {
                    if (view.query.filterCondition.value == 'AND')
                    {
                        if ($.isBlank(view.query.filterCondition.children))
                        {
                            view.query.filterCondition.children = [];
                        }
                        view.query.filterCondition.children.push(filter);
                    }
                    else
                    {
                        var existingQuery = view.query.filterCondition;
                        view.query.filterCondition =
                            { type: 'operator', value: 'AND',
                                children: [ existingQuery, filter ] };
                    }
                }
                else
                {
                    view.query.filterCondition = filter;
                }

                var drillDownCallBack = function(newView)
                {
                    datasetObj.settings.view.update(newView, true);
                };

                var otherGroupBys = _.select(view.query.groupBys || [], function(g)
                    { return g.columnId != filterColumnId; });

                // We need to hide the drilled col, persist other groupings
                if (otherGroupBys.length > 0)
                {
                    _.each(view.columns, function(c)
                    {
                        if (c.id == filterColumnId)
                        {
                            if (!c.flags) { c.flags = []; }
                            c.flags.push('hidden');
                            delete c.format.grouping_aggregate;
                            delete c.format.drill_down;
                        }
                    });

                    // Use all group bys except the current drill column
                    view.query.groupBys = otherGroupBys;
                    drillDownCallBack(view);
                }

                // Otherwise, grab parent's columns and replace
                else
                {
                    var currentColumns, parentColumns;

                    // Grab the child column who's tableColumnId is the same as
                    // parentCol
                    var getMatchingColumn = function(parentCol, childPool)
                    {
                        return _.detect(childPool, function(col)
                            { return col.tableColumnId ==
                                parentCol.tableColumnId; });
                    }

                    var revealDrillDownCallBack = function()
                    {
                        var translatedColumns = [];
                        _.each(parentColumns, function(oCol)
                        {
                            var newColumnMatch =
                                getMatchingColumn(oCol, currentColumns);
                            if (!$.isBlank(newColumnMatch))
                            {
                                var newCol = oCol.cleanCopy();
                                newCol.id = newColumnMatch.id;
                                if (!$.isBlank(newCol.childColumns))
                                {
                                    var newChildColumns = [];
                                    _.each(oCol.childColumns, function(oChildCol)
                                    {
                                        var nc = oChildCol.cleanCopy();
                                        nc.id = getMatchingColumn(oChildCol,
                                            newColumnMatch.childColumns).id;
                                        newChildColumns.push(nc);
                                    });
                                    newCol.childColumns = newChildColumns;
                                }
                                if (!$.isBlank(newCol.format))
                                {
                                    delete newCol.format.grouping_aggregate;
                                    delete newCol.format.drill_down;
                                }
                                translatedColumns.push(newCol);
                            }
                        });
                        view.columns = translatedColumns;
                        drillDownCallBack(view);
                    }
                    delete view.query.groupBys;

                    currentColumns = datasetObj.settings.view.realColumns;
                    if (datasetObj.settings.view.type == 'blist')
                    { parentColumns = datasetObj.settings.view.realColumns; }
                    if (!_.isUndefined(parentColumns))
                    { revealDrillDownCallBack(); }

                    if (datasetObj.settings.view.type != 'blist')
                    {
                        datasetObj.settings.view.getParentDataset(function(parDS)
                        {
                            if (!$.isBlank(parDS))
                            {
                                parentColumns = parDS.realColumns;
                                revealDrillDownCallBack();
                            }
                            else
                            {
                                // We can't get to the parent, so we're stuck with
                                // what we've got...
                                parentColumns =
                                    datasetObj.settings.view.realColumns;
                                revealDrillDownCallBack();
                            }
                        });
                    }
                }
            },

            /* Disables all normal interactions other than scrolling and hover
             * (view-only for data) */
            disable: function()
            {
                var datasetObj = this;
                if (datasetObj._disabled) { return; }
                datasetObj._disabled = true;

                datasetObj.$dom().blistTableAccessor().disable();
            },

            /* This re-enables the grid interactions */
            enable: function()
            {
                var datasetObj = this;
                if (!datasetObj._disabled) { return; }

                datasetObj.$dom().blistTableAccessor().enable();

                delete datasetObj._disabled;
            },

            rowHandleRenderer: function(col)
            {
                var isSubRow = !$.isBlank((col || {}).childColumns);
                var colAdjust = isSubRow ? ('_' + col.lookup) : '';

                return '(row.type == "blank" ? "" :' +
                       '"<a class=\'menuLink\' href=\'#row-menu_" + ' +
                       'row.id + "' + colAdjust + '\'></a>' +
                       '<ul class=\'menu rowMenu\' id=\'row-menu_" + row.id + "' +
                       colAdjust + '\'>" + ' +
                       (!isSubRow ?
                           '"<li class=\'pageView\'>' +
                           '<a href=\'' + this.settings.view.url +
                           '/" + row.id + "\' class=\'noInterstitial ' +
                           'noRedirPrompt\'>View Row</a></li>" + ' : '') +
                       (this.settings.editEnabled ?
                           ('(permissions.canEdit && !(row.level > 0) ? ' +
                           '"<li class=\'tags\'>' +
                           '<a href=\'#row-tag_" + row.id + "' + colAdjust +
                           '\' class=\'noClose\'>Tag Row</a>' +
                           '<form class=\'editContainer\'>' +
                           '<input />' +
                           '<a class=\'tagSubmit\' href=\'#saveTags\' ' +
                           'title=\'Save\'>Save Tags</a>' +
                           '<a class=\'tagCancel\' href=\'#cancelTags\' ' +
                           'title=\'Cancel\'>Cancel</a>' +
                           '</form>' +
                           '</li>" : "") + ' +
                           '(permissions.canDelete ? "<li class=\'delete\'>' +
                           '<a href=\'#row-delete_" + row.id + "' + colAdjust +
                           '\'>Delete Row</a></li>" : "") + ') : '') +
                       '"<li class=\'footer\'><div class=\'outerWrapper\'>' +
                       '<div class=\'innerWrapper\'>' +
                       '<span class=\'colorWrapper\'>' +
                       '</span></div>' +
                       '</div></li>' +
                       '</ul>")';
            }
        }
    });

    var hookUpRowMenu = function(datasetObj, curCell, e)
    {
        var $cell = $(curCell);
        if (!$cell.data('row-menu-applied'))
        {
            var $menu = $cell.find('ul.menu');
            $menu.dropdownMenu({
                menuContainerSelector: ".blist-table-row-handle",
                triggerButtonSelector: "a.menuLink",
                openCallback: function ($menu)
                    { rowMenuOpenCallback(datasetObj, $menu); },
                linkCallback: function (e)
                    { rowMenuHandler(datasetObj, e); },
                pullToTop: true
            });

            $menu.find('li.tags .editContainer a').click(function(e)
            {
                e.preventDefault();
                var $link = $(e.currentTarget);
                // Href that we care about starts with # and parts are
                // separated with _ IE sticks the full thing, so slice
                // everything up to #
                var href = $link.attr('href');
                switch(href.slice(href.indexOf('#') + 1))
                {
                    case 'saveTags':
                        submitRowTagsMenu(datasetObj, $menu);
                        break;
                    case 'cancelTags':
                        hideRowTagsMenu($menu);
                        break;
                }
            });

            $menu.find('li.tags .editContainer input').keypress(function(e)
            {
                if (e.keyCode == 27) // ESC
                {
                    hideRowTagsMenu($menu);
                    $menu.focus();
                }
            });

            $menu.find('li.tags form.editContainer').submit(function(e)
            {
                e.preventDefault();
                submitRowTagsMenu(datasetObj, $menu);
            });

            $cell.data('row-menu-applied', true);
        }
    };

    var submitRowTagsMenu = function(datasetObj, $menu)
    {
        $menu.trigger('close');

        var newVal = $.map($menu.find('li.tags .editContainer input')
            .val().split(','), function(t, i) { return $.trim(t); });
        var row = datasetObj.settings.view
            .rowForID($menu.attr('id').split('_')[1]);
        if ($.compareValues(row.tags, newVal)) { return; }

        datasetObj.settings.view.setRowValue(newVal, row.id, 'tags');
        datasetObj.settings.view.saveRow(row.id);

        var column = datasetObj.settings.view.columnsForType('tag', true)[0];
        if (column.hidden) { datasetObj.showHideTags(false); }
    };

    var hideRowTagsMenu = function($menu)
    { $menu.removeClass('tagsShown'); };

    var rowMenuOpenCallback = function(datasetObj, $menu)
    {
        $menu.find('li.tags, li.pageView')
            .toggle(!datasetObj.settings._model.hasSelectedRows());
        hideRowTagsMenu($menu);
    };

    /* Handle clicks in the row menus */
    var rowMenuHandler = function(datasetObj, event)
    {
        event.preventDefault();
        var $link = $(event.currentTarget);
        var href = $link.attr('href');
        var hashIndex = href.indexOf('#');

        var action;
        var rowId;
        // If # isn't present, but ends with /\d+ then it is a row URL
        if (hashIndex < 0 && !$.isBlank(href.match(/\/\d+$/)))
        {
            action = 'view-row';
            rowId = href.slice(href.lastIndexOf('/') + 1);
        }
        else
        {
            // Href that we care about starts with # and parts are separated with _
            // IE sticks the full thing, so slice everything up to #
            var s = href.slice(hashIndex + 1).split('_');
            if (s.length < 2)
            { return; }

            action = s[0];
            rowId = s[1];
        }

        var $menu = $link.closest('.rowMenu');
        var model = datasetObj.settings._model;
        switch (action)
        {
            case 'row-delete':
                if (!$.isBlank(s[2]))
                {
                    var col = datasetObj.settings.view.columnForID(s[2]);
                    model.removeChildRows(model.getByID(rowId), col);
                }
                else
                {
                    model.selectRow(datasetObj.settings.view.rowForID(rowId));
                    model.removeRows(_.keys(model.selectedRows));
                }
                break;
            case 'row-tag':
                var row = datasetObj.settings.view.rowForID(
                    $menu.attr('id').split('_')[1]);
                $menu.find('li.tags .editContainer input')
                    .val(row.tags ? row.tags.join(', ') : '');

                $link.closest('.rowMenu').toggleClass('tagsShown');
                $menu.find('li.tags .editContainer input').focus().select();
                break;

            case 'view-row':
                $(document).trigger(blist.events.DISPLAY_ROW, [rowId]);
                break;
        }
    };

    var cellClick = function(datasetObj, event, row, column, origEvent)
    {
        var model = datasetObj.settings._model;
        if (!column || row.level > 0) { return; }
        if (column.id == 'rowNumberCol')
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
            datasetObj.settings.addColumnCallback(column.id);
        }
    };

    var rowMods = function(datasetObj, renderedRows)
    {
        _.each(renderedRows, function(r)
        {
            var $row = $(r.row);

            if (!$row.is('.blist-tr-open')) { return true; }
            $row.find('.blist-tdh[colId]')
                .each(function(i, tdh)
                {
                    var $tdh = $(tdh);
                    if ($tdh.find('a.menuLink').length > 0) { return true; }
                    var parColId = $tdh.attr('parentColId');
                    var parCol = datasetObj.settings.view.columnForID(parColId);
                    if (!$.isBlank(parCol))
                    {
                        var colId = $tdh.attr('colId');
                        var col = parCol.childColumnForID(colId);
                        if (!$.isBlank(col))
                        { setupHeader(datasetObj, col, $tdh, false); }
                    }
                });
        });
    };

    var setupHeader = function(datasetObj, col, $col, tipsRef)
    {
        createHeaderMenu(datasetObj, col, $col);

        if (tipsRef)
        {
            blist.datasetControls.columnTip(col, $col, tipsRef, true);
            $col.find('.menuLink').socrataTip({message: 'Click for Menu',
                    parent: 'body'});
        }
    };

    /* Callback when rendering the grid headers.  Set up column on-object menus */
    var headerMods = function(datasetObj, col)
    {
        if (!datasetObj.settings._colTips) { datasetObj.settings._colTips = {}; }
        setupHeader(datasetObj, col, $(col.dom), datasetObj.settings._colTips);
    };

    var createHeaderMenu = function(datasetObj, col, $colDom)
    {
        var isNested = !$.isBlank(col.parentColumn);
        // Create an object containing flags describing what should be present
        // in the menu
        var features = {};

        if (!isNested && col.renderType.sortable) { features.sort = true; }


        if (!isNested && col.renderType.filterable &&
            !datasetObj.settings.view.isGrouped())
        { features.filter = true; }


        if (datasetObj.settings.columnDeleteEnabled &&
            col.renderType.deleteable &&
            (!datasetObj.settings.view.isGrouped() ||
                !_.any(datasetObj.settings.view.query.groupBys, function(g)
                    { return g.columnId == col.id; })))
        { features.remove = true; }


        if (datasetObj.settings.columnPropertiesEnabled)
        { features.properties = true; }


        // If we did not enable features, do not install the menu
        var haveFeatures = false;
        for (var x in features)
        {
            haveFeatures = true;
            break;
        }
        if (!haveFeatures) { return; }

        var hrefId = col.id;
        if (isNested) { hrefId += '_' + col.parentColumn.id; }

        // Install the menu indicator DOM elements
        $colDom.append('<a class="menuLink action-item" href="#column-menu_' +
            hrefId + '"></a>');

        // Install an event handler that actually builds the menu on first
        // mouse over
        $colDom.one('mouseover', function()
        {
            if ($colDom.find('ul.menu').length > 0) { return; }
            var htmlStr =
                '<ul class="menu columnHeaderMenu action-item" id="column-menu_' +
                hrefId + '">';

            // Render sorting
            if (features.sort)
            {
                htmlStr +=
                    '<li class="sortAsc singleItem">' +
                    '<a href="#column-sort-asc_' + hrefId + '">' +
                    '<span class="highlight">Sort Ascending</span>' +
                    '</a>' +
                    '</li>' +
                    '<li class="sortDesc singleItem">' +
                    '<a href="#column-sort-desc_' + hrefId + '">' +
                    '<span class="highlight">Sort Descending</span>' +
                    '</a>' +
                    '</li>' +
                    '<li class="sortClear singleItem">' +
                    '<a href="#column-sort-clear_' + hrefId + '">' +
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
            htmlStr += '<li class="hideCol" >' +
                '<a href="#hide-column_' + hrefId + '">' +
                '<span class="highlight">Hide Column</span>' +
                '</a></li>';

            if (features.remove)
            {
                htmlStr += '<li class="delete" >' +
                    '<a href="#delete-column_' + hrefId + '">' +
                    '<span class="highlight">Delete Column</span>' +
                    '</a></li>';
            }

            if (features.properties)
            {
                // There are already display items in the list, so we need to add
                // a separator.
                htmlStr += '<li class="separator singleItem" />';
                htmlStr += '<li class="properties singleItem">' +
                    '<a href="#edit-column_' + hrefId + '">' +
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
            hookUpHeaderMenu(datasetObj, col, $colDom, $menu);
        });
    };

    /* Hook up JS behavior for menu.  This is safe to be applied multiple times */
    var hookUpHeaderMenu = function(datasetObj, col, $colHeader, $menu)
    {
        $menu.dropdownMenu({triggerButton: $colHeader.find('a.menuLink'),
                    openCallback: function ($menu)
                        { columnMenuOpenCallback(datasetObj, col,
                            $colHeader, $menu); },
                    linkCallback: function (e)
                        { columnHeaderMenuHandler(datasetObj, e); },
                    forcePosition: true, pullToTop: true})
            .find('.autofilter ul.menu').scrollable();
    };

    var columnMenuOpenCallback = function(datasetObj, col, $colHeader, $menu)
    {
        if ($colHeader.isSocrataTip()) { $colHeader.socrataTip().hide(); }

        var selCols = $(datasetObj.currentGrid).blistTableAccessor()
            .getSelectedColumns();
        var numSel = _.size(selCols);

        if (numSel < 1 || (numSel == 1 && !$.isBlank(selCols[col.id])))
        {
            $menu.find('.singleItem').show();
            loadFilterMenu(datasetObj, col, $menu);

            $menu.find('.sortAsc').toggle(!col.sortAscending);
            $menu.find('.sortDesc').toggle($.isBlank(col.sortAscending) ||
                col.sortAscending);
            $menu.find('.sortClear').toggle(!$.isBlank(col.sortAscending));
        }
        else
        {
            $menu.find('.singleItem').hide();
        }
    };

    var loadFilterMenu = function(datasetObj, col, $menu)
    {
        if (!$.isBlank(col.parentColumn) || !col.renderType.filterable ||
            datasetObj.settings.view.isGrouped())
        { return; }

        // Remove the old filter menu if necessary
        $menu.children('.autofilter').prev('.separator').andSelf().remove();

        var spinnerStr = '<li class="autofilter loading"></li>';
        // Find the correct spot to add it; either after sort descending, or
        // the top
        var $sortItem = $menu.find('li.filterSeparator');
        if ($sortItem.length > 0) { $sortItem.before(spinnerStr); }
        else { $menu.prepend(spinnerStr); }

        _.defer(function()
        {
            col.getSummary(function (sum)
                { addFilterMenu(datasetObj, col, $menu, sum); });
        });
    };

    /* Add auto-filter sub-menu for a particular column that we get from the JS
     * grid */
    var addFilterMenu = function(datasetObj, col, $menu, summary)
    {
        // If this column doesn't have a dom, we don't support it yet...
        if (!col.dom) { return; }

        // Remove spinner
        $menu.children('.autofilter.loading').remove();

        // Remove the old filter menu if necessary
        $menu.children('.autofilter').prev('.separator').andSelf().remove();

        if ($.isBlank(col.currentFilter) && $.isBlank(summary)) { return; }

        var filterStr =
            '<li class="autofilter submenu singleItem">' +
            '<a class="submenuLink" href="#">' +
            '<span class="highlight">Filter This Column</span></a>' +
            '<ul class="menu optionMenu">';
        // If we already have a filter for this column, give them a clear link
        if (!$.isBlank(col.currentFilter))
        {
            filterStr +=
                '<li class="clearFilter">' +
                '<a href="#clear-filter-column_' + col.id + '">' +
                '<span class="highlight">Clear Column Filter</span>' +
                '</a>' +
                '</li>';
            if ($.isBlank(summary))
            {
                summary = {curVal: { topFrequencies:
                    [{value: col.currentFilter.value, count: 0}] } };
            }
        }
        // Previous button for scrolling
        filterStr +=
            '<li class="button prev"><a href="#prev" title="Previous">' +
            '<div class="outerWrapper"><div class="midWrapper">' +
            '<span class="innerWrapper">Previous</span>' +
            '</div></div>' +
            '</a></li>';

        // Sort type keys in a specific order for URL and phone
        var typeKeys = _.keys(summary);
        if (col.renderTypeName == 'url')
        { typeKeys.sort(); }
        else if (col.renderTypeName == 'phone')
        { typeKeys.sort().reverse(); }

        var sumSections = [];
        _.each(typeKeys, function(k)
        {
            var cs = summary[k];
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

            if (!$.isBlank(cs.topFrequencies))
            {
                // First loop through and set up variations on the value
                // to use in the menu
                _.each(cs.topFrequencies, function (f)
                    {
                        f.isMatching = !$.isBlank(col.currentFilter) &&
                            col.currentFilter.value == f.value;
                        var curType = col.renderType;
                        f.escapedValue = escape(
                            _.isFunction(curType.filterValue) ?
                                curType.filterValue(f.value) :
                                $.htmlStrip(f.value + ''));
                        f.renderedValue =
                            _.isFunction(curType.filterRender) ?
                                curType.filterRender(f.value, col,
                                    cs.subColumnType) :
                                '';
                        f.titleValue = $.htmlStrip(f.renderedValue + '');
                    });

                cs.topFrequencies.sort(searchMethod);

                // Add an option for each filter item
                _.each(cs.topFrequencies, function (f)
                    {
                        if (f.renderedValue === '') { return true; }
                        // Add an extra | at the end of the URL in case there
                        // are spaces at the end of the value, which IE7
                        // automatically strips off, leading to a failure
                        // of autofilter
                        section +=
                            '<li class="filterItem' +
                            (f.isMatching ? ' active' : '') +
                            ' scrollable">' +
                                '<a href="' +
                                (f.isMatching ? '#clear-filter-column_' :
                                    '#filter-column_') +
                                col.id + '_' + cs.subColumnType + ':' +
                                f.escapedValue + '|" title="' +
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
        hookUpHeaderMenu(datasetObj, col, $(col.dom), $menu);
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
        switch (action)
        {
            case 'column-sort-asc':
                datasetObj.$dom().trigger('column_sort',
                    [datasetObj.settings.view.columnForID(colIdIndex), true]);
                break;
            case 'column-sort-desc':
                datasetObj.$dom().trigger('column_sort',
                    [datasetObj.settings.view.columnForID(colIdIndex), false]);
                break;
            case 'column-sort-clear':
                datasetObj.$dom().trigger('column_sort',
                    [datasetObj.settings.view.columnForID(colIdIndex), null]);
                break;
            case 'filter-column':
                // Rejoin remainder of parts in case the filter value had _
                // The sub-column type is separated by a colon, so split on that,
                // pull it off, then rejoin the remainder.  Finally, strip off
                // the ending | in case there are spaces at the end of the value
                var p = s.slice(2).join('_').split(':');
                datasetObj.settings.view.columnForID(colIdIndex).filter(
                    unescape(p.slice(1).join(':').slice(0, -1)), p[0]);
                break;
            case 'clear-filter-column':
                datasetObj.$dom().trigger('clear_filter',
                    [datasetObj.settings.view.columnForID(colIdIndex)]);
                break;
            case 'hide-column':
                if (s.length > 2)
                {
                    var parCol = datasetObj.settings.view.columnForID(s[2]);
                    parCol.childColumnForID(colIdIndex).hide();
                }

                else
                {
                    var selHideCols = $(datasetObj.currentGrid)
                        .blistTableAccessor().getSelectedColumns();
                    selHideCols[colIdIndex] = true;
                    _.each(selHideCols, function(v, colId)
                    {
                        datasetObj.settings.view.columnForID(colId)
                            .hide(null, null, true);
                    });
                    if (!$.socrataServer.runRequests({success: function()
                                { datasetObj.settings.view.updateColumns(); }}))
                    { datasetObj.settings.view.updateColumns(); }
                }
                break;
            case 'delete-column':
                if (s.length > 2)
                {
                    var parCol = datasetObj.settings.view.columnForID(s[2]);
                    datasetObj.deleteColumns(colIdIndex, parCol);
                }

                else
                {
                    var selCols = $(datasetObj.currentGrid).blistTableAccessor()
                        .getSelectedColumns();
                    selCols[colIdIndex] = true;
                    datasetObj.deleteColumns(_.keys(selCols));
                }
                break;
            case 'edit-column':
                datasetObj.settings.editColumnCallback(colIdIndex, s[2]);
                break;
        }
    };


    var columnResized = function(datasetObj, col, isFinished)
    {
        if (isFinished)
        {
            if (!datasetObj.settings.view.temporary)
            { datasetObj.settings.view.save(); }
        }
    };

    var columnSorted = function(datasetObj, column, ascending)
    {
        var query = $.extend(true, {}, datasetObj.settings.view.query);
        if ($.isBlank(ascending))
        {
            query.orderBys = _.reject(query.orderBys || [], function(ob)
                { return ob.expression.columnId == column.id; });
            if (query.orderBys.length == 0) { delete query.orderBys; }
        }
        else
        {
            query.orderBys = [{expression: {columnId: column.id, type: 'column'},
                        ascending: ascending}];
        }

        datasetObj.settings.view.update({query: query}, false,
                (query.orderBys || []).length < 2);
    };

    var clearColumnFilter = function(datasetObj, col)
    {
        if ($(col.dom).isSocrataTip()) { $(col.dom).socrataTip().hide(); }
        col.clearFilter();
    };

    var columnMove = function(datasetObj, col, newPos)
    {
        var visColIds = _.pluck(datasetObj.settings.view.visibleColumns, 'id');
        var oldPos = _.indexOf(visColIds, col.id);
        // Stick the column in the new spot, then remove it from the old
        visColIds.splice(newPos, 0, col.id);
        visColIds.splice((newPos < oldPos ? oldPos + 1 : oldPos), 1);

        datasetObj.settings.view.setVisibleColumns(visColIds, null,
            datasetObj.settings.view.temporary);
    };

    var columnNameEdit = function(datasetObj, event, origEvent)
    {
        if (!datasetObj.settings.columnNameEdit ||
            datasetObj.settings.view.temporary)
        { return; }

        var $target = $(origEvent.currentTarget).find('.blist-th-name');
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

        var col = datasetObj.settings.view.columnForID($th.data('column').id);
        col.update({name: newName});
        $input.attr('disabled', 'disabled');

        col.save(function(newCol) { columnEditEnd(datasetObj, $th); },
            function(xhr)
            {
                var errBody = JSON.parse(xhr.responseText);
                alert(errBody.message);
                $th.addClass('error');
                $input.removeAttr('disabled');
            });
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

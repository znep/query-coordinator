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
            columnHideEnabled: true,
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
                    .bind('column_moved', function (event, c, p)
                        { columnMove(datasetObj, c, p); })
                    .bind('column_name_dblclick', function(event, origEvent)
                        { columnNameEdit(datasetObj, event, origEvent); })
                    .bind('cellclick', function (e, r, c, o)
                        { cellClick(datasetObj, e, r, c, o); })
                    .bind('comment_click', function(e, rId, cId)
                        { commentClick(datasetObj, rId, cId); })
                    .blistTable({cellNav: true, selectionEnabled: false,
                        generateHeights: false, columnDrag: true,
                        editEnabled: datasetObj.settings.editEnabled,
                        headerMods: function (col)
                            { headerMods(datasetObj, col); },
                        rowMods: function (rows) { rowMods(datasetObj, rows); },
                        manualResize: datasetObj.settings.manualResize,
                        showGhostColumn: true,
                        cellComments: _.isFunction(datasetObj.settings.cellCommentsCallback),
                        showRowHandle: datasetObj.settings.showRowHandle,
                        rowHandleWidth: 15,
                        showAddColumns: datasetObj.settings.showAddColumns,
                        rowHandleRenderer: function()
                            { return datasetObj.rowHandleRenderer.apply(datasetObj, arguments) },
                        showRowNumbers: datasetObj.settings.showRowNumbers})
                    .blistModel()
                    .options({blankRow: datasetObj.settings.editEnabled,
                        filterMinChars: 0});

                $.live('#' + $datasetGrid.attr('id') +
                    ' .blist-table-row-handle', 'mouseover',
                        function (e) { hookUpRowMenu(datasetObj, this, e); });
                $.live('#' + $datasetGrid.attr('id') + ' .add-column', "click",
                    function() { datasetObj.settings.addColumnCallback(); });

                if ($.device.mobile)
                {
                    $.live('#' + $datasetGrid.attr('id') + ' .drillDown', 'touchend',
                        function(){
                            datasetObj.drillDown(this);
                        });
                }

                $.live('#' + $datasetGrid.attr('id') + ' .drillDown', 'click',
                    function(e){
                        e.preventDefault();
                        datasetObj.drillDown(this);
                    });

                $.live('#' + $datasetGrid.attr('id') +
                    ' .blist-table-row-numbers a', 'click',
                    function(e) { rowMenuHandler(datasetObj, e); });

                datasetObj._model = $datasetGrid.blistModel();

                datasetObj.setView(datasetObj.settings.view);

                $(document).bind('cell_feed_shown', function(e, rowId, tcId)
                {
                    $(datasetObj.currentGrid).blistTableAccessor().setCommentCell(rowId, tcId);
                });
                $(document).bind('cell_feed_hidden', function(e, rowId, tcId)
                {
                    $(datasetObj.currentGrid).blistTableAccessor().clearCommentCell(rowId, tcId);
                });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentGrid); }
                return this._$dom;
            },

            setView: function(newView)
            {
                this._view = newView;
                this._model.options({view: newView});
            },

            isValid: function()
            {
                return !$.isBlank(this._view);
            },

            drillDown: function(drillLink)
            {
                var datasetObj = this;

                var filterValue = $(drillLink).attr('cellvalue');
                var filterColumnId = parseInt($(drillLink).attr('column'), 10);
                var dataTypeName  = $(drillLink).attr('datatype');

                if ($.isBlank(filterColumnId) || filterValue == '')
                { return false; }

                var view = datasetObj._view.cleanCopy();

                // Now construct our beautiful filter
                var filter;
                var columnJson = { columnId: filterColumnId,
                    type: 'column', value: dataTypeName };

                if (filterValue == 'null' || filterValue == 'undefined')
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

                view.query.namedFilters = view.query.namedFilters || {};
                view.query.namedFilters['drillDown-' + filterColumnId] = filter;

                var drillDownCallBack = function(newView)
                {
                    datasetObj._view.update(newView, true);
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

                    currentColumns = datasetObj._view.realColumns;
                    if (datasetObj._view.type == 'blist')
                    { parentColumns = datasetObj._view.realColumns; }
                    if (!_.isUndefined(parentColumns))
                    { revealDrillDownCallBack(); }

                    if (datasetObj._view.type != 'blist')
                    {
                        datasetObj._view.getParentDataset(function(parDS)
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
                                    datasetObj._view.realColumns;
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

            rowHandleRenderer: function(html, index, renderIndex, row, col, context)
            {
                var isSubRow = !$.isBlank((col || {}).childColumns);
                var colAdjust = isSubRow ? ('_' + col.lookup) : '';

                var options = [];
                if (!isSubRow)
                {
                    options.push('<li class="pageView"><a href="', this._view.url, '/', row.id,
                            '" class="noInterstitial noRedirPrompt">' + $.t('controls.grid.view_single_row') + '</a></li>');
                }
                if (this.settings.editEnabled && context.permissions.canDelete)
                {
                    options.push('<li class="delete"><a href="#row-delete_',
                            row.id, colAdjust, '">' + $.t('controls.grid.delete_row') + '</a></li>');
                }

                if (_.isEmpty(options) || row.type == 'blank') { return; }

                html.push('<a class="menuLink" href="#row-menu_',
                        row.id, colAdjust, '"></a>',
                       '<ul class="menu rowMenu" id="row-menu_', row.id,
                       colAdjust, '">', options.join(''),
                       '<li class="footer"><div class="outerWrapper">',
                       '<div class="innerWrapper"><span class="colorWrapper"></span></div>',
                       '</div></li></ul>');
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

            $cell.data('row-menu-applied', true);
        }
    };

    var rowMenuOpenCallback = function(datasetObj, $menu)
    {
        // clint 05 apr 2013: seems this was added to account for multirow select,
        // but it behaves correctly in that case anyway (shows the row you open
        // the menu for) so i'm going to take this out.
        //$menu.find('li.pageView').toggle(!datasetObj._model.hasSelectedRows());
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
        var model = datasetObj._model;
        switch (action)
        {
            case 'row-delete':
                if (!$.isBlank(s[2]))
                {
                    var col = datasetObj._view.columnForID(s[2]);
                    model.removeChildRows(model.getByID(rowId), col);
                }
                else
                {
                    var selRows = _.keys((datasetObj._view.highlightTypes || {}).select);
                    selRows.push(rowId);
                    model.removeRows(selRows);
                }
                break;

            case 'view-row':
                $(document).trigger(blist.events.DISPLAY_ROW, [rowId]);
                break;
        }
    };

    var cellClick = function(datasetObj, event, row, column, origEvent)
    {
        var model = datasetObj._model;
        if (row.level > 0) { return; }
        // Handle clicks on ghost column
        if ($.isBlank(column) || column.id == 'rowNumberCol')
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

    var commentClick = function(datasetObj, rowId, tcId)
    {
        if (_.isFunction(datasetObj.settings.cellCommentsCallback))
        { datasetObj.settings.cellCommentsCallback(rowId, tcId); }
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
                    var parCol = datasetObj._view.columnForID(parColId);
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
        var $menuLink = $.tag({tagName: 'a', 'class': ['menuLink', 'action-item'],
            'href': '#column-menu'});
        $col.append($menuLink);

        $col.columnMenu({column: col, $menuTrigger: $menuLink,
            columnDeleteEnabled: datasetObj.settings.columnDeleteEnabled,
            columnHideEnabled: datasetObj.settings.columnHideEnabled,
            columnPropertiesEnabled: datasetObj.settings.columnPropertiesEnabled,
            editColumnCallback: datasetObj.settings.editColumnCallback,
            selectedColumns: function()
            {
                return $(datasetObj.currentGrid).blistTableAccessor()
                    .getSelectedColumns();
            },
            view: datasetObj._view});

        if (tipsRef)
        {
            blist.datasetControls.columnTip(col, $col, tipsRef, true);
            $col.find('.menuLink').socrataTip({message: $.t('controls.grid.click_for_menu'),
                    parent: 'body'});
        }
    };

    /* Callback when rendering the grid headers.  Set up column on-object menus */
    var headerMods = function(datasetObj, col)
    {
        if (!datasetObj.settings._colTips) { datasetObj.settings._colTips = {}; }
        setupHeader(datasetObj, col, $(col.dom), datasetObj.settings._colTips);
    };

    var columnSorted = function(datasetObj, column, ascending)
    {
        $(column.dom).columnMenu().sort(ascending);
    };

    var clearColumnFilter = function(datasetObj, col)
    {
        $(col.dom).columnMenu().clearFilter();
    };

    var columnMove = function(datasetObj, col, newPos)
    {
        var visColIds = _.pluck(datasetObj._view.visibleColumns, 'id');
        var oldPos = _.indexOf(visColIds, col.id);
        // Stick the column in the new spot, then remove it from the old
        visColIds.splice(newPos, 0, col.id);
        visColIds.splice((newPos < oldPos ? oldPos + 1 : oldPos), 1);

        datasetObj._view.setVisibleColumns(visColIds, null,
            datasetObj._view.temporary);
    };

    var columnNameEdit = function(datasetObj, event, origEvent)
    {
        if (!datasetObj.settings.columnNameEdit ||
            datasetObj._view.temporary)
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
            alert($.t('controls.grid.must_enter_name'));
            $th.addClass('error');
            return;
        }

        var origName = $th.find('.blist-th-name').text();
        if (origName == newName)
        {
            columnEditEnd(datasetObj, $th);
            return;
        }

        var col = datasetObj._view.columnForID($th.data('column').id);
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

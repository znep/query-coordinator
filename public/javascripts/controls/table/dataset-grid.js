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

                var $dl = $(drillLink);
                var filterValue = $dl.attr('cellvalue');
                var filterColumn = datasetObj._view.columnForIdentifier($dl.attr('column'));

                if ($.isBlank(filterColumn) || filterValue == '')
                { return false; }

                var view = datasetObj._view.cleanCopy();

                // Now construct our beautiful filter
                var filter;
                var columnJson = { columnFieldName: filterColumn.fieldName,
                    subColumn: filterColumn.renderTypeName };

                if (filterValue == 'null' || filterValue == 'undefined')
                {
                    filter = $.extend({ operator: 'IS_BLANK' }, columnJson);
                }
                // We only know how to handle date groupings for now
                else if (!$.isBlank(filterColumn.format.group_function) &&
                        filterColumn.format.group_function.startsWith('date_'))
                {
                    var groupFunc = filterColumn.format.group_function;
                    // Assume these start at midnight, the first day, and first month (as appropriate)
                    var lowValue = !$.isBlank(filterColumn.renderType.stringParse) ?
                        Date.parseExact(filterValue, filterColumn.renderType.stringParse) :
                        new Date(parseInt(filterValue) * 1000);
                    // Handle timezones in some browsers
                    if (lowValue.getHours() != 0)
                    { lowValue.setMinutes(lowValue.getMinutes() + lowValue.getTimezoneOffset()); }
                    var highValue = lowValue.clone();
                    lowValue.setSeconds(-1);
                    if (groupFunc.endsWith('_y'))
                    { highValue.setYear(highValue.getFullYear() + 1); }
                    if (groupFunc.endsWith('_ym'))
                    { highValue.setMonth(highValue.getMonth() + 1); }
                    else if (groupFunc.endsWith('_ymd'))
                    { highValue.setHours(24); }

                    lowValue = !$.isBlank(filterColumn.renderType.stringFormat) ?
                        lowValue.toString(filterColumn.renderType.stringFormat) :
                        lowValue.getTime() / 1000;
                    highValue = !$.isBlank(filterColumn.renderType.stringFormat) ?
                        highValue.toString(filterColumn.renderType.stringFormat) :
                        highValue.getTime() / 1000;
                    filter = { operator: 'AND', children: [
                        $.extend({ operator: 'GREATER_THAN',
                            value: filterColumn.renderType.filterValue(lowValue) }, columnJson),
                        $.extend({ operator: 'LESS_THAN',
                            value: filterColumn.renderType.filterValue(highValue) }, columnJson)
                        ] };
                }
                else
                {
                    filter = $.extend({ operator: 'EQUALS', value: $.unescapeQuotes(filterValue) },
                            columnJson);
                }

                view.metadata.jsonQuery.namedFilters = view.metadata.jsonQuery.namedFilters || {};
                view.metadata.jsonQuery.namedFilters['drillDown-' + filterColumn.fieldName] =
                    { where: filter };

                var drillDownCallBack = function(newView)
                {
                    datasetObj._view.update(newView, true);
                };

                var otherGroupBys = _.select(view.metadata.jsonQuery.group || [], function(g)
                    { return g.columnFieldName != filterColumn.fieldName; });

                // We need to hide the drilled col, persist other groupings
                if (otherGroupBys.length > 0)
                {
                    _.each(view.columns, function(c)
                    {
                        if (c.fieldName == filterColumn.fieldName)
                        {
                            if (!c.flags) { c.flags = []; }
                            c.flags.push('hidden');
                            delete c.format.grouping_aggregate;
                            delete c.format.drill_down;
                            if (!$.isBlank(c.format.group_function))
                            {
                                delete c.format.group_function
                                c.format.view = Column.closestViewFormat(filterColumn, c);
                            }
                        }
                    });

                    // Use all group bys except the current drill column
                    view.metadata.jsonQuery.group = otherGroupBys;
                    drillDownCallBack(view);
                }

                // Otherwise, grab parent's columns and replace
                else
                {
                    var currentColumns, parentColumns;

                    // Clear out all grouping aggregates
                    view.metadata.jsonQuery.select = [];

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
                                    if (!$.isBlank(newCol.format.group_function))
                                    {
                                        delete newCol.format.group_function;
                                        newCol.format.view = Column.closestViewFormat(filterColumn, newCol);
                                    }
                                }
                                translatedColumns.push(newCol);
                            }
                        });
                        view.columns = translatedColumns;
                        drillDownCallBack(view);
                    }
                    delete view.metadata.jsonQuery.group;

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

                //Add DOM for menu drop-down options
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

            $menuLink = $cell.find('.menuLink');

            //Too many hovers are triggered!
            /*var tip = $cell.socrataTip(
                {message: 'Menu', parent: 'body', shrinkToFit : true, trigger: 'hover', isSolo: false});*/

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
                    model.removeRows(rowId);
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
                    if ($tdh.hasClass('setup')) { return true; }
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
        //Configure flyout HTML and events for column menu button
        var nested = $col.hasClass('blist-tdh');

        var $menuLink = $col.find('.menuLink'); 

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

        
        var tip = $col.find('.menuLink').socrataTip({message: $.t('controls.grid.menu'),
                  parent: 'body', shrinkToFit : true, trigger: 'hover', isSolo: false});
            
        $menuLink.click(function() { 
            tip.hide();
        });

        $col.addClass('setup');

        var $infoButton = $col.find('.info-button');
        var $infoWrapper = $col.find('.button-wrapper');


        //Hover on header cell
        if (col.renderType.sortable && !nested) {
            $col.find('.blist-th-name').socrataTip({trigger: 'hover', message: $.t('controls.grid.click_to_sort'), 
                                                    parent: 'body', isSolo: true});
        }

        if (tipsRef || nested) { 
            var tooltipContent = blist.datasetControls.getColumnTip(col); 
            //Click functionality for main tip box
            $infoWrapper.socrataTip({content: tooltipContent, trigger: 'mouseenter click', parent: 'body', isSolo: true,
                shownCallback : 
                    function () {
                        $($infoWrapper.socrataTip()._tipBox).mouseleave(
                            function() { $($infoWrapper.socrataTip().hide()); }
                        );
                    }
            });

        }

        //Prevent hovertip from persisting behind the main info box after an icon click.
        $infoWrapper.click( function() {
            $infoButton.socrataTip().quickHide();
        });
    };

    /* Callback when rendering the grid headers. Set up column on-object menus */
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

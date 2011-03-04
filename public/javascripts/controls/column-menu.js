(function($)
{
    $.fn.columnMenu = function(options)
    {
        // Check if object was already created
        var columnMenu = $(this[0]).data("columnMenu");
        if (!columnMenu)
        {
            columnMenu = new columnMenuObj(options, this[0]);
        }
        return columnMenu;
    };

    var columnMenuObj = function(options, dom)
    {
        this.settings = $.extend({}, columnMenuObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(columnMenuObj,
    {
        defaults:
        {
            column: null,
            $menuTrigger: null,
            selectedColumns: null,
            $tipItem: null,
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var cmObj = this;
                var $domObj = cmObj.$dom();
                $domObj.data("columnMenu", cmObj);

                if ($.isBlank(cmObj.settings.$menuTrigger))
                { cmObj.settings.$menuTrigger = $domObj; }
                if ($.isBlank(cmObj.settings.$tipItem))
                { cmObj.settings.$tipItem = $domObj; }

                var col = cmObj.settings.column;
                var isNested = !$.isBlank(col.parentColumn);
                // Create an object containing flags describing what should be
                // present in the menu
                var features = {};

                if (!isNested && col.renderType.sortable) { features.sort = true; }


                if (!isNested && col.renderType.filterable &&
                    !cmObj.settings.view.isGrouped())
                { features.filter = true; }


                if (cmObj.settings.columnDeleteEnabled &&
                    col.renderType.deleteable &&
                    (!cmObj.settings.view.isGrouped() ||
                        !_.any(cmObj.settings.view.query.groupBys, function(g)
                            { return g.columnId == col.id; })))
                { features.remove = true; }


                if (cmObj.settings.columnPropertiesEnabled)
                { features.properties = true; }


                // If we did not enable features, do not install the menu
                if (_.isEmpty(features)) { return; }

                // Install an event handler that actually builds the menu on first
                // mouse over
                $domObj.one('mouseover', function()
                {
                    if ($domObj.find('ul.menu').length > 0) { return; }
                    var menu = {tagName: 'ul', 'class': ['menu',
                        'columnHeaderMenu', 'action-item'],
                        id: 'column-menu', contents: []};

                    // Render sorting
                    if (features.sort)
                    {
                        menu.contents.push({tagName: 'li',
                            'class': ['sortAsc', 'singleItem'],
                            contents: {tagName: 'a', href: '#column-sort-asc',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: 'Sort Ascending'}}});
                        menu.contents.push({tagName: 'li',
                            'class': ['sortDesc', 'singleItem'],
                            contents: {tagName: 'a', href: '#column-sort-desc',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: 'Sort Descending'}}});
                        menu.contents.push({tagName: 'li',
                            'class': ['sortClear', 'singleItem'],
                            contents: {tagName: 'a', href: '#column-sort-clear',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: 'Clear Sort'}}});
                    }

                    if (features.sort || features.filter)
                    {
                        // There are already display items in the list, so we
                        // need to add a separator.
                        menu.contents.push({tagName: 'li',
                            'class': ['filterSeparator', 'separator',
                                'singleItem']});
                    }
                    menu.contents.push({tagName: 'li', 'class': 'hideCol',
                        contents: {tagName: 'a', href: '#hide-column',
                            contents: {tagName: 'span', 'class': 'highlight',
                                contents: 'Hide Column'}}});

                    if (features.remove)
                    {
                        menu.contents.push({tagName: 'li', 'class': 'delete',
                            contents: {tagName: 'a', href: '#delete-column',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: 'Delete Column'}}});
                    }

                    if (features.properties)
                    {
                        // There are already display items in the list, so we
                        // need to add a separator.
                        menu.contents.push({tagName: 'li',
                            'class': ['separator', 'singleItem']});
                        menu.contents.push({tagName: 'li', 'class': ['properties',
                            'singleItem'], contents: {tagName: 'a',
                                href: '#edit-column',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: 'Edit Column Properties'}}});
                    }

                    menu.contents.push({tagName: 'li', 'class': 'footer',
                        contents: {tagName: 'div', 'class': 'outerWrapper',
                            contents: {tagName: 'div', 'class': 'innerWrapper',
                                contents: {tagName: 'span', 'class': 'colorWrapper'}
                            }}});

                    $domObj.append($.tag(menu));
                    cmObj.$menu = $domObj.find('ul.columnHeaderMenu');
                    hookUpHeaderMenu(cmObj);
                });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            sort: function(ascending)
            {
                var cmObj = this;
                var query = $.extend(true, {}, cmObj.settings.view.query);
                if ($.isBlank(ascending))
                {
                    query.orderBys = _.reject(query.orderBys || [], function(ob)
                    { return ob.expression.columnId == cmObj.settings.column.id; });
                    if (query.orderBys.length == 0) { delete query.orderBys; }
                }
                else
                {
                    query.orderBys = [{expression:
                        {columnId: cmObj.settings.column.id, type: 'column'},
                            ascending: ascending}];
                }

                cmObj.settings.view.update({query: query}, false,
                        (query.orderBys || []).length < 2);
            },

            clearFilter: function()
            {
                var cmObj = this;
                if (cmObj.settings.$tipItem.isSocrataTip())
                { cmObj.settings.$tipItem.socrataTip().hide(); }
                cmObj.settings.column.clearFilter();
            }
        }
    });

    /* Hook up JS behavior for menu.  This is safe to be applied multiple times */
    var hookUpHeaderMenu = function(cmObj)
    {
        cmObj.$menu.dropdownMenu({triggerButton: cmObj.settings.$menuTrigger,
            openCallback: function () { columnMenuOpenCallback(cmObj); },
            linkCallback: function (e) { columnHeaderMenuHandler(cmObj, e); },
            forcePosition: true, pullToTop: true})
            .find('.autofilter ul.menu').scrollable();
    };

    var columnMenuOpenCallback = function(cmObj)
    {
        if (cmObj.settings.$tipItem.isSocrataTip())
        { cmObj.settings.$tipItem.socrataTip().hide(); }

        var selCols = {};
        if (_.isFunction(cmObj.settings.selectedColumns))
        { selCols = cmObj.settings.selectedColumns(); }
        var numSel = _.size(selCols);

        var col = cmObj.settings.column;
        if (numSel < 1 || (numSel == 1 && !$.isBlank(selCols[col.id])))
        {
            cmObj.$menu.find('.singleItem').show();
            loadFilterMenu(cmObj);

            cmObj.$menu.find('.sortAsc').toggle(!col.sortAscending);
            cmObj.$menu.find('.sortDesc').toggle($.isBlank(col.sortAscending) ||
                col.sortAscending);
            cmObj.$menu.find('.sortClear').toggle(!$.isBlank(col.sortAscending));
        }
        else
        {
            cmObj.$menu.find('.singleItem').hide();
        }
    };

    var loadFilterMenu = function(cmObj)
    {
        if (!$.isBlank(cmObj.settings.column.parentColumn) ||
            !cmObj.settings.column.renderType.filterable ||
            cmObj.settings.view.isGrouped())
        { return; }

        // Remove the old filter menu if necessary
        cmObj.$menu.children('.autofilter').prev('.separator').andSelf().remove();

        var $spinner = $.tag({tagName: 'li', 'class': ['autofilter','loading']});
        // Find the correct spot to add it; either after sort descending, or
        // the top
        var $sortItem = cmObj.$menu.find('li.filterSeparator');
        if ($sortItem.length > 0) { $sortItem.before($spinner); }
        else { cmObj.$menu.prepend($spinner); }

        _.defer(function()
        {
            cmObj.settings.column.getSummary(function (sum)
                { addFilterMenu(cmObj, sum); });
        });
    };

    /* Add auto-filter sub-menu for a particular column that we get from the JS
     * grid */
    var addFilterMenu = function(cmObj, summary)
    {
        // Remove spinner
        cmObj.$menu.children('.autofilter.loading').remove();

        // Remove the old filter menu if necessary
        cmObj.$menu.children('.autofilter').prev('.separator').andSelf().remove();

        if ($.isBlank(cmObj.settings.column.currentFilter) && $.isBlank(summary))
        { return; }

        var filterItem = {tagName: 'li', 'class': ['autofilter', 'submenu',
            'singleItem'], contents: [{tagName: 'a', 'class': 'submenuLink',
                href: '#', contents: {tagName: 'span', 'class': 'highlight',
                    contents: 'Filter This Column'}}]};
        var menuItem = {tagName: 'ul', 'class': ['menu', 'optionMenu'],
            contents: []};
        filterItem.contents.push(menuItem);

        // If we already have a filter for this column, give them a clear link
        if (!$.isBlank(cmObj.settings.column.currentFilter))
        {
            menuItem.contents.push({tagName: 'li', 'class': 'clearFilter',
                contents: {tagName: 'a', href: '#clear-filter-column',
                    contents: {tagName: 'span', 'class': 'highlight',
                        contents: 'Clear Column Filter'}}});
            if ($.isBlank(summary))
            {
                summary = {curVal: { topFrequencies:
                    [{value: col.currentFilter.value, count: 0}] } };
            }
        }

        // Previous button for scrolling
        menuItem.contents.push({tagName: 'li', 'class': ['button', 'prev'],
            contents: {tagName: 'a', href: '#pref', title: 'Previous',
                contents: {tagName: 'div', 'class': 'outerWrapper',
                    contents: {tagName: 'div', 'class': 'midWrapper',
                        contents: {tagName: 'span', 'class': 'innerWrapper',
                            contents: 'Previous'}}}}});

        // Sort type keys in a specific order for URL and phone
        var typeKeys = _.keys(summary);
        if (cmObj.settings.column.renderTypeName == 'url')
        { typeKeys.sort(); }
        else if (cmObj.settings.column.renderTypeName == 'phone')
        { typeKeys.sort().reverse(); }

        var sumSections = [];
        _.each(typeKeys, function(k)
        {
            var cs = summary[k];
            var items = [];

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
                        f.isMatching = !$.isBlank(cmObj.settings
                            .column.currentFilter) &&
                            cmObj.settings.column.currentFilter.value == f.value;
                        var curType = cmObj.settings.column.renderType;
                        f.escapedValue = escape(
                            _.isFunction(curType.filterValue) ?
                                curType.filterValue(f.value) :
                                $.htmlStrip(f.value + ''));
                        f.renderedValue =
                            _.isFunction(curType.filterRender) ?
                                curType.filterRender(f.value, cmObj.settings.column,
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
                        items.push({tagName: 'li', 'class': ['filterItem',
                            'scrollable', {value: 'active', onlyIf: f.isMatching}],
                            contents: {tagName: 'a', href: (f.isMatching ?
                                    '#clear-filter-column_' : '#filter-column_') +
                                    cs.subColumnType + ':' + f.escapedValue + '|',
                                title: f.titleValue + (f.count > 1 ?
                                    ' (' + f.count + ')' : ''),
                                'class': 'clipText', contents: f.renderedValue +
                                    (f.count > 1 ? ' (' + f.count + ')' : '')}});
                    });
            }
            if (sumSections.length > 0)
            {
                sumSections.push({tagName: 'li',
                    'class': ['separator', 'scrollable']});
            }
            sumSections = sumSections.concat(items);
        });

        menuItem.contents = menuItem.contents.concat(sumSections);

        // Next button for scrolling & menu footer
        menuItem.contents.push({tagName: 'li', 'class': ['button', 'next'],
            contents: {tagName: 'a', href: '#next', title: 'Next',
                contents: {tagName: 'div', 'class': 'outerWrapper',
                    contents: {tagName: 'div', 'class': 'midWrapper',
                        contents: {tagName: 'span', 'class': 'innerWrapper',
                            contents: 'Next'}}}}});
        menuItem.contents.push({tagName: 'li', 'class': 'footer',
            contents: {tagName: 'div', 'class': 'outerWrapper',
                contents: {tagName: 'div', 'class': 'innerWrapper',
                    contents: {tagName: 'span', 'class': 'colorWrapper'}}}});

        // Find the correct spot to add it; either after sort descending, or
        // the top
        var $sortItem = cmObj.$menu.find('li.filterSeparator');
        if ($sortItem.length > 0)
        {
            $sortItem.before($.tag([{tagName: 'li',
                'class': ['separator', 'singleItem']}, filterItem]));
        }
        else { cmObj.$menu.prepend($.tag(filterItem)); }
        hookUpHeaderMenu(cmObj);
    };


    /* Handle clicks in the column header menus */
    var columnHeaderMenuHandler = function(cmObj, event)
    {
        event.preventDefault();
        // Href that we care about starts with # and parts are separated with _
        // IE sticks the full thing, so slice everything up to #
        var s = $.hashHref($(event.currentTarget).attr('href')).split('_');

        var action = s[0];
        switch (action)
        {
            case 'column-sort-asc':
                cmObj.sort(true);
                break;
            case 'column-sort-desc':
                cmObj.sort(false);
                break;
            case 'column-sort-clear':
                cmObj.sort(null);
                break;
            case 'filter-column':
                // Rejoin remainder of parts in case the filter value had _
                // The sub-column type is separated by a colon, so split on that,
                // pull it off, then rejoin the remainder.  Finally, strip off
                // the ending | in case there are spaces at the end of the value
                var p = s.slice(1).join('_').split(':');
                cmObj.settings.column.filter(
                    unescape(p.slice(1).join(':').slice(0, -1)), p[0]);
                break;
            case 'clear-filter-column':
                cmObj.clearFilter();
                break;
            case 'hide-column':
                if (!$.isBlank(cmObj.settings.column.parentColumn))
                {
                    cmObj.settings.column.hide();
                }
                else
                {
                    var selHideCols = {};
                    if (_.isFunction(cmObj.settings.selectedColumns))
                    { selHideCols = cmObj.settings.selectedColumns(); }
                    selHideCols[cmObj.settings.column.id] = true;
                    _.each(selHideCols, function(v, colId)
                    {
                        cmObj.settings.view.columnForID(colId)
                            .hide(null, null, true);
                    });
                    if (!$.socrataServer.runRequests({success: function()
                                { cmObj.settings.view.updateColumns(); }}))
                    { cmObj.settings.view.updateColumns(); }
                }
                break;
            case 'delete-column':
                if (!$.isBlank(cmObj.settings.column.parentColumn))
                {
                    deleteColumns(cmObj);
                }

                else
                {
                    var selCols = {};
                    if (_.isFunction(cmObj.settings.selectedColumns))
                    { selCols = cmObj.settings.selectedColumns(); }
                    selCols[cmObj.settings.column.id] = true;
                    deleteColumns(cmObj, _.keys(selCols));
                }
                break;
            case 'edit-column':
                cmObj.settings.editColumnCallback(cmObj.settings.column);
                break;
        }
    };

    var deleteColumns = function(cmObj, columns)
    {
        columns = $.makeArray(columns);
        var multiCols = columns.length > 1;
        if (confirm('Do you want to delete the ' +
            (multiCols ? columns.length + ' selected columns' :
                'selected column') + '? All data in ' +
            (multiCols ? 'these columns' : 'this column') +
            ' will be removed!'))
        {
            if (_.isEmpty(columns) &&
                !$.isBlank(cmObj.settings.column.parentColumn))
            {
                cmObj.settings.column.parentColumn
                    .removeChildColumns(cmObj.settings.column.id);
            }
            else
            {
                if (_.isEmpty(columns))
                { columns = [cmObj.settings.column.id]; }
                cmObj.settings.view.removeColumns(columns);
            }
        }
    };

})(jQuery);

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

                if (canFilter(cmObj, col))
                { features.filter = true; }


                if (cmObj.settings.columnDeleteEnabled &&
                    col.renderType.deleteable &&
                    (!cmObj.settings.view.isGrouped() ||
                        !_.any(cmObj.settings.view.metadata.jsonQuery.group, function(g)
                            { return g.columnFieldName == col.fieldName; })))
                { features.remove = true; }


                if (cmObj.settings.columnHideEnabled)
                { features.hide = true; }

                if (cmObj.settings.columnPropertiesEnabled && !cmObj.settings.view.newBackend)
                { features.properties = true; }

                // We've got a menu, so add a class
                $domObj.addClass('hasColumnMenu');

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
                                    contents: $.t('controls.grid.sort_ascending')}}});
                        menu.contents.push({tagName: 'li',
                            'class': ['sortDesc', 'singleItem'],
                            contents: {tagName: 'a', href: '#column-sort-desc',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: $.t('controls.grid.sort_descending')}}});
                        menu.contents.push({tagName: 'li',
                            'class': ['sortClear', 'singleItem'],
                            contents: {tagName: 'a', href: '#column-sort-clear',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: $.t('controls.grid.clear_sort')}}});
                    }

                    if (features.sort || features.filter)
                    {
                        // There are already display items in the list, so we
                        // need to add a separator.
                        menu.contents.push({tagName: 'li',
                            'class': ['filterSeparator', 'separator',
                                'singleItem', {value: 'hide',
                                    onlyIf: !(features.hide || features.remove || features.properties)}]});
                    }
                    if (features.hide)
                    {
                        menu.contents.push({tagName: 'li', 'class': 'hideCol',
                            contents: {tagName: 'a', href: '#hide-column',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: $.t('controls.grid.hide_column')}}});
                    }

                    if (features.remove)
                    {
                        menu.contents.push({tagName: 'li', 'class': 'delete',
                            contents: {tagName: 'a', href: '#delete-column',
                                contents: {tagName: 'span', 'class': 'highlight',
                                    contents: $.t('controls.grid.delete_column')}}});
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
                                    contents: $.t('controls.grid.edit_column_properties')}}});
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
                var md = $.extend(true, {}, cmObj.settings.view.metadata);
                var query = md.jsonQuery;
                if ($.isBlank(ascending))
                {
                    query.order = _.reject(query.order || [], function(ob)
                    { return ob.columnFieldName == cmObj.settings.column.fieldName; });
                    if (query.order.length == 0) { delete query.order; }
                }
                else
                {
                    query.order = [{ columnFieldName: cmObj.settings.column.fieldName,
                        ascending: ascending }];
                }

                cmObj.settings.view.update({ metadata: md }, false,
                        (query.order || []).length < 2);
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

    var canFilter = function(cmObj, col)
    {
        var types = [col.renderType].concat(_.values(col.renderType.subColumns || {}));
        return $.isBlank(col.parentColumn) && !cmObj.settings.view.isGrouped() &&
            !cmObj.settings.view.newBackend &&
            _.any(types, function(t) { return $.subKeyDefined(t, 'filterConditions.details.EQUALS'); });
    };

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
        if (!canFilter(cmObj, cmObj.settings.column))
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
                    contents: $.t('controls.grid.filter_this_column')}}]};
        var menuItem = {tagName: 'ul', 'class': ['menu', 'optionMenu'],
            contents: []};
        filterItem.contents.push(menuItem);

        // If we already have a filter for this column, give them a clear link
        if (!$.isBlank(cmObj.settings.column.currentFilter))
        {
            menuItem.contents.push({tagName: 'li', 'class': 'clearFilter',
                contents: {tagName: 'a', href: '#clear-filter-column',
                    contents: {tagName: 'span', 'class': 'highlight',
                        contents: $.t('controls.grid.clear_column_filter')}}});
            if ($.isBlank(summary))
            {
                summary = {curVal: { topFrequencies:
                    [{value: col.currentFilter.value, count: 0}] } };
            }
        }

        // Previous button for scrolling
        menuItem.contents.push({tagName: 'li', 'class': ['button', 'prev'],
            contents: {tagName: 'a', href: '#pref', title: $.t('controls.grid.previous'),
                contents: {tagName: 'div', 'class': 'outerWrapper',
                    contents: {tagName: 'div', 'class': 'midWrapper',
                        contents: {tagName: 'span', 'class': 'innerWrapper',
                            contents: $.t('controls.grid.previous')}}}}});

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
            var curType = cmObj.settings.column.renderType;
            var isSubCol = false;
            if ($.subKeyDefined(curType, 'subColumns.' + cs.subColumnType))
            {
                curType = curType.subColumns[cs.subColumnType];
                isSubCol = true;
            }
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
                        f.escapedValue = escape(_.isFunction(curType.filterValue) ?
                                curType.filterValue(f.value) : $.htmlStrip(f.value + ''));
                        f.renderedValue = curType.renderer(f.value, cmObj.settings.column, false, true);
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
                                    (isSubCol ? cs.subColumnType : '') + ':' + f.escapedValue + '|',
                                title: f.titleValue ,
                                'class': 'clipText', contents: f.renderedValue }});
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
                        // Don't save changes, let the user do that
                        cmObj.settings.view.columnForID(colId).hide();
                        cmObj.settings.view.trigger('columns_changed');
                    });
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
        if (confirm(multiCols ? $.t('controls.grid.delete_warning_multi_column') : $.t('controls.grid.delete_warning_single_column')))
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

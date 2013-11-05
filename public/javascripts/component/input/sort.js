;(function($) {

$.component.Component.extend('Sort', 'none', {//'input', {
    _initDom: function()
    {
        var cObj = this;
        this._super.apply(this, arguments);

        if ($.isBlank(cObj.$dsListSection))
        {
            cObj.$dsListSection = cObj.$contents.find('.dsListSort');
            if (cObj.$dsListSection.length < 1)
            {
                cObj.$dsListSection = $.tag({ tagName: 'div', 'class': 'dsListSort' });
                cObj.$contents.append(cObj.$dsListSection);
            }
        }

        if ($.isBlank(cObj.$dsListDropdown))
        {
            cObj.$dsListDropdown = cObj.$dsListSection.find('select.dsListSort');
            if (cObj.$dsListDropdown.length < 1)
            {
                cObj.$dsListDropdown = $.tag2({ _: 'select', id: cObj.id + '-dsListSort',
                    name: 'dsListSort', className: 'dsListSort' });
                cObj.$dsListSection.append(cObj.$dsListDropdown);
            }
            if (!$.isBlank($.uniform))
            { cObj.$dsListDropdown.uniform(); }

            cObj.$dsListDropdown.on('change', function() { _.defer(function() { handleChange(cObj); }); });
        }

        if ($.isBlank(cObj.$dsListPeriodDropdown))
        {
            cObj.$dsListPeriodDropdown = cObj.$dsListSection.find('select.sortPeriod');
            if (cObj.$dsListPeriodDropdown.length < 1)
            {
                cObj.$dsListPeriodDropdown = $.tag2({ _: 'select', id: cObj.id + '-dsListSortPeriod',
                    name: 'dsListSortPeriod', className: 'sortPeriod' });
                cObj.$dsListSection.append(cObj.$dsListPeriodDropdown);
            }
            if (!$.isBlank($.uniform))
            { cObj.$dsListPeriodDropdown.uniform(); }

            cObj.$dsListPeriodDropdown.on('change', function() { _.defer(function() { handleChange(cObj); }); });
        }

        if ($.isBlank(cObj.$datasetSection))
        {
            cObj.$datasetSection = this.$contents.find('.datasetSort');
            if (cObj.$datasetSection.length < 1)
            {
                cObj.$datasetSection = $.tag({ tagName: 'div', 'class': 'datasetSort' });
                this.$contents.append(cObj.$datasetSection);
            }
        }

        if ($.isBlank(this.$dsDropdown))
        {
            this.$dsDropdown = cObj.$datasetSection.find('select');
            if (this.$dsDropdown.length < 1)
            {
                this.$dsDropdown = $.tag({ tagName: 'select', id: this.id + '-datasetSort',
                    name: 'datasetSort' });
                cObj.$datasetSection.append(this.$dsDropdown);
            }
            if (!$.isBlank($.uniform))
            { this.$dsDropdown.uniform(); }

            this.$dsDropdown.on('change', function() { _.defer(function() { handleChange(cObj); }); });
        }

        if ($.isBlank(cObj.$sortLinks))
        {
            cObj.$sortLinks = this.$contents.find('.sortLinks');
            if (cObj.$sortLinks.length < 1)
            {
                cObj.$sortLinks = $.tag({ tagName: 'div', 'class': ['sortLinks', 'clearfix'] });
                this.$contents.append(cObj.$sortLinks);
            }
        }

        if ($.isBlank(cObj.$sortDir))
        {
            cObj.$sortDir = cObj.$sortLinks.find('a.sortDir');
            if (cObj.$sortDir.length < 1)
            {
                cObj.$sortDir = $.tag({ tagName: 'a', href: '#sortDir', 'class': 'sortDir',
                    contents: { tagName: 'span', 'class': 'icon' } });
                cObj.$sortLinks.append(cObj.$sortDir);
            }

            cObj.$sortDir.on('click', function(e)
            {
                e.preventDefault();
                handleSortDir(cObj);
            });
        }

        if ($.isBlank(cObj.$sortClear))
        {
            cObj.$sortClear = cObj.$sortLinks.find('a.sortClear');
            if (cObj.$sortClear.length < 1)
            {
                cObj.$sortClear = $.tag({ tagName: 'a', href: '#sortClear',
                    'class': ['sortClear', 'remove'],
                    contents: { tagName: 'span', 'class': 'icon' } });
                cObj.$sortLinks.append(cObj.$sortClear);
            }

            cObj.$sortClear.on('click', function(e)
            {
                e.preventDefault();
                handleSortClear(cObj);
            });
        }
    },

    _getAssets: function()
    {
        return { translations: ['controls.browse'] };
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        if (!this._updateDataSource(null, renderUpdate))
        { renderUpdate.apply(this); }
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);

        this._updateDataSource(properties, renderUpdate);
    }
});

var renderUpdate = function()
{
    var cObj = this;
    if (!cObj._initialized) { return; }

    cObj.$dsListSection.addClass('hide');
    cObj.$datasetSection.addClass('hide');
    cObj.$sortDir.addClass('hide');
    cObj.$sortClear.addClass('hide');
    cObj.$sortLinks.removeClass('column dataset');
    if (cObj._dataContext.type == 'dataset')
    {
        var ds = cObj._dataContext.dataset;
        if (cObj._curDataset != ds)
        {
            if (!$.isBlank(cObj._curDataset))
            { cObj._curDataset.unbind(null, null, cObj); }
            cObj._curDataset = ds;
            cObj._curDataset.bind('query_change', function() { renderUpdate.apply(cObj); });
            cObj._curDataset.bind('columns_changed', function() { renderUpdate.apply(cObj); });
        }

        cObj.$datasetSection.removeClass('hide');
        cObj.$sortLinks.addClass('dataset');
        cObj.$dsDropdown.empty();
        var curSort = _.first(ds.query.orderBys || []) || {expression: {}};
        var foundCur = false;
        var selVal = '';
        var exF = cObj._stringSubstitute(cObj._properties.excludeFilter);
        var incF = cObj._stringSubstitute(cObj._properties.includeFilter);
        _.each(ds.visibleColumns, function(c)
        {
            if (!_.all(exF, function(v, k)
                    { return !_.include($.makeArray(v), $.deepGetStringField(c, k)); }) ||
                (!$.isBlank(cObj._properties.includeFilter) &&
                 !_.any(incF, function(v, k)
                     { return _.include($.makeArray(v), $.deepGetStringField(c, k)); })))
            { return; }

            var sel = curSort.expression.columnId == c.id;
            foundCur = foundCur || sel;
            cObj.$dsDropdown.append($.tag({ tagName: 'option', value: c.fieldName,
                selected: sel, contents: $.htmlEscape(c.name) }));
            if (sel)
            {
                cObj.$sortDir.removeClass('hide sortAsc sortDesc sortAscLight')
                    .addClass('sort' + (curSort.ascending ? 'Asc' : 'Desc'))
                    .attr('title', 'Sort ' + (curSort.ascending ? 'Descending' : 'Ascending'));
                selVal = c.fieldName;
            }
        });
        cObj.$dsDropdown.prepend($.tag({ tagName: 'option', value: '', 'class': 'prompt',
            selected: !foundCur, contents: '(Unsorted)' }));
        // Force the selected value for IE8-
        cObj.$dsDropdown.value(selVal);

        if ($.subKeyDefined($, 'uniform.update'))
        { $.uniform.update(cObj.$dsDropdown); }
    }

    else if (cObj._dataContext.type == 'column')
    {
        var col = cObj._dataContext.column;
        if (cObj._curDataset != col.view)
        {
            if (!$.isBlank(cObj._curDataset))
            { cObj._curDataset.unbind(null, null, cObj); }
            cObj._curDataset = col.view;
            cObj._curDataset.bind('query_change', function() { renderUpdate.apply(cObj); });
            cObj._curDataset.bind('columns_changed', function() { renderUpdate.apply(cObj); });
        }

        cObj.$sortLinks.addClass('column');
        cObj.$sortDir.removeClass('hide').toggleClass('sortAsc', col.sortAscending === true)
            .toggleClass('sortDesc', col.sortAscending === false)
            .toggleClass('sortAscLight', $.isBlank(col.sortAscending))
            .attr('title', 'Sort ' + $.htmlEscape(col.name) + ' ' +
                    (col.sortAscending === true ? 'descending' : 'ascending'));
        cObj.$sortClear.toggleClass('hide', $.isBlank(col.sortAscending))
            .attr('title', 'Clear sort for ' + $.htmlEscape(col.name));
    }

    else if (cObj._dataContext.type == 'datasetList')
    {
        // Add these here since we need to make sure translations are loaded first
        if (cObj.$dsListDropdown.children().length < 1)
        {
            cObj.$dsListDropdown.append($.tag2(
                _.map(['relevance', 'most_accessed', 'alpha',
                    'newest', 'oldest', 'last_modified', 'rating', 'comments'], function(opt)
                    {
                        return { _: 'option', value: opt, contents: $.t('controls.browse.sorts.' + opt) };
                    })));
        }
        if (cObj.$dsListPeriodDropdown.children().length < 1)
        {
            cObj.$dsListPeriodDropdown.append($.tag2(
                _.map(['week', 'month', 'year'], function(opt)
                    {
                        return { _: 'option', value: (opt + 'ly').toUpperCase(),
                            contents: $.t('controls.browse.sort_periods.' + opt) };
                    })));
        }
        cObj.$dsListDropdown.value((cObj._dataContext.config.search || {}).sortBy ||
                cObj.$dsListDropdown.children(':first').value());
        cObj.$dsListPeriodDropdown.value((cObj._dataContext.config.search || {}).sortPeriod ||
                cObj.$dsListPeriodDropdown.children(':first').value());
        cObj.$dsListPeriodDropdown.closest('.uniform').andSelf()
            .toggleClass('hide', cObj.$dsListDropdown.value() != 'most_accessed');

        cObj.$dsListSection.removeClass('hide');

        if ($.subKeyDefined($, 'uniform.update'))
        {
            $.uniform.update(cObj.$dsListDropdown);
            $.uniform.update(cObj.$dsListPeriodDropdown);
        }
    }
};

var handleChange = function(cObj)
{
    if ($.subKeyDefined(cObj, '_dataContext.dataset'))
    {
        var cfn = cObj.$dsDropdown.value();
        cObj._dataContext.dataset.simpleSort(cfn, true);
        cObj.$sortDir.toggleClass('hide', $.isBlank(cfn)).removeClass('sortDesc sortAscLight')
            .addClass('sortAsc');
    }
    else if (cObj._dataContext.type == 'datasetList')
    {
        var c = $.extend(true, {}, cObj._dataContext.config);
        c.search = c.search || {};
        c.search.sortBy = cObj.$dsListDropdown.value();
        if (c.search.sortBy == 'most_accessed')
        { c.search.sortPeriod = cObj.$dsListPeriodDropdown.value(); }
        else
        { delete c.search.sortPeriod; }
        cObj._dataContext.updateConfig(c);
        // Re-render to show/hide the sortPeriod
        renderUpdate.apply(cObj);
    }
};

var handleSortDir = function(cObj)
{
    var isDesc = cObj.$sortDir.hasClass('sortAsc');
    cObj.$sortDir.removeClass('sortAscLight').toggleClass('sortDesc', isDesc).toggleClass('sortAsc', !isDesc);

    var cfn;
    var ds;
    if ($.subKeyDefined(cObj, '_dataContext.column'))
    {
        cfn = cObj._dataContext.column.fieldName;
        ds = cObj._dataContext.column.view;
    }
    else if ($.subKeyDefined(cObj, '_dataContext.dataset'))
    {
        cfn = cObj.$dsDropdown.value();
        ds = cObj._dataContext.dataset;
    }

    if (!$.isBlank(cfn))
    { ds.simpleSort(cfn, !isDesc); }
};

var handleSortClear = function(cObj)
{
    if ($.subKeyDefined(cObj, '_dataContext.column'))
    {
        var ds = cObj._dataContext.column.view;
        var md = $.extend(true, {}, ds.metadata);
        var query = md.jsonQuery;
        query.order = _.reject(query.order || [], function(ob)
                { return ob.columnFieldName == cObj._dataContext.column.fieldName; });
        if (query.order.length == 0) { delete query.order; }
        ds.update({ metadata: md }, false, (query.order || []).length < 2);
    }
};

})(jQuery);

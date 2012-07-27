;(function($) {

$.component.Component.extend('Sort', 'input', {
    _initDom: function()
    {
        var cObj = this;
        this._super.apply(this, arguments);

        if ($.isBlank(cObj.$datasetSection))
        {
            cObj.$datasetSection = this.$contents.find('.datasetSort');
            if (cObj.$datasetSection.length < 1)
            {
                cObj.$datasetSection = $.tag({ tagName: 'div', 'class': 'datasetSort' });
                this.$contents.append(cObj.$datasetSection);
            }
        }

        if ($.isBlank(this.$dropdown))
        {
            this.$dropdown = cObj.$datasetSection.find('select');
            if (this.$dropdown.length < 1)
            {
                this.$dropdown = $.tag({ tagName: 'select', id: this.id + '-datasetSort',
                    name: 'datasetSort' });
                cObj.$datasetSection.append(this.$dropdown);
            }
            if (!$.isBlank($.uniform))
            { this.$dropdown.uniform(); }

            this.$dropdown.on('change', function() { _.defer(function() { handleChange(cObj); }); });
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

        if ($.isBlank(this.$sortDir))
        {
            this.$sortDir = cObj.$sortLinks.find('a.sortDir');
            if (this.$sortDir.length < 1)
            {
                this.$sortDir = $.tag({ tagName: 'a', href: '#sortDir', 'class': 'sortDir',
                    contents: { tagName: 'span', 'class': 'icon' } });
                cObj.$sortLinks.append(this.$sortDir);
            }

            this.$sortDir.on('click', function(e)
            {
                e.preventDefault();
                handleSortDir(cObj);
            });
        }

        if ($.isBlank(this.$sortClear))
        {
            this.$sortClear = cObj.$sortLinks.find('a.sortClear');
            if (this.$sortClear.length < 1)
            {
                this.$sortClear = $.tag({ tagName: 'a', href: '#sortClear',
                    'class': ['sortClear', 'remove'],
                    contents: { tagName: 'span', 'class': 'icon' } });
                cObj.$sortLinks.append(this.$sortClear);
            }

            this.$sortClear.on('click', function(e)
            {
                e.preventDefault();
                handleSortClear(cObj);
            });
        }
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
        cObj.$dropdown.empty();
        var curSort = _.first(ds.query.orderBys || []) || {expression: {}};
        var foundCur = false;
        _.each(ds.visibleColumns, function(c)
        {
            var sel = curSort.expression.columnId == c.id;
            foundCur = foundCur || sel;
            cObj.$dropdown.append($.tag({ tagName: 'option', value: c.fieldName,
                selected: sel, contents: $.htmlEscape(c.name) }));
            if (sel)
            {
                cObj.$sortDir.removeClass('hide sortAsc sortDesc')
                    .addClass('sort' + (curSort.ascending ? 'Asc' : 'Desc'))
                    .attr('title', 'Sort ' + (curSort.ascending ? 'Descending' : 'Ascending'));
            }
        });
        cObj.$dropdown.prepend($.tag({ tagName: 'option', value: '', 'class': 'prompt',
            selected: !foundCur, contents: '(Unsorted)' }));

        if ($.subKeyDefined($, 'uniform.update'))
        { $.uniform.update(cObj.$dropdown); }
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
};

var handleChange = function(cObj)
{
    if ($.subKeyDefined(cObj, '_dataContext.dataset'))
    {
        var cfn = cObj.$dropdown.value();
        cObj._dataContext.dataset.simpleSort(cfn, true);
        cObj.$sortDir.toggleClass('hide', $.isBlank(cfn)).removeClass('sortDesc').addClass('sortAsc');
    }
};

var handleSortDir = function(cObj)
{
    var isDesc = cObj.$sortDir.hasClass('sortAsc');
    cObj.$sortDir.toggleClass('sortDesc', isDesc).toggleClass('sortAsc', !isDesc);

    var cfn;
    var ds;
    if ($.subKeyDefined(cObj, '_dataContext.dataset'))
    {
        cfn = cObj.$dropdown.value();
        ds = cObj._dataContext.dataset;
    }
    else if ($.subKeyDefined(cObj, '_dataContext.column'))
    {
        cfn = cObj._dataContext.column.fieldName;
        ds = cObj._dataContext.column.view;
    }

    if (!$.isBlank(cfn))
    { ds.simpleSort(cfn, !isDesc); }
};

var handleSortClear = function(cObj)
{
    if ($.subKeyDefined(cObj, '_dataContext.column'))
    {
        var ds = cObj._dataContext.column.view;
        var query = $.extend(true, {}, ds.query);
        query.orderBys = _.reject(query.orderBys || [], function(ob)
                { return ob.expression.columnId == cObj._dataContext.column.id; });
        if (query.orderBys.length == 0) { delete query.orderBys; }
        ds.update({query: query}, false, (query.orderBys || []).length < 2);
    }
};

})(jQuery);

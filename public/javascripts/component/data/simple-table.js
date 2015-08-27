;(function() {

$.component.Component.extend('Simple Table', 'data', {
    _init: function()
    {
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
    },

    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);

        if ($.isBlank(cObj.$table))
        {
            cObj.$table = cObj.$contents.children('table');
            if (cObj.$table.length < 1)
            {
                cObj.$table = $.tag({ tagName: 'table', contents: [
                    { tagName: 'caption' },
                    { tagName: 'colgroup' },
                    { tagName: 'thead' },
                    { tagName: 'tbody' },
                    { tagName: 'tfoot' }
                ] });
                cObj.$contents.append(cObj.$table);
            }
            cObj.$caption = cObj.$table.children('caption');
            cObj.$colgroup = cObj.$table.children('colgroup');
            cObj.$thead = cObj.$table.children('thead');
            cObj.$tbody = cObj.$table.children('tbody');
            cObj.$tfoot = cObj.$table.children('tfoot');
        }
    },

    _clearDataContext: function()
    {
        var cObj = this;
        // Unbind anything old
        if ($.subKeyDefined(cObj, '_dataContext.dataset'))
        { _.each($.makeArray(cObj._dataContext), function(dc) { dc.dataset.unbind(null, null, cObj); }); }
        cObj._super.apply(cObj, arguments);
    },

    _addDataContext: function(dc)
    {
        var cObj = this;
        this._super.apply(this, arguments);

        if ($.subKeyDefined(dc, 'dataset'))
        {
            var doUpdate = function()
            {
                cObj._isDirty = true;
                cObj._render();
            };
            dc.dataset.bind('query_change', doUpdate, cObj);
            dc.dataset.bind('columns_changed', doUpdate, cObj);
            cObj.$dom.attr('aria-live', 'polite');
        }
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        updateProperties(cObj, cObj._properties);
        return true;
    },

    _propWrite: function(properties)
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);

        updateProperties(cObj, properties);
    }
});

var updateProperties = function(cObj, properties)
{
    var setUpTable = function()
    {
        if ($.isBlank(cObj.$table)) { return; }

        // Columns
        cObj.$colgroup.empty();
        if (_.isArray(cObj._properties.columns))
        { cObj._columns = cObj._stringSubstitute(cObj._properties.columns); }
        else if ((cObj._properties.columns || {}).datasetColumns &&
                $.subKeyDefined(cObj, '_dataContext.dataset'))
        {
            var exF = cObj._stringSubstitute(cObj._properties.columns.excludeFilter);
            var incF = cObj._stringSubstitute(cObj._properties.columns.includeFilter);
            cObj._columns = _.chain(cObj._dataContext.dataset.visibleColumns).filter(function(col)
            {
                return _.all(exF, function(v, k)
                        { return !_.include($.makeArray(v), $.deepGetStringField(col, k)); }) &&
                    ($.isBlank(cObj._properties.columns.includeFilter) ? true :
                     _.any(incF, function(v, k)
                         { return _.include($.makeArray(v), $.deepGetStringField(col, k)); }));
            }).map(function(col) { return { id: col.fieldName, text: col.name }; }).value();
        }

        _.each(cObj._columns, function(col)
        { cObj.$colgroup.append($.tag({ tagName: 'col', 'class': col.id })); });

        // Caption
        cObj.$caption.html(cObj._stringSubstitute(cObj._properties.caption));

        // Header
        cObj.$thead.empty();
        var headConfig = cObj._stringSubstitute(cObj._properties.header) || {};
        if (headConfig.columns && !_.isEmpty(cObj._columns))
        {
            var $row = $.tag({ tagName: 'tr' });
            cObj.$thead.append($row);
            _.each(cObj._columns, function(col)
            { $row.append($.tag({ tagName: 'th', scope: 'col', 'class': col.id, contents: col.text })); });
        }
        else
        { addRow(cObj, cObj.$thead, $.extend({ isHeader: true }, cObj._properties.header)); }

        // Body
        cObj.$thead.removeClass('hide');
        cObj.$tfoot.removeClass('hide');
        cObj.$caption.removeClass('hide');
        var doneWithRowsCallback = function(count)
        {
            var after _.after(count, function()
            {
                if (count < 1)
                {
                    var noResultsConf = cObj._stringSubstitute(cObj._properties.noResults || {});
                    if ($.subKeyDefined(cObj._properties, 'noResults.row'))
                    { addRow(cObj, cObj.$tbody, cObj._properties.noResults.row); }
                    if (noResultsConf.hideHeader)
                    { cObj.$thead.addClass('hide'); }
                    if (noResultsConf.hideFooter)
                    { cObj.$tfoot.addClass('hide'); }
                    if (noResultsConf.hideCaption)
                    { cObj.$caption.addClass('hide'); }
                }
            });
            if (count === 0) {
              return after();
            } else {
              return after;
            }
        };

        if ($.isBlank(cObj._dataContext))
        {
            doneWithRowsCallback(0);
            return;
        }
        else if ($.subKeyDefined(cObj, '_dataContext.dataset'))
        {
            var view = cObj._dataContext.dataset;
            // Render records
            var rowCount = cObj._stringSubstitute(cObj._properties.rowBodyCount || 100);
            view.getRows((cObj._stringSubstitute(cObj._properties.rowBodyPage || 1) - 1) * rowCount, rowCount,
                function(rows)
                {
                    cObj.$tbody.empty();
                    var callback = doneWithRowsCallback(rows.length);
                    _.each(rows, function(r, i, list)
                        { addRow(cObj, cObj.$tbody, cObj._properties.row, view.rowToSODA2(r),
                            i, list.length, callback); });
                });
        }
        else if ($.subKeyDefined(cObj, '_dataContext.datasetList'))
        {
            cObj.$tbody.empty();
            var callback = doneWithRowsCallback(cObj._dataContext.datasetList.length);
            _.each(cObj._dataContext.datasetList, function(ds, i, list)
                { addRow(cObj, cObj.$tbody, cObj._properties.row, ds, i, list.length, callback); });
        }

        // Footer
        cObj.$tfoot.empty();
        { addRow(cObj, cObj.$tfoot, cObj._properties.footer); }
    };

    if (!cObj._updateDataSource(properties, setUpTable))
    { setUpTable(); }
};

var addRow = function(cObj, $parent, config, row, rowIndex, rowLength, callback)
{
    if (!$.isBlank(rowIndex) && !$.isBlank(rowLength))
    {
        row = $.extend({}, row, { _rowIndex: rowIndex, _rowDisplayIndex: rowIndex + 1,
            _rowEvenOdd: (rowIndex % 2) == 0 ? 'evenRow' : 'oddRow',
            _rowFirstLast: (rowIndex == 0) ? 'firstRow' : (rowIndex == rowLength - 1) ? 'lastRow' : 'innerRow' });
    }

    var compRow = new $.component.PrivateSimpleTableRow($.extend(true, {}, config, { entity: row }),
            cObj._componentSet);
    compRow.parent = cObj;

    // Terrible hack; but core server doesn't support regexes in queries,
    // so this is the easiest way to skip some rows. This also doesn't
    // handle the fact that the number of rendered rows doesn't match up
    // directly with the position & length anymore; so it will probably not
    // behave properly if more than a page of data is present
    if ($.subKeyDefined(config, 'valueRegex'))
    {
        var r = new RegExp(compRow._stringSubstitute(config.valueRegex.regex));
        var v = compRow._stringSubstitute(config.valueRegex.value);
        var result = r.test(v);
        if (config.valueRegex.invert) { result = !result; }
        if (!result)
        {
            compRow.destroy();
            if (_.isFunction(callback)) { callback(); }
            return;
        }
    }

    var $row = $.tag({ tagName: 'tr' });
    $parent.append($row);

    var addCell = function(cell, config, colIndex, colLength, colId)
    {
        cell = cObj._stringSubstitute(cell || {},
            { _colIndex: colIndex, _colDisplayIndex: colIndex + 1,
            _colEvenOdd: (colIndex % 2) == 0 ? 'evenCol' : 'oddCol',
            _colFirstLast: (colIndex == 0) ? 'firstCol' : (colIndex == colLength - 1) ? 'lastCol' : 'innerCol' });
        $row.append($.tag({ tagName: config.isHeader || cell.isHeader ? 'th' : 'td',
            'class': _.compact([colId, cell.htmlClass]),
            scope: { onlyIf: config.isHeader && cell.isColumn || cell.isHeader,
                value: config.isHeader && cell.isColumn ? 'col' : 'row' },
            contents: cell.value }));
    };

    var renderCells = function()
    {
        config = compRow._stringSubstitute(config);
        if (!$.isBlank(config.htmlClass))
        { $row.addClass(config.htmlClass); }

        if ($.isPlainObject(config.cells) && !_.isEmpty(cObj._columns))
        {
            _.each(cObj._columns, function(col, i, list)
            { addCell(config.cells[col.id], config, i, list.length, col.id); });
        }
        else if (_.isArray(config.cells))
        {
            _.each(config.cells, function(cell, i, list)
            {
                addCell(cell, config, i, list.length);
            });
        }
        if (_.isFunction(callback)) { callback(); }
    };
    if (!compRow._updateDataSource(null, renderCells))
    { renderCells(); }
};

$.component.FunctionalComponent.extend('PrivateSimpleTableRow', 'none', {});

})(jQuery);

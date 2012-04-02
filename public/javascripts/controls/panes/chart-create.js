(function($)
{
    $.Control.extend('pane_chartCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);

            cpObj.$dom().delegate('.showConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                if ($.subKeyDefined(blist, 'datasetPage.sidebar'))
                { blist.datasetPage.sidebar.show('visualize.conditionalFormatting'); }
            });

            cpObj.$dom().delegate('.clearConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                var metadata = $.extend(true, {}, cpObj._view.metadata);
                delete metadata.conditionalFormatting;
                cpObj._view.update({ metadata: metadata });
            });
        },

        getTitle: function()
        { return 'Chart'; },

        getSubtitle: function()
        { return 'View data can be displayed with a variety of charts'; },

        _getCurrentData: function()
        { return this._super() || this._view; },

        isAvailable: function()
        {
            return (this._view.valid || isEdit(this)) &&
                (_.include(this._view.metadata.availableDisplayTypes, 'chart') ||
                    !this._view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid && !isEdit(this) ?
                'This view must be valid' : 'A view may only have one visualization on it';
        },

        _getSections: function()
        {
            var cpObj = this;
            var result = [
                {
                    title: 'Chart Setup',
                    fields: [
                        {text: 'Chart Type', name: 'displayFormat.chartType',
                            type: 'select', required: true, prompt: 'Select a chart type',
                            options: _.sortBy(Dataset.chart.types, function(ct) { return ct.text; })
                        }
                    ]
                }
            ];

            _.each(_.keys(Dataset.chart.types), function(type)
            {
                result = result.concat(blist.configs.chart.configForType(type,
                    {view: cpObj._view, isEdit: isEdit(cpObj) && !cpObj._view.isGrouped(),
                        useOnlyIf: true}));
            });

            return result;
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {chart: true}}}},
                cpObj._getFormValues(), {metadata: cpObj._view.metadata});

            var addColumn = function(tcid)
            {
                var col = cpObj._view.columnForTCID(tcid);
                if (_.any(col.renderType.aggregates, function(a) { return a.value == 'sum'; }))
                col.format.aggregate = 'sum';
            };

            _.each(view.displayFormat.fixedColumns || [], addColumn);

            if (_.include(['pie', 'donut'], view.displayFormat.chartType))
            { view.query = $.extend(view.query, cpObj._view.query,
                { orderBys: _.map(view.displayFormat.valueColumns, function(col)
                    {
                        var orderBy = { ascending: false, expression: {
                            columnId: cpObj._view.columnForTCID(col.tableColumnId).id,
                            type: 'column'
                        }};
                        return orderBy;
                    }) }
            ); }
            cpObj._view.update(view);

            var didCallback = false;
            if (isEdit(cpObj))
            {
                // We need to show all columns when editing a view so that
                // any filters/facets work properly
                var colIds = _.pluck(cpObj._view.realColumns, 'id');
                if (colIds.length > 0)
                {
                    cpObj._view.setVisibleColumns(colIds, finalCallback, true);
                    didCallback = true;
                }
            }

            cpObj._finishProcessing();
            cpObj.reset();
            if (!didCallback && _.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'chartCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj._view.metadata.availableDisplayTypes, 'chart'); };

    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.chartCreate)
    { $.gridSidebar.registerConfig('visualize.chartCreate', 'pane_chartCreate', 1, 'chart'); }

})(jQuery);

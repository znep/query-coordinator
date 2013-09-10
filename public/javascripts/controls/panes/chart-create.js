(function($)
{
    var forceOldCharts = $.urlParam(window.location.href, 'charts') === 'old' || blist.configuration.oldChartsForced;
    var forceNewCharts = $.urlParam(window.location.href, 'charts') === 'nextgen' || $.deepGet(blist, 'dataset', 'displayFormat', 'nextgen') === true;

    var isNextGen = blist.configuration.newChartsEnabled && !forceOldCharts || forceNewCharts;

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
        { return $.t('screens.ds.grid_sidebar.chart.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.chart.subtitle'); },

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
                $.t('screens.ds.grid_sidebar.base.validation.invalid_view') : $.t('screens.ds.grid_sidebar.chart.validation.viz_limit');
        },

        _getSections: function()
        {
            var cpObj = this;

            var result = [
                {
                    title: $.t('screens.ds.grid_sidebar.chart.setup.title'),
                    fields: [
                        {text: $.t('screens.ds.grid_sidebar.chart.setup.type'), name: 'displayFormat.chartType',
                            type: 'select', required: true, prompt: $.t('screens.ds.grid_sidebar.chart.setup.type_prompt'),
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

            if (!isNextGen)
            {
                var addColumn = function(colId)
                {
                    var col = cpObj._view.columnForIdentifier(colId);
                    if (_.any(col.renderType.aggregates, function(a) { return a.value == 'sum'; }))
                    col.format.aggregate = 'sum';
                };

                _.each(view.displayFormat.fixedColumns || [], addColumn);
            }

            if (_.include(['pie', 'donut'], view.displayFormat.chartType) && !$.subKeyDefined(cpObj, '_view.query.orderBys'))
            {
                view.query = $.extend(view.query, cpObj._view.query,
                {
                    orderBys: cpObj._getPieDefaultOrderBy()
                });
            }

            if (((view.displayFormat.chartType == 'bar') || (view.displayFormat.chartType == 'column')) &&
                (view.displayFormat.stacking == true))
            {
                view.displayFormat.chartType = 'stacked' + view.displayFormat.chartType;
            }
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
        },

        // NOTE: Keep this in sync with the one in d3.impl.pie.js!
        _getPieDefaultOrderBy: function()
        {
            var cpObj = this,
                view = cpObj._view;
            return _.map(view.displayFormat.valueColumns, function(col)
                {
                    return {
                        ascending: false,
                        expression: {
                            columnId: view.columnForIdentifier(col.fieldName || col.tableColumnId).id,
                            type: 'column'
                        }
                    };
                });
        }
    }, {name: 'chartCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj._view.metadata.availableDisplayTypes, 'chart'); };

    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.chartCreate)
    { $.gridSidebar.registerConfig('visualize.chartCreate', 'pane_chartCreate', 1, 'chart'); }

})(jQuery);

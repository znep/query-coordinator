
/* Misc. functions related to datasets */

blist.namespace.fetch('blist.dataset');

var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline', 'areachart',
    'barchart', 'columnchart', 'linechart', 'piechart', 'intensitymap', 'geomap'];

/* The display type string is not always the simplest thing -- a lot of munging
 * goes on in Raisl; we roughly duplicate it here */
blist.dataset.getDisplayType = function(view)
{
    var type = view.displayType || 'blist';

    if (view.viewType == 'blobby') { type = 'blob'; }
    if (view.viewType == 'href') { type = 'href'; }

    if (!$.isBlank(view.query) && !$.isBlank(view.query.groupBys) &&
        view.query.groupBys.length > 0)
    { type = 'grouped'; }

    if (_.include(VIZ_TYPES, type) || type.startsWith('FCMap_'))
    { type = 'visualization'; }

    if (type == 'blist' && (_.isUndefined(view.flags) ||
        !_.include(view.flags, 'default')))
    { type = 'filter'; }

    return type.capitalize();
};

blist.dataset.getTypeName = function(view)
{
    var dType = blist.dataset.getDisplayType(view);
    var retType;

    switch (dType.toLowerCase())
    {
        case 'blist':
            retType = 'dataset';
            break;
        case 'filter':
            retType = 'filtered view';
            break;
        case 'grouped':
            retType = 'grouped view';
            break;
        case 'visualization':
            retType = 'chart';
            break;
        case 'blob':
            retType = 'embedded file';
            break;
        default:
            retType = dType;
            break;
    }

    return retType;
};

blist.dataset.baseViewCopy = function(view)
{
    return {originalViewId: view.id, query: $.extend(true, {}, view.query),
        displayFormat: $.extend(true, {}, view.displayFormat)};
};

blist.dataset.cleanViewForPost = function(view, includeColumns)
{
    if (includeColumns)
    {
        var cleanColumn = function(col)
        {
            delete col.options;
            delete col.dropDown;
            delete col.renderTypeName;
            delete col.dataTypeName;
        };

        // Clean out dataIndexes, and clean out child metadata columns
        _.each(view.columns, function(c)
        {
            cleanColumn(c);
            if (c.childColumns)
            {
                _.each(c.childColumns, function(cc)
                    { cleanColumn(cc); });
            }
        });

        if (!$.isBlank((view.query || {}).groupBys))
        {
            view.columns = _.reject(view.columns, function(c)
            {
                return $.isBlank((c.format || {}).grouping_aggregate) &&
                    !_.any(view.query.groupBys, function(g)
                    { return g.columnId == c.id; });
            });
        }
    }
    else
    { delete view.columns; }

    delete view.totalRows;
    delete view.grants;
    return view;
};

blist.dataset.convertLegacyChart = function(view)
{
    var LEGACY_CHART_TYPES = {
        imagesparkline: 'line',
        annotatedtimeline: 'timeline',
        areachart: 'area',
        barchart: 'bar',
        columnchart: 'column',
        linechart: 'line',
        piechart: 'pie'
    };

    view.displayFormat = view.displayFormat || {};

    view.displayFormat.chartType = view.displayFormat.chartType ||
        view.displayType;

    view.displayFormat.chartType =
        LEGACY_CHART_TYPES[view.displayFormat.chartType] ||
        view.displayFormat.chartType;

    if ($.isBlank(view.displayFormat.dataColumns) &&
        $.isBlank(view.displayFormat.fixedColumns) &&
        $.isBlank(view.displayFormat.valueColumns))
    {
        view.displayFormat.dataColumns = _(view.columns).chain()
            .reject(function(c) { return c.dataTypeName == 'meta_data' ||
                _.include(c.flags || [], 'hidden'); })
            .sortBy(function(c) { return c.position; })
            .map(function(c) { return c.tableColumnId; })
            .value();
    }

    if (!$.isBlank(view.displayFormat.dataColumns))
    {
        if (!$.isBlank(view.displayFormat.fixedCount))
        {
            view.displayFormat.fixedColumns =
                view.displayFormat.dataColumns.splice(0,
                        view.displayFormat.fixedCount);
        }
        else if ($.isBlank(view.displayFormat.valueColumns) &&
            _.isArray(view.displayFormat.dataColumns) &&
            view.displayFormat.dataColumns.length > 0)
        {
            var firstCol = _.detect(view.columns, function(c)
            { return c.tableColumnId == view.displayFormat.dataColumns[0]; });
            if (!_.include(['number', 'percent', 'money'], firstCol.renderTypeName))
            {
                view.displayFormat.fixedColumns =
                    view.displayFormat.dataColumns.splice(0, 1);
            }
        }

        var valueCols = [];
        var vcVal;
        var i = 0;
        var cols = view.displayFormat.dataColumns.slice();
        while (cols.length > 0)
        {
            var tcid = cols.shift();
            var c = _.detect(view.columns, function(c)
                { return c.tableColumnId == tcid; });
            if (_.include(['number', 'money', 'percent'], c.renderTypeName))
            {
                valueCols.push(vcVal);
                vcVal = {tableColumnId: tcid};
                if (!$.isBlank((view.displayFormat.colors || [])[i]))
                { vcVal.color = view.displayFormat.colors[i]; }
                i++;
                continue;
            }
            vcVal.supplementalColumns = vcVal.supplementalColumns || [];
            vcVal.supplementalColumns.push(tcid);
        }

        valueCols.push(vcVal);
        view.displayFormat.valueColumns = _.compact(valueCols);
    }

    delete view.displayFormat.dataColumns;

    return view;
};


/* Misc. functions related to datasets */

blist.namespace.fetch('blist.dataset');

blist.dataset.columnForTCID = function(view, tcId)
{
    return _.detect(view.columns, function(c)
            { return c.tableColumnId == tcId; });
};

var VIZ_TYPES = ['chart', 'annotatedtimeline', 'imagesparkline', 'areachart',
    'barchart', 'columnchart', 'linechart', 'piechart'];
var MAP_TYPES = ['geomap', 'intensitymap'];

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

    if (_.include(MAP_TYPES, type))
    { type = 'map'; }

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

blist.dataset.isValid = function(view)
{
    if (!$.isBlank(view.message)) { return false; }

    switch(blist.dataset.getDisplayType(view))
    {
        case 'Visualization':
            return blist.dataset.chart.isValid(view);
        case 'Calendar':
            return blist.dataset.calendar.isValid(view);
        case 'Map':
            return blist.dataset.map.isValid(view);
    }

    // Default
    return true;
};

blist.dataset.isPublic = function(view)
{
    return (_.isArray(view.grants) && _.any(view.grants, function(grant)
    {
        return _.include(grant.flags || [], 'public');
    }));
}

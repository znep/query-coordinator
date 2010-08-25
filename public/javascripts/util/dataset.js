
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

    if (_.include(VIZ_TYPES, type)) { type = 'visualization'; }

    if (_.include(MAP_TYPES, type)) { type = 'map'; }

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
        case 'href':
            retType = 'linked dataset';
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
            delete col.cachedContents;
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

blist.dataset.cleanViewForSave = function(view, includeColumns)
{
    view = blist.dataset.cleanViewForPost(view, includeColumns);

    if (!_.isUndefined(view.metadata))
    {
        delete view.metadata.facets;
    }

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

blist.dataset.getLinkedDatasetOptions = function(linkedDatasetUid, col, $field, curVal, useRdfKeyAsDefault)
{
    if (blist.dataset.getLinkedDatasetOptions.cachedLinkedDatasetOptions === undefined)
    {
        blist.dataset.getLinkedDatasetOptions.cachedLinkedDatasetOptions = {};
    }

    var cachedLinkedDatasetOptions = blist.dataset.getLinkedDatasetOptions.cachedLinkedDatasetOptions;

    var viewUid = linkedDatasetUid;
    if ($.isBlank(viewUid) || !viewUid.match(blist.util.patterns.UID))
    {
        return [];
    }

    if (cachedLinkedDatasetOptions[viewUid] == null)
    {
        $.Tache.Get({url: '/api/views/{0}.json'.format(viewUid),
            error: function(req)
            {
                alert('Fail to get columns from dataset {0}.'.format(viewUid));
           },
            success: function(linkedDataset)
            {
                cachedLinkedDatasetOptions[viewUid] = [];
                var cldo = cachedLinkedDatasetOptions[viewUid];

                var opt;
                var rdfSubject = linkedDataset && linkedDataset.metadata &&
                        linkedDataset.metadata.rdfSubject ?
                        linkedDataset.metadata.rdfSubject : undefined;

                _.each(linkedDataset.columns || [], function(c)
                {
                    switch (c.dataTypeName)
                    {
                        case 'text':
                            opt = {value: String(c.id), text: c.name};
                            if (useRdfKeyAsDefault && opt.value === rdfSubject)
                            {
                                opt.selected = true;
                            }
                        //TODO: support other datatype like url
                            cldo.push(opt);
                            break;
                    }
                });

                if (cachedLinkedDatasetOptions[viewUid].length <= 0)
                {
                    alert('Dataset {0} does not have any column.'.format(viewUid));
                }
                else
                {
                    $field.data('linkedFieldValues', '_reset');
                    _.each($field.data('linkedGroup'), function(f) {
                        $(f).trigger('change');
                    });
                    _.defer(function() { $field.val(curVal); });
                }
            }});
         return [];
    }

    return cachedLinkedDatasetOptions[viewUid];
};

blist.dataset.getLinkedDatasetOptionsDefault = function(linkedDatasetUid, col, $field, curVal)
{
    return blist.dataset.getLinkedDatasetOptions(linkedDatasetUid, col, $field, curVal, true);
};

blist.dataset.getLinkedDatasetOptionsNoDefault = function(linkedDatasetUid, col, $field, curVal)
{
    return blist.dataset.getLinkedDatasetOptions(linkedDatasetUid, col, $field, curVal, false);
};

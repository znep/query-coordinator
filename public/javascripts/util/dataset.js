
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

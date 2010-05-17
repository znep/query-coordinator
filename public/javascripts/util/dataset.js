
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

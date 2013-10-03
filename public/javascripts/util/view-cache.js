;(function()
{
    if (_.isUndefined(blist.viewCache))
    { blist.viewCache = {}; }
    if (_.isUndefined(blist.sharedDatasetCache))
    { blist.sharedDatasetCache = {}; }

    $.extend(blist.viewCache, {
        invalidate: function(v)
        {
            var uid = _.isString(v) ? v : v.id;
            delete blist.viewCache[uid];
        }
    });
    $.extend(blist.sharedDatasetCache, {
        invalidate: function(v)
        {
            var uid = _.isString(v) ? v : v.id;
            delete blist.sharedDatasetCache[uid];
        }
    });
})();

;(function()
{
    if (_.isUndefined(blist.viewCache))
    {
        blist.viewCache = {};
    }

    $.extend(blist.viewCache, {
        invalidate: function(v)
        {
            var uid = _.isString(v) ? v : v.id;
            delete blist.viewCache[uid];
        }
    });
})();
var navigationUtilNS = blist.namespace.fetch('blist.util.navigation');

// TODO: This whole file should be deprecated once the old dataset page and
// blists list is gone
blist.util.navigation.getViewUrl = function (viewId, args)
{
    // This is the simple URL; it will automatically be redirected to the
    //  authoritative URL by the server
    var url = '/d/' + viewId;
    if (args)
    {
        url += '?' + $.param(args);
    }
    return url;
};

blist.util.navigation.redirectToView = function (viewOrId, args)
{
    if (_.isString(viewOrId))
    { window.location = navigationUtilNS.getViewUrl(viewOrId, args); }
    else if ($.isPlainObject(viewOrId))
    { window.location = $.generateViewUrl(viewOrId); }
};

blist.util.navigation.redirectToNewView = function ()
{
    window.location = '/datasets/new';
};

var navigationUtilNS = blist.namespace.fetch('blist.util.navigation');

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

blist.util.navigation.urlToViewId = function(url)
{
    var matches = url.match(/(\/[a-zA-Z0-9_\-]+){1,2}\/(\w{4}-\w{4})/);
    if (matches && matches.length > 2)
    {
        return matches[2];
    }
    return null;
};

var navigationUtilNS = blist.namespace.fetch('blist.util.navigation');

blist.util.navigation.getViewUrl = function (viewId, args)
{
    // This is the simple URL; it will automatically be redirected to the
    //  authoritative URL by the server
    var url = '/blists/' + viewId;
    if (args)
    {
        url += '?' + $.param(args);
    }
    return url;
};

blist.util.navigation.redirectToView = function (viewId, args)
{
    window.location = navigationUtilNS.getViewUrl(viewId, args);
};

blist.util.navigation.redirectToNewView = function ()
{
    window.location = '/blists/new_blist';
};

var navigationUtilNS = blist.namespace.fetch('blist.util.navigation');

blist.util.navigation.getViewUrl = function (viewId, popup)
{
    // TODO: Is there a better way to get this URL?
    var url = '/blists/' + viewId;
    if (popup !== undefined && popup !== '')
    {
        url += "?popup=" + popup;
    }
    return url;
};

blist.util.navigation.redirectToView = function (viewId, popup)
{
    window.location = navigationUtilNS.getViewUrl(viewId, popup);
};

blist.util.navigation.redirectToNewView = function ()
{
    window.location = '/blists/new_blist';
};

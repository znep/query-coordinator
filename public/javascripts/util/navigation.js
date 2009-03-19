var navigationUtilNS = blist.namespace.fetch('blist.util.navigation');

blist.util.navigation.redirectToView = function (viewId)
{
    // TODO: Is there a better way to get this URL?
    window.location = '/blists/' + viewId;
}

blist.util.navigation.redirectToNewView = function ()
{
    window.location = '/blists/new_blist';
}

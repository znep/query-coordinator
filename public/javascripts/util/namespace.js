// Create blist namespace if DNE
/*global blist: true */
if (!blist)
{
    var blist = {};
}
// Create file namespace if DNE
if (!blist.namespace)
{
    blist.namespace = {};
}

blist.namespace.fetch = function (nsString)
{
    var nsArray = nsString.split('.');
    var curNS = window;
    for (var i = 0; i < nsArray.length; i++)
    {
        var n = nsArray[i];
        if (!curNS[n])
        {
            curNS[n] = {};
        }
        curNS = curNS[n];
    }
    return curNS;
};

// Let scripts know that we're in-browser
blist.inBrowser = true;

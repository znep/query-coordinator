// Create blist namespace if DNE
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
    for each (var n in nsArray)
    {
        if (!curNS[n])
        {
            curNS[n] = {};
        }
        curNS = curNS[n];
    }
    return curNS;
}

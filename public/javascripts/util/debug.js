// extend jQuery with Firebug console logging: http://muzso.hu/2008/03/07/logging-to-the-firebug-console-in-jquery
$.fn.log = function (msg)
{
    if (window.console && window.console.log)
    {
        window.console.log("%s: %o", msg, this);
    }
    return this;
};

// extend jQuery with generic console logging.
$.debug = function(msg)
{
    if (window.console && window.console.log) 
    {
        window.console.log(msg);
    }
}

var debugNS = blist.namespace.fetch('blist.debug');

blist.debug.clearCache = function ()
{
    blist.debug.cache.length = 0;
}

$(function ()
{
    // Alias for inspecting the request cache
    blist.debug.cache = $.Tache.Data;
});

// extend jQuery with Firebug console logging: http://muzso.hu/2008/03/07/logging-to-the-firebug-console-in-jquery
$.fn.log = function (msg)
{
    $.debug(msg, this);
    return this;
};

// extend jQuery with generic console logging.
$.debug = function(msg, obj)
{
    if (window.console && window.console.log)
    {
        obj ? window.console.log("%s: %o", msg, obj) : window.console.log(msg);
    }
    else
    {
        var $console = $('#debug-console');
        if ($console.length < 1)
        {
            $('body').append('<div id="debug-console" style="position:fixed;' +
                'bottom:0;left:0;background-color:white;width:30em;' +
                'height:10em;overflow:auto;"></div>');
            $console = $('#debug-console');
        }
        obj && $.json ?
            $console.append("<p>" + msg + ": " + $.json.serialize(obj) + "</p>") :
            $console.append("<p>" + msg + "</p>");
        $console[0].scrollTop = $console[0].scrollHeight;
    }
};

var debugNS = blist.namespace.fetch('blist.debug');

blist.debug.clearCache = function ()
{
    blist.debug.cache.length = 0;
};

$(function ()
{
    // Alias for inspecting the request cache
    if ($.Tache)
    {
      blist.debug.cache = $.Tache.Data;
    }
});

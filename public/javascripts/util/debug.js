// extend jQuery with Firebug console logging: http://muzso.hu/2008/03/07/logging-to-the-firebug-console-in-jquery
$.fn.log = function (msg, obj)
{
    $.debug(msg, this, obj);
    return this;
};

var debugNS = blist.namespace.fetch('blist.debug');
blist.debug.uid = 0;

// extend jQuery with generic console logging.
$.debug = function(msg, obj, obj2)
{
    msg = '[' + debugNS.uid++ + '] ' + msg;
    if (window.console && window.console.log)
    {
        if (obj)
        {
            if (obj2)
            { window.console.log("%s: %o; %o", msg, obj, obj2); }
            else
            { window.console.log("%s: %o", msg, obj); }
        }
        else
        { window.console.log(msg); }
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
        if (obj && JSON)
        {
            if (obj2)
            { $console.append("<p>" + msg + ": " + JSON.stringify(obj) + "; " +
                JSON.stringify(obj2) + "</p>"); }
            else
            { $console.append("<p>" + msg + ": " + JSON.stringify(obj) + "</p>"); }
        }
        else
        { $console.append("<p>" + msg + "</p>"); }
        $console[0].scrollTop = $console[0].scrollHeight;
    }
};

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

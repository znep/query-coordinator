function trackError(msg, url, line)
{
    alert('Tracking error at ' + url + ': ' + msg + ':' + line);
};

// Override jQuery.event.proxy to wrap events with error-reporting.  This was
//  originally done by overriding bind; however, that messed with unbinding since
//  the original function was hidden from jQuery.  By hooking proxy, we can
//  hook in after jQuery has gotten the original function and given it a guid,
//  so this should be safer
var jQueryEventProxy = jQuery.event.proxy;
jQuery.event.proxy = function(fn, proxy)
{
    var origProxy = jQueryEventProxy(fn, proxy);
    var newProxy = function()
    {
        try
        {
            return origProxy.apply(this, arguments);
        }
        catch(ex)
        {
            trackError(ex.message, ex.fileName, ex.lineNumber);
            throw ex;
        }
    };
    newProxy.guid = origProxy.guid;
    return newProxy;
};

// override jQuery.ready to wrap every $(function() {}); or
// $(document).ready(function() {});
var jQueryReady = jQuery.fn.ready;
jQuery.fn.ready = function(fn) {
    var origFn = fn;
    var wrappedFn = function() {
        try
        {
            origFn.apply(this, arguments);
        }
        catch(ex)
        {
            trackError(ex.message, ex.fileName, ex.lineNumber);
            throw ex;
        }
    };
    fn = wrappedFn;
    
    return jQueryReady.call(this, wrappedFn);
}

// Attach trackError to window's onerror event;
// use onerror instead of $(window).error( ... ) in order to get url and lineNo
window.onerror = function(msg, url, lineNo)
{
    trackError(msg, url, lineNo);
    return false;
};


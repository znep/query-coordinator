function trackError(msg, url, line)
{
    try
    {
        $.ajax({
            data: {
                date: new Date(),
                message: msg,
                url: url,
                line: line
            },
            global: false,
            type: 'POST',
            url: '/errors'
        })
    }
    catch(ignore) {}
};

// override jQuery.fn.bind to wrap every provided function in try/catch
var jQueryBind = jQuery.fn.bind;
jQuery.fn.bind = function(type, data, fn) {
    if(!fn && data && typeof data == 'function')
    {
        fn = data;
        data = null;
    }
    if(fn)
    {
        var origFn = fn;
        var wrappedFn = function() {
            try
            {
                origFn.apply(this, arguments);
            }
            catch(ex)
            {
                trackError(ex.message, ex.fileName, ex.lineNumber);
           }
        };
        fn = wrappedFn;
    }
    return jQueryBind.call(this, type, data, fn);
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
    return true;
};


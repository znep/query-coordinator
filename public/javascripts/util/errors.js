(function() {

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

if (blistEnv == 'staging')
{
    // We'd like to catch errors on events; but jQuery 1.4 changed error handling,
    // and we can no longer easily wrap everything by hooking proxy.
    // So this feature is taken out for now

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
    }
}

})();

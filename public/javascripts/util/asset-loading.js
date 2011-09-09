;(function($) {
var assetNS = blist.namespace.fetch('blist.util.assetLoading');

// Keep a hash of which files have finished processing
var lazyLoadingAssets = {};
// Keep a hash of which files are in the middle of processing
var lazyLoadedAssets = {};
// Keep track of when a callback is allowed to finish
var lazyLoadingJobs = [];
// Appropriate LAB instance
var $lazyLoadLab;

assetNS.loadAssets = function(assets, jsCallback, cssCallback)
{
    if (!$.subKeyDefined(assets, 'stylesheets') && !$.subKeyDefined(assets, 'javascripts'))
    {
        if (_.isFunction(jsCallback)) { jsCallback(); }
        return;
    }

    if (!$.isBlank(assets.stylesheets))
    {
        var sheets = _.map(assets.stylesheets, function(s)
        {
            var sheet = translateUrls('/stylesheets/', [s.sheet || s]);
            if ($.isPlainObject(s)) { s.sheet = sheet[0]; }
            else { s = sheet[0]; }
            return s;
        });
        assetNS.loadStylesheets(sheets, cssCallback);
    }

    if (_.isArray(assets.javascripts) && assets.javascripts.length > 0)
    { assetNS.loadLibraries(translateUrls('/javascripts/', assets.javascripts), jsCallback); }
    else if (_.isFunction(jsCallback)) { jsCallback(); }
};

// Lazy-load JS libraries
assetNS.loadLibraries = function(scriptQueue, callback)
{
    // arrayify to make it loopable if they pass in a string.
    // flatten to bring development packages to toplevel array (preserving order).
    // compact to remove falsy values (because they're not useful).
    var queue = _.compact(_.flatten($.arrayify(scriptQueue)));

    if (_.isEmpty(queue))
    {
        if (_.isFunction(callback)) { callback(); }
        return;
    }

    // We need a single LAB engine instance to work with for this session,
    // so get an initial one if we don't have it already. Trying to keep it around
    // permanently fails in IE after loading the initial package(s).  The previous method
    // of keeping instances in a hash and using the last one fails in FF when loading
    // multiple packages at once.
    $lazyLoadLab = $LAB;

    // add on the job even though we might remove it later, since order isn't guaranteed
    var job = { queue: queue, callback: callback };
    lazyLoadingJobs.push(job);

    var found = false; // found keeps track of whether we have pending jobs
    var loadingItems = [];
    _.each(queue, function(item)
    {
        if (lazyLoadingAssets[item] || lazyLoadedAssets[item])
        {
            if (lazyLoadingAssets[item])
                found = true;

            return;
        }

        if (blist.configuration.development)
        {
            // Microsoft seems to hate adding ?_=123 to veapicore.js,
            // so don't add it since we don't need it.
            var url = item;
            if (item.indexOf('veapicore') < 0)
            {
                // In dev, make the URL unique so we always reload to pick
                // up changes
                url += (item.indexOf('?') >= 0 ? '&' : '?') + $.param({'_': (new Date()).valueOf()});
            }
            $lazyLoadLab = $lazyLoadLab.script(url).wait(function() { checkLoadedLibraries(item); });
        }
        else
        {
            $lazyLoadLab = $lazyLoadLab.script(item);
            loadingItems.push(item);
        }
        lazyLoadingAssets[item] = true;
        found = true;
    });

    if (loadingItems.length > 0)
    {
        $lazyLoadLab = $lazyLoadLab.wait(function()
            { _.each(loadingItems, function(item) { checkLoadedLibraries(item); }); });
    }

    if (!found)
    {
        lazyLoadingJobs = _.without(lazyLoadingJobs, job);
        if (_.isFunction(callback)) { callback(); }
    }
};

assetNS.loadStylesheets = function(sheetQueue, callback)
{
    var sheets = _.reject($.arrayify(sheetQueue), function(item)
    { return lazyLoadedAssets[item.sheet || item]; });

    var loadedCount = 0;
    var reqCount = sheets.length;
    var sheetPieces = '';
    _.each(sheets, function(sheet)
    {
        var url = sheet.sheet || sheet;
        // In dev, make the URL unique so we always reload to pick up changes
        if (blist.configuration.development)
        { url += (url.indexOf('?') >= 0 ? '&' : '?') + $.param({'_': (new Date()).valueOf()}); }

        // So... using the second method to grab stylesheets via Ajax and insert
        // them into the head manually mostly works, and gives us a callback when
        // things are done. It obviously doesn't work for external files;
        // and it also has a slight problem in IE when in an iframe (like the
        // SDP) -- images ref'ed in the stylesheet won't load.  *Also*, IE7
        // won't handle things like direct-child selectors for manually inserted
        // stylesheets. So in any of these cases, load it via a link tag, and
        // hope things look OK, since we don't get a callback.
        if (($.browser.msie && $.browser.majorVersion == 7 && sheet.hasSpecialSelectors) ||
            ($.browser.msie && window.parent != window && sheet.hasImages) ||
            url.startsWith('http://') || url.startsWith('https://'))
        {
            // If the stylesheet is external, then just insert a style tag
            // and hope you don't need to know when it is fully loaded...
            reqCount--;
            // Internet explorer is wonky
            if (document.createStyleSheet)
            { document.createStyleSheet(url); }
            else
            { $('head').append($.tag({tagName: 'link', type: 'text/css', rel: 'stylesheet', href: url})); }
        }
        else
        {
            // Otherwise, we can load it via Ajax and insert them all once they're
            // ready
            $.ajax({url: url, type: 'GET', contentType: 'text/css',
                dataType: 'text', success: function(resp)
                {
                    sheetPieces += resp;
                    loadedCount++;
                    if (loadedCount == reqCount)
                    {
                        $('head').append('<' + 'style type="text/css">' + sheetPieces + '</style>\n');
                        if (_.isFunction(callback)) { callback(); }
                    }
                }});
        }

        lazyLoadedAssets[sheet] = true;
    });
};

var checkLoadedLibraries = function(item)
{
    lazyLoadedAssets[item] = lazyLoadingAssets[item];
    delete lazyLoadingAssets[item];

    var finishedJobs = [];
    _.each(lazyLoadingJobs, function(job)
    {
        if (_.all(job.queue, function(queueItem) { return !_.isUndefined(lazyLoadedAssets[queueItem]); }))
        {
            if (_.isFunction(job.callback)) { job.callback(); }
            finishedJobs.push(job);
        }
    });
    lazyLoadingJobs = _.without.apply(this, [lazyLoadingJobs].concat(finishedJobs));
};

var translateUrls = function(prefix, array)
{
    return _.map(array, function(item)
    {
        if (item && !$.isBlank(item.assets))
        { return blist.assets[item.assets]; }
        else
        {
          // Preserve false/null/external links
          if (item && ! item.startsWith('http') && !item.startsWith('/'))
          { return prefix + item; }
          return item;
        }
    });
};

})(jQuery);

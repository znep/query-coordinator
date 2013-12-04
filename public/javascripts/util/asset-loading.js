;(function($) {
var assetNSName = 'blist.util.assetLoading';
var assetNS = blist.namespace.fetch(assetNSName);

// Keep a hash of which files are in the middle of processing
var lazyLoadingAssets = {libraries: {}, translations: {}};
// Keep a hash of which files have finished processing
var lazyLoadedAssets = {libraries: {}, stylesheets: {}};
// Keep track of when a callback is allowed to finish
var lazyLoadingAssetJobs = [];
var lazyLoadingTranslationJobs = [];
// Appropriate LAB instance
var $lazyLoadLab;

assetNS.loadAssets = function(assets, mainCallback, cssCallback)
{
    if (!$.subKeyDefined(assets, 'stylesheets') && !$.subKeyDefined(assets, 'javascripts') &&
        !$.subKeyDefined(assets, 'templates') && !$.subKeyDefined(assets, 'translations') &&
        !$.subKeyDefined(assets, 'modals') && !$.subKeyDefined(assets, 'newModals'))
    {
        if (_.isFunction(mainCallback)) { mainCallback(); }
        return;
    }

    if (!$.isBlank(assets.stylesheets))
    {
        var sheets = _.map(assets.stylesheets, function(s)
        {
            var sheet = translateUrls('/styles/', [s.sheet || s], 'stylesheets');
            if ($.isPlainObject(s)) { s.sheet = sheet[0]; }
            else { s = sheet[0]; }
            return s;
        });
        assetNS.loadStylesheets(sheets, cssCallback);
    }

    var loadJS = _.isArray(assets.javascripts) && assets.javascripts.length > 0;
    var loadTemplates = _.isArray(assets.templates) && assets.templates.length > 0;
    var loadModals = _.isArray(assets.modals) && assets.modals.length > 0;
    var loadNewModals = _.isArray(assets.newModals) && assets.newModals.length > 0;
    var loadTranslations = _.isArray(assets.translations) && assets.translations.length > 0;
    var finished = _.after(_.compact([loadJS, loadTemplates, loadTranslations, loadModals, loadNewModals]).length,
            function() { if (_.isFunction(mainCallback)) { mainCallback(); } });

    if (loadTemplates)
    { assetNS.loadPartials(translateUrls('/templates/', assets.templates, 'templates'), 'templates', finished); }
    if (loadModals)
    { assetNS.loadPartials(translateUrls('/modals/', assets.modals, 'modals'), 'modals',
            function($newItems)
            {
                if (!$.isBlank($newItems))
                { $newItems.socrataJqm(); }
                finished();
            }); }
    if (loadNewModals)
    { assetNS.loadPartials(translateUrls('/modals/', assets.newModals, 'newModals'), 'newModals', finished); }
    if (loadJS)
    { assetNS.loadLibraries(translateUrls('/javascripts/', assets.javascripts, 'libraries'), finished); }
    if (loadTranslations)
    { assetNS.loadTranslations(assets.translations, finished); }
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
    lazyLoadingAssetJobs.push(job);

    var found = false; // found keeps track of whether we have pending jobs
    var loadingItems = [];
    _.each(queue, function(qItem)
    {
        var item = $.isPlainObject(qItem) ? qItem.url : qItem;
        if (lazyLoadingAssets.libraries[item] || lazyLoadedAssets.libraries[item])
        {
            if (lazyLoadingAssets.libraries[item])
                found = true;

            return;
        }

        var url = item;
        var skipCheck = false;
        if ($.subKeyDefined(qItem, 'jsonp'))
        {
            var jpParam = {};
            var uniqFunc = 'callback_' + _.uniqueId();
            assetNS[uniqFunc] = function() { checkLoadedLibraries(item); };
            jpParam[qItem.jsonp] = assetNSName + '.' + uniqFunc;
            url += (item.indexOf('?') >= 0 ? '&' : '?') + $.param(jpParam);
            skipCheck = true;
        }

        if (blist.configuration.development)
        {
            // Microsoft seems to hate adding ?_=123 to veapicore.js,
            // so don't add it since we don't need it.
            if (item.indexOf('veapicore') < 0)
            {
                // In dev, make the URL unique so we always reload to pick
                // up changes
                url += (item.indexOf('?') >= 0 ? '&' : '?') +
                    $.param({'_': (new Date()).valueOf().toString().slice(0, 9)});
            }
            $lazyLoadLab = $lazyLoadLab.script(url);
            if (!skipCheck)
            { $lazyLoadLab = $lazyLoadLab.wait(function() { checkLoadedLibraries(item); }); }
        }
        else
        {
            $lazyLoadLab = $lazyLoadLab.script(url);
            if (!skipCheck)
            { loadingItems.push(item); }
        }
        lazyLoadingAssets.libraries[item] = true;
        found = true;
    });

    if (loadingItems.length > 0)
    {
        $lazyLoadLab = $lazyLoadLab.wait(function()
            { _.each(loadingItems, function(item) { checkLoadedLibraries(item); }); });
    }

    if (!found)
    {
        lazyLoadingAssetJobs = _.without(lazyLoadingAssetJobs, job);
        if (_.isFunction(callback)) { callback(); }
    }
};

var checkLoadedLibraries = function(item)
{
    lazyLoadedAssets.libraries[item] = lazyLoadingAssets.libraries[item];
    delete lazyLoadingAssets.libraries[item];

    var finishedJobs = [];
    _.each(lazyLoadingAssetJobs, function(job)
    {
        if (_.all(job.queue, function(queueItem)
            { return !_.isUndefined(lazyLoadedAssets.libraries[$.isPlainObject(queueItem) ?
                queueItem.url : queueItem]); }))
        {
            if (_.isFunction(job.callback)) { job.callback(); }
            finishedJobs.push(job);
        }
    });
    lazyLoadingAssetJobs = _.without.apply(this, [lazyLoadingAssetJobs].concat(finishedJobs));
};

assetNS.loadStylesheets = function(sheetQueue, callback)
{
    var sheets = _($.makeArray(sheetQueue)).chain()
        .map(function(item) { return !$.subKeyDefined(item, 'sheet') ? {sheet: item} : item; })
        .map(function(item)
        {
            return _.isArray(item.sheet) ? _.map(item.sheet, function(s)
                { return $.extend({}, item, {sheet: s}); }) : item;
        })
        .flatten()
        .reject(function(item) { return lazyLoadedAssets.stylesheets[item.sheet]; }).value();
    // We don't care about currently loading sheets, because Tache will properly handle
    // de-duping those; and this way we get the proper callbacks.

    var loadedCount = 0;
    var reqCount = sheets.length;
    var sheetPieces = '';
    _.each(sheets, function(sheet)
    {
        var url = sheet.sheet;
        // In dev, make the URL unique so we always reload to pick up changes
        if (blist.configuration.development)
        {
            url += (url.indexOf('?') >= 0 ? '&' : '?') +
                $.param({'_': (new Date()).valueOf().toString().slice(0, 9)});
        }

        // So... using the second method to grab stylesheets via Ajax and insert
        // them into the head manually mostly works, and gives us a callback when
        // things are done. It obviously doesn't work for external files;
        // and it also has a slight problem in IE when in an iframe (like the
        // SDP) -- images ref'ed in the stylesheet won't load.  *Also*, IE7
        // won't handle things like direct-child selectors for manually inserted
        // stylesheets. Oh, and apparently IE (iframe or not) needs the same
        // fix for sheets with fonts. So in any of these cases, load it via a
        // link tag, and hope things look OK, since we don't get a callback.
        if (($.browser.msie && $.browser.majorVersion == 7 && sheet.hasSpecialSelectors) ||
            ($.browser.msie && window.parent != window && sheet.hasImages) ||
            ($.browser.msie && sheet.hasFonts) ||
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
            $.socrataServer.makeRequest({url: url, contentType: 'text/css', pageCache: true,
                dataType: 'text', success: function(resp)
                {
                    loadedCount++;
                    if (!lazyLoadedAssets.stylesheets[sheet.sheet])
                    {
                        sheetPieces += resp;
                        lazyLoadedAssets.stylesheets[sheet.sheet] = true;
                    }
                    if (loadedCount == reqCount)
                    {
                        $('head').append('<' + 'style type="text/css">' + sheetPieces + '</style>\n');
                        if (_.isFunction(callback)) { callback(); }
                    }
                }});
        }
    });
};

assetNS.loadPartials = function(partialQueue, type, callback)
{
    if ($.isBlank(lazyLoadedAssets[type]))
    { lazyLoadedAssets[type] = {}; }

    var partials = _.reject($.arrayify(partialQueue), function(item)
        { return lazyLoadedAssets[type][item]; });

    if (partials.length < 1)
    {
        if (_.isFunction(callback)) { callback(); }
        return;
    }

    var partialPieces = '';
    var insertPartials = _.after(partials.length, function()
    {
        var $partials = $('#' + type);
        if ($partials.length < 1)
        {
            $('body').append($.tag({tagName: 'div', id: type}));
            $partials = $('#' + type);
        }
        var $pieces = $(partialPieces);
        $partials.append($pieces);
        if (_.isFunction(callback)) { callback($pieces); }
    });

    _.each(partials, function(partial)
    {
        var url = partial;
        // In dev, make the URL unique so we always reload to pick up changes
        if (blist.configuration.development)
        {
            url += (url.indexOf('?') >= 0 ? '&' : '?') +
                $.param({'_': (new Date()).valueOf().toString().slice(0, 9)});
        }

        // Load it via Ajax and insert them all once they're ready
        $.socrataServer.makeRequest({url: url, pageCache: true, dataType: 'text', contentType: 'text/html',
            success: function(resp)
            {
                if (!lazyLoadedAssets[type][partial])
                { partialPieces += resp; }
                insertPartials();
                lazyLoadedAssets[type][partial] = true;
            }});

    });
};

// TODO: translation globbing. but i'm not convinced that more than one translation
// will be requested at a time, ever.
assetNS.loadTranslations = function(translations, callback)
{
    var trackedTranslations = _.filter($.arrayify(translations), function(translation)
    {
        var force = false;

        if ($.isPlainObject(translation))
        { force = translation.force; translation = translation.key; }
        if ($.subKeyDefined(blist.translations, translation) && !force)
            return false; // we already have this
        if (lazyLoadingAssets.translations[translation] === true)
            return true; // we're already working on this

        lazyLoadingAssets.translations[translation] = true;

        $.socrataServer.makeRequest({
            url: '/' + blist.locale + '/translations/' + translation.replace(/\./g, '/'),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response)
            {
                $.extend(true, blist.translations, response);
                checkTranslationJobs();
            }
        });
        return true;
    });

    if (trackedTranslations.length > 0)
    {
        lazyLoadingTranslationJobs.push({ queue: trackedTranslations,
            callback: callback });
    }
    else if (_.isFunction(callback))
    { callback(); }
};
var checkTranslationJobs = function()
{
    lazyLoadingTranslationJobs = _.filter(lazyLoadingTranslationJobs, function(job)
    {
        if (_.all(job.queue, function(translation)
            { return $.subKeyDefined(blist.translations, translation.key || translation); }))
        {
            job.callback();
            return false;
        }
        return true;
    });
};

var translateUrls = function(prefix, array, type)
{
    return _.map(array, function(item)
    {
        if ($.subKeyDefined(item, 'assets') && $.subKeyDefined(blist, 'assets.' + type))
        { return blist.assets[type][item.assets]; }
        else
        {
            var u = $.isPlainObject(item) ? item.url : item;
            // Preserve false/null/external links
            if (u && !u.startsWith('http') && !u.startsWith('/'))
            { u = prefix + u; }
            if ($.isPlainObject(item)) { item.url = u; }
            else { item = u; }
            return item;
        }
    });
};

})(jQuery);

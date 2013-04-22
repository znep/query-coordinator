;(function() {
    var sanitizerUtilsNS = blist.namespace.fetch('blist.util.htmlSanitizer');

    var permissiveHtmlSanitizer;
    var restrictiveHtmlSanitizer;

    //Sanitizes the given HTML using a moderate whitelist, allowing tags and
    // attributes expected from Markdown rendering.
    sanitizerUtilsNS.sanitizeHtmlPermissive = function(inputHtml)
    {
        if(!permissiveHtmlSanitizer)
        {
            // Fully-permissive URI rewriter. The sanitizer already does scheme
            // whitelisting before calling this function.
            var uriRewriter = function(uri)
            {
                return uri;
            };

            var tagPolicy = html.makeTagPolicy(
                html4.ELEMENTS_RELAXED,
                html4.ATTRIBS_RELAXED,
                uriRewriter);

            // Create the sanitizer. Note that the last two arguments are
            // not present in the stock Caja sanitizer - they were added
            // in-house.
            permissiveHtmlSanitizer = html.makeHtmlSanitizer(tagPolicy, html4.ELEMENTS_RELAXED, html4.ATTRIBS_RELAXED);
        }

        var outputArray = [];
        permissiveHtmlSanitizer(inputHtml, outputArray);
        return outputArray.join('');
    },

    // Strip all HTML from the input except for span and div tags.
    // Only class attributes are allowed.
    sanitizerUtilsNS.sanitizeHtmlRestrictive = function(inputHtml)
    {
        if(!restrictiveHtmlSanitizer)
        {
            var tagPolicy = html.makeTagPolicy(
                html4.ELEMENTS_MINIMAL,
                html4.ATTRIBS_MINIMAL);

            // Create the sanitizer. Note that the last two arguments are
            // not present in the stock Caja sanitizer - they were added
            // in-house.
            restrictiveHtmlSanitizer = html.makeHtmlSanitizer(tagPolicy, html4.ELEMENTS_MINIMAL, html4.ATTRIBS_MINIMAL);
        }

        var outputArray = [];
        restrictiveHtmlSanitizer(inputHtml, outputArray);
        return outputArray.join('');
    }
})();

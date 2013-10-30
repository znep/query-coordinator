;(function() {
    var markdownUtilsNS = blist.namespace.fetch('blist.util.markdown');

    var showdown;

    markdownUtilsNS.getMarkdownRenderer = function()
    {
        if (!showdown)
        {
            showdown = new Showdown.converter();
        }

        return showdown;
    }

    markdownUtilsNS.convertMarkdownToHtml = function(markdown)
    {
        var converter = blist.util.markdown.getMarkdownRenderer();

        return converter.makeHtml(markdown);
    };

    // Markdown will munge things like http://my_domain_test.com/, as it thinks
    // those underscores mean <em> or <strong>.
    markdownUtilsNS.escapeLinksInMarkdown = function(markdown)
    {
        return markdown.replace(blist.util.autolinker.urlMatcher, function(url)
        {
            return url.replace(/_/g, "\\_");
        });
    };

})();

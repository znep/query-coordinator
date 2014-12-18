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
    // However if we're using the annotation link format, don't escape those...
    markdownUtilsNS.escapeLinksInMarkdown = function(markdown)
    {
        markdown = markdown || '';
        var locOfToc = markdown.search(/^\[\d+\]: [^\s]+$/m);
        var escapedSection = '';
        var plainSection = '';
        if (locOfToc > 0)
        {
            escapedSection = markdown.substr(0, locOfToc);
            plainSection = markdown.substr(locOfToc);
        }
        else
        {
            escapedSection = markdown;
        }

        var urlMatcherSource = blist.util.autolinker.urlMatcher.source;
        var globalUrlMatcher = new RegExp(urlMatcherSource, "g");
        escapedSection = escapedSection.replace(globalUrlMatcher, function(url)
        {
            return url.replace(/_/g, "\\_");
        });

        return escapedSection + plainSection;
    };

})();

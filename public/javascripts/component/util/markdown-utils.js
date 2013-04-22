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

})();

// A component that supports the display of Markdown content.
$.component.Component.extend('Formatted Text', 'content', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'sanitize-html' }, { assets: 'markdown-render' }]
        };
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [{ assets: 'content-editable' }, { assets: 'markdown-create' }]
        };
    },

    //Sanitizes the given HTML using a moderate whitelist, allowing tags and
    // attributes expected from Markdown rendering.
    // Keep this in sync with FormattedText in misc.rb!
    _sanitizeDisplayHtml: function(unsafeHtml)
    {
        return blist.util.htmlSanitizer.sanitizeHtmlPermissive(unsafeHtml);
    },

    // Renders the given Markdown document, then passes the resultant HTML
    // through a relaxed sanitizer before returning it. All HTML is removed
    // from the Markdown _before_ conversion, except for span and div tags.
    // Only class attributes are allowed for those tags.
    _safeRenderMarkdown: function(markdownDocument)
    {
        var cObj = this;


        //Removes all HTML from a Markdown document, except spans and divs with
        // only a class attribute (to allow for extra styling).
        // Keep this in sync with FormattedText in misc.rb!
        var safeMarkdown = blist.util.htmlSanitizer.sanitizeHtmlRestrictive(markdownDocument);

        //Render the given Markdown document into HTML.
        // Keep this in sync with FormattedText in misc.rb!
        var unsafeHtmlResult = blist.util.markdown.convertMarkdownToHtml(safeMarkdown);

        //Safe-ify the result.
        var safeHtmlResult = cObj._sanitizeDisplayHtml(unsafeHtmlResult);

        return safeHtmlResult;
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments))
        {
            return false;
        }

        var cObj = this;
        var doRender = function()
        {
            var substitutionTarget = cObj._properties.markdown;
            var markdown;
            var safeHtmlResult;
            if (!$.isBlank(substitutionTarget))
            {
                markdown = cObj._stringSubstitute(substitutionTarget);
                safeHtmlResult = cObj._safeRenderMarkdown(markdown);
            }
            cObj.$contents.html(safeHtmlResult);
        }

        if (!cObj._updateDataSource(cObj._properties, doRender))
        {
            doRender();
        }

        return true;
    },

    _propWrite: function(properties)
    {
        var cObj = this;
        cObj._super(properties);
        if (!_.isEmpty(properties))
        {
            if (!cObj._editing)
            {
                cObj._render();
            }
            else
            {
                var doEdit = function()
                {
                    cObj.edit(true);
                    cObj.editFocus(true);
                };
                if (!cObj._updateDataSource(cObj._properties, doEdit))
                {
                    doEdit();
                }
            }
        }
    },

    _valueKey: function()
    { return 'markdown'; },

    configurationSchema: function()
    { return { schema: [{ fields: [$.extend($.cf.contextPicker(), {required: false})] }] }; },

    editFocus: function(focused)
    {
        if (!this._super.apply(this, arguments))
        {
            return false;
        }

        if (focused)
        {
            return true;
        }

        $.cf.extractProperties(this.$contents);
        var contHtml = this.$contents.html();
        var sanitizedHtml = this._sanitizeDisplayHtml(contHtml);
        var markdown = HTML2Markdown(sanitizedHtml);

        this._updatePrimaryValue(markdown);
        return true;
    },

    edit: function()
    {
        var cObj = this;
        var wasEditable = cObj._editing;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        cObj.$contents.toggleClass('socrata-cf-mouse', cObj._editing);

        // Animate height
        var origHeight = cObj.$dom.height();

        if (cObj._editing)
        {
            // Install raw template for editing
            if (!wasEditable)
            {
                var markdown = cObj._properties.markdown;
                var safeHtmlResult;

                if (!$.isBlank(markdown))
                {
                    safeHtmlResult = cObj._safeRenderMarkdown(markdown);
                }

                cObj.$contents.html(safeHtmlResult);

                $.cf.enhanceProperties(cObj.$contents);
            }
        }
        else if (wasEditable)
        {
            cObj._render();
        }

        var newHeight = cObj.$dom.height();
        cObj.$dom.height(origHeight);
        cObj.$dom.animate({height: newHeight}, 'slow', function() { cObj.$dom.height(''); });
    }
});

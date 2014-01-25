// A component that supports the display of Markdown content.
$.component.Component.extend('Formatted Text', 'content', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'sanitize-html' }, { assets: 'autolink-html' }, { assets: 'markdown-render' }]
        };
    },

    _getEditAssets: function()
    {
        return {
            javascripts: [{ assets: 'content-editable' }, { assets: 'markdown-create' }],
            stylesheets: [{ assets: 'markdown-create' }],
            translations: ['plugins.hallo']
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
            var finalHtmlResult;
            if (!$.isBlank(substitutionTarget))
            {
                markdown = blist.util.markdown.escapeLinksInMarkdown(cObj._stringSubstitute(substitutionTarget));
                safeHtmlResult = cObj._safeRenderMarkdown(markdown);
                finalHtmlResult = blist.util.autolinker.autolinkHtml(safeHtmlResult);
            }
            cObj.$contents.html(finalHtmlResult || '');
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
        var markdown = '';

        if (sanitizedHtml)
        {
            // Beware HTML2Markdown will convert the entire document
            // if its argument is falsy.
            markdown = HTML2Markdown(sanitizedHtml);
        }

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
            if (!wasEditable)
            {
                // Install raw template for editing.

                var markdown = cObj._properties.markdown;
                var safeHtmlResult;

                if (!$.isBlank(markdown))
                {
                    safeHtmlResult = cObj._safeRenderMarkdown(blist.util.markdown.escapeLinksInMarkdown(markdown));
                }

                cObj.$contents.html(safeHtmlResult);

                $.cf.enhanceProperties(cObj.$contents, true /* Let newlines through in editor*/ );

                // Set up Hallo editor.
                cObj.$contents.hallo(
                    {
                        editable: true,
                        toolbar: 'halloToolbarContextual',
                        forceStructured: true,
                        execCommandOverride: _.bind(this._onEditorExecCommand, this),
                        plugins:
                        {
                            halloformat:
                            {
                                formatting:
                                {
                                    bold: true, italic: true
                                }
                            },
                            halloheadings: {},
                            halloreundo: {},
                            hallolists: {},
                            halloplainpaster: {}
                        }
                    });
            }
        }
        else if (wasEditable)
        {
            // Disable Hallo editor.
            cObj.$contents.hallo({editable: false});

            cObj._render();
        }

        var newHeight = cObj._getNumericalPropertyWithFallback('height', cObj.$dom.height());
        cObj.$dom.height(origHeight);
        cObj.$dom.animate({height: newHeight}, 'slow', function() { cObj.$dom.height(cObj._getNumericalPropertyWithFallback('height', '')); });
    },

    _onEditorExecCommand: function(command, useDefaultUi, value)
    {
        var retVal = false;

        if ($.browser.webkit)
        {
            // Now this is really bad. Chrome (and possibly future browsers)
            // like to try and preserve styling when executing these commands.
            // Sadly, it fails badly. For one example among many, it doesn't
            // understand that em measures stack, so text ends up changing size
            // unexpectedly. So... we temporarily add this font-style to our
            // component as a sentinel. Chrome will lap this right up and apply
            // it as a new span's inline style around whatever it adds. We can
            // then find this span and nuke it. Just don't tell Chrome, it's
            // only trying to help. Chrome tries to propagate a small subset of
            // properties - the font-weight is the most obscure while still not
            // confusing commands like bold and italic. See:
            // http://code.google.com/p/chromium/issues/detail?id=149901
            // Of course this is not guaranteed to avoid stripping out actually-
            // entered formatting, but since Markdown doesn't support lighter
            // text, this shouldn't matter too much.
            this.$dom.css('font-weight', 'lighter');
            try
            {
                retVal = document.execCommand(command, useDefaultUi, value);
                this.$dom.find("span[style*=lighter]:first-child").filter( function()
                {
                    // If another property is set, Chrome didn't add this.
                    return this.attributes.length == 1;
                }).contents().unwrap();
            }
            finally
            {
                this.$dom.css('font-weight', '');
            }

        }
        else
        {
            retVal = document.execCommand(command, useDefaultUi, value);
        }

        return retVal;
    },

    // Called when someone starts resizing us via the resize handle.
    _onUiResizableResizeStart: function()
    {
        // If we have a min-height, it will interfere with ui-resizable's
        // use of the height property (in effect making our container enlarge-
        // only). Kill min-height for now; we'll put it back when resize ends.
        this.$dom.css('min-height', '');
    },

    // Called when someone stops resizing us via the resize handle. We override
    // this because unlike other components, formatted-text sets min-height instead
    // of height upon resize.
    _onUiResizableResizeStop: function()
    {
        var newPropertyValues =
        {
            minHeight: this.$dom.height(),
            height: undefined
        };

        this._executePropertyUpdate(newPropertyValues);

        delete this._properties.height;

        // The resizing handle will have set this. We're fine with it during
        // the resize, but once it is dropped, it's time to take our natural
        // size.
        this.$dom.height('');
    }
});

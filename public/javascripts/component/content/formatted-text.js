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
            javascripts: [{ assets: 'content-editable' }, { assets: 'markdown-create' }],
            stylesheets: [{ assets: 'markdown-create' }]
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

    // Given an HTML document or snippet, wrap any bits of text that look like
    // URLs in <a/> tags, unless they're already within an <a/>.
    // Keep this in sync with FormattedText's implementation in misc.rb.
    _autoHyperlinkHtml: function(htmlText)
    {
        // Instead of invoking the wrath of the Old Ones by trying to parse HTML
        // with a regex, we use the SAX parser provided by the HTML sanitizer.
        // It basically acts as a fully-permissive whitelist, but sneakily adds
        // <a href=/> tags to pcdata not inside an <a/> with an href.

        var linkifyPlainText = function(plainText)
        {
            // Taken from this fine establishment:
            // http://daringfireball.net/2010/07/improved_regex_for_matching_urls
            var urlMatcher = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
            var hasProtocolMatcher = /[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])/;

            var linkifiedHtml = plainText.replace(urlMatcher, function(matchedSubstring)
            {
                var linkUrl;
                // The regex matches things like www.socrata.com or socrata.com/foo.html.
                // If such a protocol-less URI was matched, use the default HTTP protocol.
                if (hasProtocolMatcher.test(matchedSubstring))
                {
                    linkUrl = matchedSubstring;
                }
                else
                {
                    linkUrl = 'http://' + matchedSubstring;
                }

                "<a class=\"auto_link\" href=\"#{link_url}\">#{matched_substring}</a>"
                return '<a class="auto_link" href="' +
                        encodeURI(linkUrl) +
                        '" rel="nofollow external">' +
                        matchedSubstring +
                        '</a>';
            });

            return linkifiedHtml;
        }

        var elementFlags = html4.ELEMENTS_RELAXED;
        var anchorTagStack = [];
        var anchorWithHrefCount = 0;
        var outArray = [];
        // used to collapse multiple character runs.
        var currentLinkifiableCharactersRun = '';

        var emit = function(text)
        {
            outArray.push(text);
        };

        // Terminate the current linkifiable characters run, as queued by calls to
        // appendCharacters with shouldLinkify=true. Runs the actual linkifying.
        var emitAndFlushLinkifiableCharactersRun = function()
        {
            if (currentLinkifiableCharactersRun !== '')
            {
                emit(linkifyPlainText(currentLinkifiableCharactersRun));
                currentLinkifiableCharactersRun = '';
            }
        };

        // We need to correctly collapse multiple consecutive character
        // runs, as the parser splits around things like HTML entities.
        // This is a problem because we may need to linkify across character runs.
        var appendCharacters = function(plainText, shouldLinkify)
        {
            if (shouldLinkify)
            {
                currentLinkifiableCharactersRun += plainText;
            }
            else
            {
                emitAndFlushLinkifiableCharactersRun();
                emit(plainText);
            }
        }

        // The event handlers try to match the ones in auto_linker.rb as closely
        // as possible.
        var doParse = html.makeSaxParser(
            {
                startDoc: function ()
                {
                },

                startTag: function (tagName, attribs)
                {
                    emitAndFlushLinkifiableCharactersRun();
                    // We don't expect these tags here. If they show up, don't
                    // emit them.
                    if (tagName === 'html' || tagName === 'body')
                    { return; }

                    var eflags = elementFlags[tagName];
                    var hasHref = false;

                    emit('<');
                    emit(tagName);
                    for (var i = 0, n = attribs.length; i < n; i += 2)
                    {
                      var attribName = attribs[i],
                          value = attribs[i + 1];
                      if (value !== null && value !== void 0)
                      {
                        emit(' ');
                        emit(attribName);
                        emit('="');
                        emit(html.escapeAttrib(value));
                        emit ('"');
                        hasHref |= (attribName === 'href');
                      }
                    }

                    if (eflags & (html4.eflags['EMPTY'] | html4.eflags['FOLDABLE']))
                    {
                        emit('/>');
                    }
                    else
                    {
                        emit('>');
                    }

                    if (tagName == 'a')
                    {
                        anchorTagStack.push(hasHref);
                        anchorWithHrefCount += hasHref ? 1 : 0;
                    }
                },

                endTag: function (tagName)
                {
                    emitAndFlushLinkifiableCharactersRun();

                    // We don't expect these tags here. If they show up, don't
                    // emit them.
                    if (tagName === 'html' || tagName === 'body')
                    { return; }

                    var eflags = elementFlags[tagName];
                    if (!(eflags & (html4.eflags['EMPTY'] | html4.eflags['FOLDABLE'])))
                    {
                        emit('<\/');
                        emit(tagName);
                        emit('>');
                    }

                    if (tagName == 'a')
                    {
                        var hadHref = anchorTagStack.pop();
                        anchorWithHrefCount -= hadHref ? 1 : 0;
                    }

                },

                pcdata: function (plainText)
                {
                    // plainText has entities replaced with the literal value.
                    // Only linkify if we're not in <a> with an href.
                    // We need to correctly collapse multiple consecutive character
                    // runs, as the parser splits around things like HTML entities.

                    var shouldLinkify = (anchorWithHrefCount == 0);

                    appendCharacters(plainText, shouldLinkify);
                },

                rcdata: function (plainText)
                {
                    // contents of a TITLE, TEXTAREA, or similar tag.
                    emitAndFlushLinkifiableCharactersRun();
                    emit(plainText);
                },

                cdata: function (plainText)
                {
                    // contents of a SCRIPT, STYLE, XMP, or similar tag.
                    emitAndFlushLinkifiableCharactersRun();
                    emit(plainText);
                },

                endDoc: function ()
                {
                    emitAndFlushLinkifiableCharactersRun();
                }
            }, html4.ELEMENTS_RELAXED);

        doParse(htmlText);

        if (anchorTagStack.length || anchorWithHrefCount)
        {
            console.error('Linkifier parse error. Stack depth: ' + anchorTagStack.length);
        }

        return outArray.join('');
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
                markdown = cObj._stringSubstitute(substitutionTarget);
                safeHtmlResult = cObj._safeRenderMarkdown(markdown);
                finalHtmlResult = cObj._autoHyperlinkHtml(safeHtmlResult);
            }
            cObj.$contents.html(finalHtmlResult);
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
                    safeHtmlResult = cObj._safeRenderMarkdown(markdown);
                }

                cObj.$contents.html(safeHtmlResult);

                $.cf.enhanceProperties(cObj.$contents, true /* Let newlines through in editor*/ );

                // Set up Hallo editor.
                cObj.$contents.hallo(
                    {
                        editable: true,
                        toolbar: 'halloToolbarContextual',
                        forceStructured: true,
                        execCommandOverride: this._onEditorExecCommand.bind(this),
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

        var newHeight = cObj.$dom.height();
        cObj.$dom.height(origHeight);
        cObj.$dom.animate({height: newHeight}, 'slow', function() { cObj.$dom.height(''); });
    },

    _onEditorExecCommand: function(command, useDefaultUi, value)
    {
        var retVal = false;

        // Now this is really bad. Chrome (and possibly future browsers)
        // like to try and preserve styling when executing these commands.
        // Sadly, it fails badly. For one example among many, it doesn't
        // understand that em measures stack, so text ends up changing size
        // unexpectedly. So... we temporarily add this font-style to our
        // component as a sentinel. Chrome will lap this right up and apply
        // it as a new span's inline style around whatever it adds. We can
        // then find this span and nuke it. Just don't tell Chrome, it's
        // only trying to help. Chrome tries to propagate a small subset of
        // properties - the font-style one is the most obscure. See:
        // http://code.google.com/p/chromium/issues/detail?id=149901
        // Of course this is not guaranteed to avoid stripping out actually-
        // entered formatting, but since Markdown doesn't support oblique
        // text, this shouldn't matter too much.
        this.$dom.css('font-style', 'oblique');
        try
        {
            retVal = document.execCommand(command, useDefaultUi, value);
            this.$dom.find("span[style*=oblique]:first-child").filter( function()
            {
                // If another property is set, Chrome didn't add this.
                return this.attributes.length == 1;
            }).contents().unwrap();
        }
        finally
        {
            this.$dom.css('font-style', '');
        }

        return retVal;
    }
});

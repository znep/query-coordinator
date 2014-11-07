;(function() {
    var autolinkerNS = blist.namespace.fetch('blist.util.autolinker');

    // Taken from this fine establishment:
    // http://daringfireball.net/2010/07/improved_regex_for_matching_urls
    autolinkerNS.urlMatcher = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;
    autolinkerNS.hasProtocolMatcher = /[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])/;

    // Given an HTML document or snippet, wrap any bits of text that look like
    // URLs in <a/> tags, unless they're already within an <a/>.
    // Keep this in sync with FormattedText's implementation in misc.rb.
    autolinkerNS.autolinkHtml = function(htmlText)
    {
        // Instead of invoking the wrath of the Old Ones by trying to parse HTML
        // with a regex, we use the SAX parser provided by the HTML sanitizer.
        // It basically acts as a fully-permissive whitelist, but sneakily adds
        // <a href=/> tags to pcdata not inside an <a/> with an href.

        var linkifyPlainText = function(plainText)
        {
            var linkifiedHtml = plainText.replace(autolinkerNS.urlMatcher, function(matchedSubstring)
            {
                var linkUrl;
                // The regex matches things like www.socrata.com or socrata.com/foo.html.
                // If such a protocol-less URI was matched, use the default HTTP protocol.
                if (autolinkerNS.hasProtocolMatcher.test(matchedSubstring))
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
    };

})();

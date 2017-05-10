/**
 * Awesomecomplete — A lightweight, simple autocomplete plugin
 *  Clint Tseng (clint@dontexplain.com) — 2009-08-20
 *    I think licenses are dumb and superfluous. I'm releasing this into the
 *    wild under public domain, but please do let me know what you think!
 */

(function($)
{
    var ident = 0;

    // Initializer. Call on a text field to make things go.
    $.fn.awesomecomplete = function(options)
    {
        var options = $.extend({}, $.fn.awesomecomplete.defaults, options);

        return this.each(function()
        {
            var $this = $(this);
            var config = $.meta ? $.extend({}, options, $this.data()) : options;
            $this.data('awesomecomplete-config', config);

            var $attachTo = $(config.attachTo || $this);
            width = $attachTo.innerWidth();
            if (width === 0) {
              width = '100%';
            }
            var $list = $('<ul/>').addClass(config.suggestionListClass)
                                  .insertAfter($attachTo)
                                  .hide()
                                  .css('width', width);
            $this.data('awesomecomplete-list', $list);

            var typingDelayPointer;
            var suppressKey = false;
            $this.keyup(function(event)
            {
                if (suppressKey)
                {
                    suppressKey = false;
                    return;
                }

                // ignore arrow keys, shift
                if ( ((event.which > 36) && (event.which < 41)) ||
                     (event.which == 16) )
                    return;

                if (config.typingDelay > 0)
                {
                    clearTimeout(typingDelayPointer);
                    typingDelayPointer = setTimeout(function() { processInput($this); }, config.typingDelay);
                }
                else
                {
                    processInput($this);
                }
            });

            $this.keydown(function(event)
            {
                // enter = 13; up = 38; down = 40; esc = 27
                var $active = $list.children('li.' + config.activeItemClass);
                switch (event.which)
                {
                    case 13:
                        if (($active.length !== 0) && ($list.is(':visible')))
                        {
                            event.preventDefault();
                            $this.val($active.data('awesomecomplete-value'));
                            config.onComplete($active.data('awesomecomplete-dataItem'), $this);
                            $list.hide();
                        }
                        config.blurFunction($list);
                        $list.hide();
                        suppressKey = true;
                        break;
                    case 38:
                        event.preventDefault();
                        var $newActive;
                        if ($active.length === 0)
                        {
                            $newActive = $list.children('li:last-child');
                        }
                        else if ($active.is(':not(:first-of-type'))
                        {
                            $newActive = $active.prev();
                            $active.removeClass(config.activeItemClass);
                        }
                        else
                        {
                          $newActive = $list.children('li:last-child');
                          $active.removeClass(config.activeItemClass);
                        }
                        while (config.skipBlankValues && $newActive.length > 0 &&
                                $.isBlank($newActive.data('awesomecomplete-value')))
                        { $newActive = $newActive.prev(); }
                        $newActive.addClass(config.activeItemClass);
                        break;
                    case 40:
                        event.preventDefault();
                        var $newActive;
                        if ($active.length === 0)
                        {
                            $newActive = $list.children('li:first');
                        }
                        else if ($active.is(':not(:last-child)'))
                        {
                            $newActive = $active.next();
                            $active.removeClass(config.activeItemClass);
                        }
                        else
                        {
                          $newActive = $list.children('li:first');
                          $active.removeClass(config.activeItemClass);
                        }
                        if (!$.isBlank($newActive))
                        {
                            while (config.skipBlankValues && $newActive.length > 0 &&
                                    $.isBlank($newActive.data('awesomecomplete-value')))
                            { $newActive = $newActive.next(); }
                            $newActive.addClass(config.activeItemClass);
                        }
                        break;
                    case 27:
                        config.blurFunction($list);
                        $list.hide();
                        suppressKey = true;
                        break;
                }
            });

	         // opera wants keypress rather than keydown to prevent the form submit
            $this.keypress(function(event)
            {
                var $active = $list.children('li.' + config.activeItemClass);

            		if ((event.which == 13) && ($list.children('li.' + config.activeItemClass).length > 0)) {
            		    event.preventDefault();
            		}
            });

            // stupid hack to get around loss of focus on mousedown
            var mouseDown = false;
            var blurWait = false;
            $(document).bind('mousedown.awesomecomplete' + (++ident), function()
            {
                mouseDown = true;
            });
            $(document).bind('mouseup.awesomecomplete' + ident, function()
            {
                mouseDown = false;
                if (blurWait)
                {
                    blurWait = false;
                    config.blurFunction($list);
                    $list.hide();
                }
            });
            $this.blur(function()
            {

                if (mouseDown)
                {
                    blurWait = true;
                }
                else
                {
                    var $active = $list.children('li.' + config.activeItemClass);
                    if ($list.is(':visible') && ($active.length !== 0))
                    {
                        $this.val($active.data('awesomecomplete-value'));
                        config.onComplete($active.data('awesomecomplete-dataItem'), $this);
                    }
                    config.blurFunction($list);
                    $list.hide();
                }
            });
            $this.focus(function()
            {
                if ($list.children(':not(.' + config.noResultsClass + ')').length > 0)
                {
                    if (config.initDelay > 0)
                    {
                        setTimeout(function() { doShow($this); }, config.initDelay);
                    }
                    else
                    {
                        doShow($this);
                    }

                }
                else if (config.showAll)
                { processInput($this); }
            });
        });
    };

    // Data callback.  If you're using callbacks to a server,
    // call this on the autocompleted text field to complete the
    // callback process after you have your matching items.
    var onDataProxy = function($this, term)
    {
        return function(data)
        {
            processData($this, data, term);
        };
    }

// private helpers
    var processInput = function($this)
    {
        var term = $this.val();
        if (typeof $this.data('awesomecomplete-config').dataMethod === 'function')
            $this.data('awesomecomplete-config').dataMethod(term, $this, onDataProxy($this, term));
        else
            processData($this, $this.data('awesomecomplete-config').staticData, term);
    };

    var htmlEscape = function(text)
    {
        if (typeof text !== 'string') { return text; }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    var processData = function($this, data, term)
    {
        var config = $this.data('awesomecomplete-config');
        var $list = $this.data('awesomecomplete-list');
        $list.empty().hide();
        if (!config.showAll && term === '')
            return;

        if (config.showAwesomeTip) {
          $list.append($('<div class="awesome-tip"></div>'));
        }

        var terms = [ term ];
        if (config.splitTerm)
            terms = term.split(config.wordDelimiter);

        if (config.headerText.length > 0) {
          var headerTextIndex = (terms.length > 1 || terms[0] != '') ? 1 : 0;
          $list.append($('<h2 class="awesome-header">' +
                          config.headerText[headerTextIndex] + '</h2>'));
        }

        var results = [];
        for (var item = 0; item < data.length; item++)
        {
            var dataItem = jQuery.extend({}, data[item]);
            var matchCount = 0;
            if (config.showAll && term === '') { matchCount++; }

            var maxFieldMatches = 0;
            var topMatch = null;
            var matchedTerms = [];

            for (var field in dataItem)
            {
                if ((typeof dataItem[field] === 'function') || (typeof dataItem[field] === 'object'))
                    continue;

                var skippedField = false;
                for (var j = 0; j < config.dontMatch.length; j++)
                    if (field == config.dontMatch[j])
                        skippedField = true;
                if (skippedField)
                    continue;

                var dataString = dataItem[field].toString();
                var adjTerms = [];
                for (var j = 0; j < terms.length; j++)
                {
                    if (terms[j] === '')
                        continue;

                    var modT = terms[j].replace(/([\\*+?|{}()^$.#])/g, '\\$1');
                    var regex = new RegExp('(' + modT + ')', (config.ignoreCase ? 'ig' : 'g'));
                    adjTerms.push(modT);

                    var matches = [];
                    if (matches = dataString.match(regex))
                    {
                        matchCount += matches.length;

                        if ((field != config.nameField) && (matches.length > maxFieldMatches))
                        {
                            maxFieldMatches = matches.length;
                            topMatch = field;
                            matchedTerms[adjTerms.length - 1] = true;
                        }
                    }
                }

                if (config.highlightMatches)
                {
                    var regex = new RegExp('(' + adjTerms.join('|') + ')', (config.ignoreCase ? 'ig' : 'g'));
                    var pieces = dataString.split(regex);
                    for (var i = 0; i < pieces.length; i++)
                    {
                        pieces[i] = htmlEscape(pieces[i]);
                        if (i % 2)
                        {
                            pieces[i] = '<span class="' + config.highlightClass + '">' +
                                pieces[i] + '</span>';
                        }
                    }
                    dataItem[field] = pieces.join('');
                }
                else
                { dataItem[field] = htmlEscape(dataString); }
            }

            var matchedTermCount = 0;
            for (var j = 0; j < matchedTerms.length; j++)
                if (matchedTerms[j] === true)
                    matchedTermCount++;

            if (matchCount > 0)
                results.push({
                    dataItem: dataItem,
                    originalDataItem: data[item],
                    matchCount: matchCount,
                    topMatch: topMatch,
                    matchedTermCount: matchedTermCount
                });
        }

        results.sort(function(a, b)
        {
            return config.sortFunction(a, b, term);
        });

        results = results.slice(0, config.resultLimit);

        for (var i in results)
        {
            var defaultActiveClass = (config.hoverDefaultFirstItem && i === 0) ? config.activeItemClass : '';
            if (results[i] instanceof Function) { continue; } // Because IE is dumb
            $('<li class="' + defaultActiveClass + '">' + config.renderFunction(results[i].dataItem, results[i].topMatch, config) + '</li>')
				.data('awesomecomplete-dataItem', results[i].originalDataItem)
                .data('awesomecomplete-value', config.valueFunction(results[i].originalDataItem, config))
                .appendTo($list)
                .click(function()
                {
                    var $t = $(this);
                    var v = $t.data('awesomecomplete-value');
                    if (config.skipBlankValues && $.isBlank(v)) { return; }
                    $this.val(v);
                    config.onComplete($t.data('awesomecomplete-dataItem'), $this);

                    config.blurFunction($list);
                    $list.hide();
                    suppressKey = true;
                })
                .mouseup(function(e)
                {
                    if (config.skipBlankValues && $.isBlank($(this).data('awesomecomplete-value')))
                    { e.stopPropagation(); }
                })
                .mouseover(function()
                {
                    if (config.skipBlankValues && $.isBlank($(this).data('awesomecomplete-value')))
                    { return; }
                    $(this).addClass(config.activeItemClass)
                           .siblings().removeClass(config.activeItemClass);
                });
        }

        if ((config.noResultsMessage !== undefined) && (results.length == 0))
            $list.append($('<li class="' + config.noResultsClass + '">' + config.noResultsMessage + '</li>'));

        if ((results.length > 0) || (config.noResultsMessage !== undefined))
        {
            if (config.initDelay > 0)
            {
                setTimeout(function() { doShow($this); }, config.initDelay);
            }
            else
            {
                doShow($this);
            }
        }

    };

    var doShow = function($this)
    {
        var $list = $this.data('awesomecomplete-list');
        var config = $this.data('awesomecomplete-config');

        config.showFunction($list);

        $list.fadeIn(config.fadeInTime);

        if (config.forcePosition)
        {
            if (config.alignRight)
            {
                var $ar = config.alignRight === true ? $this : config.alignRight;
                $list.css('left', $ar.position().left +
                        ($ar.offsetParent().offset().left - $list.offsetParent().offset().left) -
                        $list.outerWidth(true) + $ar.outerWidth(true));
            }
            else
            {
                $list.css('left', $this.position().left +
                    ($this.offsetParent().offset().left - $list.offsetParent().offset().left));
            }
            $list.css('top', $this.position().top + $this.outerHeight(true) +
                ($this.offsetParent().offset().top - $list.offsetParent().offset().top));
        }
    };

// default functions
    var defaultRenderFunction = function(dataItem, topMatch, config)
    {
        if ((topMatch === config.nameField) || (topMatch === null))
            return '<p class="title">' + dataItem[config.nameField] + '</p>';
        else
            return '<p class="title">' + dataItem[config.nameField] + '</p>' +
                   '<p class="matchRow"><span class="matchedField">' + topMatch + '</span>: ' +
                        dataItem[topMatch] + '</p>';
    };

    var defaultValueFunction = function(dataItem, config)
    {
        return dataItem[config.nameField];
    };

    var defaultSortFunction = function(a, b, term)
    {
        return (a.matchedTermCount == b.matchedTermCount) ?
               (b.matchCount - a.matchCount) :
               (b.matchedTermCount - a.matchedTermCount);
    };

    $.fn.awesomecomplete.defaults = {
        activeItemClass: 'active',
        alignRight: false,
        attachTo: undefined,
        blurFunction: function(list) {},
        dataMethod: undefined,
        dontMatch: [],
        forcePosition: false,
        highlightMatches: true,
        highlightClass: 'match',
        ignoreCase: true,
        nameField: 'name',
        noResultsClass: 'noResults',
        noResultsMessage: undefined,
        onComplete: function(dataItem, context) {},
        showFunction: function(list) {},
        sortFunction: defaultSortFunction,
        splitTerm: true,
        staticData: [],
        suggestionListClass: "autocomplete",
        renderFunction: defaultRenderFunction,
        resultLimit: 10,
        showAll: false,
        skipBlankValues: false,
        typingDelay: 0,
        initDelay: 0,
        fadeInTime: 0,
        valueFunction: defaultValueFunction,
        wordDelimiter: /[^\da-z]+/ig,
        showAwesomeTip: false,
        hoverDefaultFirstItem: false,
        headerText: [] // ['default text', 'text after filtering']
    };
})(jQuery);

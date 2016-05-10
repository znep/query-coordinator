/*  The structure of the applicator hash matches that of the customization
 *  hash, but with a couple of key differences.  Instead of a value at the
 *  end, there is an array.  Each of the items in this array describe how
 *  the widget should be styled to match the hash.  The items can match any
 *  of the following formats:
 *
 *  { selector: 'jQuery-selector', css: 'css-style-name'[, hasUnit: true][, outsideWidget: true] }
 *      The objects matching the given selector will have the specified
 *      css property set to the value of whatever is in the customization
 *      hash.
 *      If hasUnit is set to true, the value in the hash is
 *      interpreted as a { value: 'value', unit: 'unit' } hash, and the
 *      assigned value is concatenated as appropriate.
 *      If outsideWidget is set to true, the jQuery selector will select
 *      based on the publish page rather than based on the widget.
 *      The css property name can be comma separated to set multiple values.
 *
 *  { selector: 'jQuery-selector', css: 'css-style-name', map: { key-value-pairs }[, outsideWidget: true] }
 *      Same as the previous syntax, but rather than directly assigning
 *      the value from the customization hash, those values will first be
 *      run through this mapping hash.
 *
 *  { selector: 'jQuery-selector', css: 'css-style-name', callback: function(value) { }[, outsideWidget: true] }
 *      If you need more complex operations than a map can provide (eg strcat),
 *      you can provide a callback. Critically, this callback, as opposed to
 *      the one provided below, will write the result into the real stylesheet.
 *
 *  { selector: 'jQuery-selector', attr: 'html-attribute-name'[, outsideWidget: true] }
 *      Same as above, but sets an html attribute instead of a css one.
 *
 *  { selector: 'jQuery-selector', hideShow: true[, outsideWidget: true] }
 *      Shortcut for setting display to block if the value in the hash is
 *      true and none if false.  Could be done with the previous syntax but
 *      this is a common enough idiom for it to exist.
 *
 *  { callback: function(value) { } }
 *      Runs a custom function.  Value will be the value of the hash at that
 *      point in the traversal.
 *
 *  { selector: 'jQuery-selector', callback: function($elem, value) { }[, outsideWidget: true] }
 *      Same as above, but has a shortcut idiom to select the elements within
 *      the widget for you.
 *
 *  Each item in the array will be run against the value.
 *
 *  In addition, if at any point while traversing both trees an array appears
 *  here before a leaf is reached on the customization hash, the following
 *  syntaxes are the only valid definitions:
 *
 *  { callback: function(subhash) { } }
 *      The entire subtree that was not reached in the customization hash
 *      will be passed in as subhash.
 *
 *  { selector: 'jQuery-selector', callback: function($elem, subhash) { }[, outsideWidget: true] }
 *      Same as above, but has a shortcut idiom to select the elements within
 *      the widget for you.
 *
 *  Good luck!
 *
 *  PS. sorry, but these hashes is simply not going to be 80-wide compliant.
 *  PPS: This structure is now known as "Clint Styling Syntax", or CSS, to be as confusing
 *       and ridiculous as possible.
 */


(function($)
{

var publishNS = blist.namespace.fetch('blist.publish');

/////////////////////////////////////
// SECTION: Sidebar Options Helpers

blist.publish.dimensionOptions = [
    { text: 'ems', value: 'em' },
    { text: 'points', value: 'pt' },
    { text: 'pixels', value: 'px' },
    { text: 'inches', value: 'in' } ];

blist.publish.fontOptions = [
    { text: 'Palatino', value: '\'palatino linotype\', palatino, \'book antiqua\', serif' },
    { text: 'Arial', value: 'helvetica, arial, sans-serif' }, // protecting people from themselves!
    { text: 'Times', value: 'times, \'times new roman\', serif' },
    { text: 'Verdana', value: 'verdana, sans-serif' },
    { text: 'Georgia', value: 'georgia, serif' },
    { text: 'Trebuchet', value: '\'trebuchet ms\', sans-serif'} ];

// get latest instance of data in spite of sidebar declaration
blist.publish.resolveWorkingTheme = function()
{
    return publishNS.workingTheme;
};


/////////////////////////////////////
// SECTION: Applicator Methods

blist.publish.applicator = function(subapply, subhash)
{
    for (var key in subapply)
    {
        if (_.isArray(subapply[key]))
        {
            for (var curapply in subapply[key])
            {
                var value = subapply[key][curapply];
                if ((value['css'] !== undefined) && (value['outsideWidget'] !== true))
                {
                    _.each(value['css'].split(/, */), function(cssProperty)
                    {
                        if (value['hasUnit'] !== undefined)
                        {
                            publishNS.writeStyle(value['selector'], cssProperty,
                                subhash[key]['value'] + subhash[key]['unit']);
                        }
                        else if (value['map'] !== undefined)
                        {
                            publishNS.writeStyle(value['selector'], cssProperty,
                                value['map'][subhash[key].toString()]);
                        }
                        else if (value['callback'] !== undefined)
                        {
                            publishNS.writeStyle(value['selector'], cssProperty,
                                value['callback'](subhash[key]));
                        }
                        else if ((cssProperty == 'background-color') ||
                                (cssProperty == 'color') ||
                                (cssProperty == 'border-color'))
                        {
                            var v = subhash[key];
                            if (!v.startsWith('#')) { v = '#' + v; }
                            publishNS.writeStyle(value['selector'], cssProperty, v);
                        }
                        else
                        {
                            var subhashValue = subhash[key];
                            if (value['toProportion'] === true)
                                subhashValue = (100.0 / subhashValue) + '%';

                            publishNS.writeStyle(value['selector'], cssProperty,
                                subhashValue);
                        }
                    });
                }
                else if (value['selector'] !== undefined)
                {
                    if (value['outsideWidget'] === true)
                        var $elem = $(value['selector']);
                    else
                        var $elem = publishNS.findContextElem(value['selector']);

                    if (value['attr'] !== undefined)
                        $elem.attr(value['attr'], subhash[key]);

                    if (value['hideShow'] === true)
                    {
                        if (subhash[key])
                            $elem.show();
                        else
                            $elem.hide();
                    }

                    if (value['callback'] !== undefined)
                        value['callback']($elem, subhash[key]);
                }
                else
                {
                    if (value['callback'] !== undefined)
                        value['callback'](subhash[key]);
                }
            }
        }
        else if (typeof subapply[key] == 'object')
        {
            publishNS.applicator(subapply[key], subhash[key]);
        }
        else
        {
            throw('malformed hash?');
        }
    }
};

/////////////////////////////////////
// SECTION: Stylesheet Helpers

blist.publish.stylesheet = null;
blist.publish.styleRules = {};
blist.publish.writeStyle = function(selector, key, value)
{
    if (publishNS.stylesheet === null)
    {
        // initialize the stylesheet
        var styleNode = publishNS.generateStyleNode();

        var stylesheets = publishNS.retrieveStylesheets();
        for (var i = 0; i < stylesheets.length; i++)
        {
            publishNS.stylesheet = stylesheets[i];
            if ((publishNS.stylesheet.ownerNode || publishNS.stylesheet.owningElement) == styleNode)
            {
                break;
            }
        }
    }

    var selectors = selector.split(/,\s*/);
    for (var i = 0; i < selectors.length; i++)
    {
        if (publishNS.styleRules[selectors[i]] === undefined)
        {
            // Define and store the rule if it does not already exist
            var rules = publishNS.stylesheet.cssRules || publishNS.stylesheet.rules;
            var compare = selectors[i].toLowerCase();
            if (publishNS.stylesheet.insertRule)
    		{
    		    publishNS.stylesheet.insertRule(selectors[i] + " {}", rules.length);
    		}
    		else
    		{
                publishNS.stylesheet.addRule(selectors[i], null, rules.length);
                compare = selectors[i].toLowerCase().replace(/(\.\w+)+/g, function(match)
                {
                    // IE reverses the order of the classes
                    return '.' + match.slice(1).split('.').reverse().join('.');
                });
    		}
            rules = publishNS.stylesheet.cssRules || publishNS.stylesheet.rules;

            // Find the new rule
            for (var j = 0; j < rules.length; j++)
            {
                if (rules[j].selectorText.toLowerCase() === compare)
                {
                    publishNS.styleRules[selectors[i]] = rules[j];
                }
            }
        }

        // Grab the appropriate rule and set the appropriate style
        publishNS.styleRules[selectors[i]].style[
            key.replace(/-[a-z]/g, function(match) { return match.charAt(1).toUpperCase(); })]
              = value;
    }
};

blist.publish.clearStyles = function()
{
    if (publishNS.stylesheet === null)
    {
        return;
    }

    var rules = publishNS.stylesheet.cssRules || publishNS.stylesheet.rules;

    // Firefox doesn't like using a function pointer here.
    if (typeof publishNS.stylesheet.deleteRule === 'function')
    {
        for (var j = 0; j < rules.length; j++)
        {
            publishNS.stylesheet.deleteRule(j);
        }
    }
    else
    {
        for (var j = 0; j < rules.length; j++)
        {
            publishNS.stylesheet.removeRule(j);
        }
    }

    publishNS.styleRules = {};
};

/////////////////////////////////////
// SECTION: Data Handling Methods

blist.publish.valueChangedFired = false;
blist.publish.handleValueChanged = function()
{
    // prevent double fire on the same execution loop
    if (blist.publish.valueChangedFired === true)
    { return; }

    // get values from current form section
    var hash = this._getFormValues();

    // merge changes in
    $.extend(true, publishNS.workingTheme, hash);

    // update UI
    publishNS.applyCustomizationToPreview(publishNS.cleanData(publishNS.workingTheme));
    $('.publisherHeader').addClass('unsaved');

    if (_.isFunction(publishNS.updateCustomUI))
    { publishNS.updateCustomUI(); }

    blist.publish.valueChangedFired = true;
    _.defer(function() { blist.publish.valueChangedFired = false; });
};


// document.ready must be deferred so this happens after the page document.ready
$(function() { _.defer(function()
{
    var adjustSizes = function()
    {
        // match page height
        var $content = $('.publisherMain');
        var $contentBox = $('.contentBox');
        $content.height($(window).height() -
            $('#siteHeader').outerHeight(false) -
            $('#siteFooter').outerHeight(false) -
            $('.publisherHeader').outerHeight(true) -
            ($contentBox.outerHeight(true) - $contentBox.height()));
    };
    adjustSizes();
    $(window).resize(adjustSizes);

    $('#sidebarOptions a[data-paneName]').each(function()
    {
        var $a = $(this);
        $a.click(function(e)
        {
            e.preventDefault();
            publishNS.sidebar.show($a.attr('data-paneName'));
        });
    });

    // Publishing action buttons
    $('.saveButton').click(function(event)
    {
        event.preventDefault();

        $('.publisherActions .loadingIcon').show().css('display', 'inline-block');
        publishNS.saveCustomization(function()
        {
            publishNS.applyCustomizationToPreview(publishNS.workingTheme);
            if (_.isFunction(publishNS.updateCustomUI))
            { publishNS.updateCustomUI(); }

            $('.headerBar').removeClass('unsaved noRevert');
            $('.publisherActions .loadingIcon').hide();
        });
    });
    $('.revertButton').click(function(event)
    {
        event.preventDefault();
        publishNS.initCustomization();
        publishNS.applyCustomizationToPreview(publishNS.workingTheme);
        if (_.isFunction(publishNS.updateCustomUI))
        { publishNS.updateCustomUI(); }
    });

    // Warn on leaving
    if ($.isBlank(publishNS.dontPromptOnLeaving))
    {
        window.onbeforeunload = function()
        {
            if ($('.headerBar').hasClass('unsaved'))
            {
                return 'You will lose your changes to the current theme.';
            }
        };
    }

}); });

})(jQuery);

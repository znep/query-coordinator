var publishNS = blist.namespace.fetch('blist.publish');
var widgetNS;

/*jslint sub: true */

/*  The structure of this hash matches that of the customization hash,
 *  but with a couple of key differences.  Instead of a value at the end,
 *  there is an array.  Each of the items in this array describe how the
 *  widget should be styled to match the hash.  The items can match any
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
 *  Finally, there is also a syntax to pull in multiple keys at once:
 *
 *  _group: [ { properties: ['key1', 'key2'], callback: function(values) } ]
 *      Will pull both keys from the customization hash, and values will be
 *      of the form { key1: key1-value, key2: key2-value }.
 *
 *  _group: [ { selector: 'jQuery-selector', properties: ['key1', 'key2'], callback: function($elem, values) }[, outsideWidget: true] ]
 *      I think you can figure this one out.
 *
 *  Good luck!
 *
 *  PS. sorry, but this hash is simply not going to be 80-wide compliant.
 */

// helpers for builder hash
blist.publish.applyOrientation = function($elem, value)
{
    widgetNS.orientation = value;

    // prefetch this or jQuery gets confused about context
    $widgetContent = $elem.children('.widgetContent');
    if (value == 'downwards')
    {
        $elem.children('.headerBar').insertBefore($widgetContent);
        $elem.children('.subHeaderBar').insertBefore($widgetContent);
        $elem.children('.toolbar').insertBefore($widgetContent);
        $elem.find('.mainMenuButton').removeClass('downArrow').addClass('upArrow');
    }
    else
    {
        $elem.children('.headerBar').insertAfter($widgetContent);
        $elem.children('.subHeaderBar').insertAfter($widgetContent);
        $elem.children('.toolbar').insertAfter($widgetContent);
        $elem.find('.mainMenuButton').removeClass('upArrow').addClass('downArrow');
    }
};

blist.publish.applyContentMargin = function($elem, value)
{
    var valueAndUnit = value.value + value.unit;
    $elem.css('margin', '0 ' + valueAndUnit);
    if (widgetNS.orientation == 'upwards')
        $elem.css('margin-top', valueAndUnit);
    else
        $elem.css('margin-bottom', valueAndUnit);
};

blist.publish.applyLogo = function($elem, value)
{
    if (value['type'] == 'static')
    {
        $elem.css('background-image', 'url(' + value['href'] + ')');
        $('#publishOptionsPane .logoPreview').addClass('hide');
    }
    else
    {
        $elem.css('background-image', 'url(/assets/'  + value['href'] + ')')
        $('#publishOptionsPane .logoPreview').removeClass('hide')
             .attr('src', '/assets/' + value['href'] + '?s=tiny');
    }
};

blist.publish.applyGradient = function(selector, hover, value)
{
    if (hover)
    { selector += ':hover'; }

    if (!$.support.linearGradient)
    {
        // ie/older
        widgetNS.setGhettoButtonImage((hover ? 'hover' : 'normal'), 'url(/ui/box.png?w=3&h=30&rx=1&ry=1&rw=1&fc=' +
            value[0]['color'] + ',' + value[1]['color'] + ')')
    }
    else
    {
        // firefox
        publishNS.writeStyle(selector, 'background', '-moz-linear-gradient(0 0 270deg, #' +
            value[0]['color'] + ', #' + value[1]['color'] + ')');
        // webkit
        publishNS.writeStyle(selector, 'background', '-webkit-gradient(linear, left top, left bottom, from(#' +
            value[0]['color'] + '), to(#' + value[1]['color'] + '))');
    }
};

blist.publish.hideShowMenuItem = function($elem, value)
{
    var target = $elem.find('a').attr('data-targetPane');
    if (value === true)
    {
        $elem.removeClass('hide');

        if (target == 'about')
        { $elem.closest('.menuColumns').addClass('hasAbout'); }
    }
    else
    {
        $elem.addClass('hide');

        if (target == 'about')
        { $elem.closest('.menuColumns').removeClass('hasAbout'); }

        if ($elem.closest('.widgetWrapper')
                 .find('.widgetContent_' + target).is(':visible'))
        {
            widgetNS.showDataView();
            widgetNS.hideToolbar();
        }
    }

    var $mainMenu = $elem.closest('.mainMenu');
    $mainMenu.toggleClass('hide', $mainMenu.find('.menuEntry:not(.hide):not(.about)').length == 0);
};

// builder hash!
blist.publish.customizationApplication = {
    frame:          { border:        { color:               [ { selector: '.widgetWrapper', css: 'border-color' } ],
                                       width:               [ { selector: '.widgetWrapper', css: 'border-width', hasUnit: true } ] },
                      color:                                [ { selector: '.widgetWrapper', css: 'background-color' } ],
                      orientation:                          [ { selector: '.widgetWrapper', callback: publishNS.applyOrientation } ],
                      show_title:                           [ { selector: '.subHeaderBar .datasetName', hideShow: true } ],
                      padding:                              [ { selector: '.subHeaderBar, .toolbar', css: 'margin-left, margin-right', hasUnit: true },
                                                              { selector: '.widgetContent', callback: publishNS.applyContentMargin } ] },
    toolbar:        { color:                                [ { selector: '.subHeaderBar, .toolbar', css: 'background-color' } ] },
    logo:           { image:                                [ { selector: '.headerBar .logo', callback: publishNS.applyLogo } ],
                      href:                                 [ { selector: '.headerBar .logoLink', attr: 'href' } ] },
    menu:           { button:        { background:          [ { callback: function(value) { publishNS.applyGradient('.headerBar .mainMenu .mainMenuButton', false, value); } } ],
                                       background_hover:    [ { callback: function(value) { publishNS.applyGradient('.headerBar .mainMenu .mainMenuButton', true, value); } } ],
                                       border:              [ { selector: '.headerBar .mainMenu .mainMenuButton', css: 'border-color' } ],
                                       text:                [ { selector: '.mainMenuButton', css: 'color' } ] },
                      options:       { more_views:          [ { selector: '.mainMenu .menuEntry.views', callback: publishNS.hideShowMenuItem } ],
                                       comments:            [ { selector: '.mainMenu .menuEntry.comments', callback: publishNS.hideShowMenuItem } ],
                                       downloads:           [ { selector: '.mainMenu .menuEntry.downloads', callback: publishNS.hideShowMenuItem } ],
                                       embed:               [ { selector: '.mainMenu .menuEntry.embed', callback: publishNS.hideShowMenuItem } ],
                                       api:                 [ { selector: '.mainMenu .menuEntry.api', callback: publishNS.hideShowMenuItem } ],
                                       print:               [ { selector: '.mainMenu .menuEntry.print', callback: publishNS.hideShowMenuItem } ],
                                       about_sdp:           [ { selector: '.mainMenu .menuEntry.about', callback: publishNS.hideShowMenuItem } ] },
                      share:                                [ { selector: '.subHeaderBar .share', hideShow: true } ],
                      fullscreen:                           [ { selector: '.subHeaderBar .fullscreen', hideShow: true } ] },
    grid:           { font:          { header_size:         [ { selector: 'div.blist-th .info-container', css: 'font-size', hasUnit: true } ],
                                       data_size:           [ { selector: '.blist-td', css: 'font-size', hasUnit: true } ] },
                      row_numbers:                          [ { selector: '.blist-table-locked-scrolls:has(.blist-table-row-numbers)', hideShow: true },
                                                              { selector: '.blist-table-header-scrolls, .blist-table-footer-scrolls', css: 'margin-left', map: { 'true': '49px', 'false': '0' } },
                                                              { selector: '#data-grid .blist-table-inside .blist-tr', css: 'left', map: { 'true': '49px', 'false': '0' } } ],
                      wrap_header_text:                     [ { selector: '.blist-th .info-container, .blist-th .name-wrapper', css: 'height', map: { 'true': '2.45em', 'false': '1.6667em' } },
                                                              { selector: '.blist-th .info-container', css: 'white-space', map: { 'true': 'normal', 'false': 'nowrap' } },
                                                              { selector: '.blist-table-header, .blist-th, .blist-th .dragHandle', css: 'height', map: { 'true': '4.5em', 'false': '3.5em' } } ],
                      title_bold:                           [ { selector: '.blist-th .blist-th-name', css: 'font-weight', map: { 'true': 'bold', 'false' : 'normal' } } ],
                      header_icons:                         [ { selector: '.blist-th-icon', hideShow: true } ],
                      zebra:                                [ { selector: '.blist-tr-even .blist-td', css: 'background-color' } ] },
    behavior:       { interstitial:                         [ { callback: function(value) { widgetNS.interstitial = value; } } ] },
    publish:        { dimensions:   { width:                [ { selector: '.previewPane, .previewPane iframe', outsideWidget: true, callback: function($elem, value) { $elem.css('width', value + 'px'); } } ],
                                      height:               [ { selector: '.previewPane iframe', outsideWidget: true, callback: function($elem, value) { $elem.css('height', value + 'px'); } } ] },
                      show_title:                           [ { selector: '.previewPane p:first-child', outsideWidget: true, hideShow: true } ],
                      show_powered_by:                      [ { selector: '.previewPane p:last-child', outsideWidget: true, hideShow: true } ] }
};

blist.publish.applyCustomizationToPreview = function(hash)
{
    var recurse = function(subapply, subhash)
    {
        for (var key in subapply)
        {
            if (subapply[key] instanceof Array)
            {
                if (key == '_group')
                {
                    for (var curapply in subapply[key])
                    {
                        var value = subapply[key][curapply];
                        var values = { };
                        for (var i in value['properties'])
                        {
                            values[value['properties'][i]] = subhash[value['properties'][i]];
                        }

                        if (value['selector'] !== undefined)
                        {
                            if (value['outsideWidget'] === true)
                            {
                                var $elem = $(value['selector']);
                            }
                            else
                            {
                                var $elem = $('.previewPane iframe').contents().find(value['selector']);
                            }

                            value['callback']($elem, values);
                        }
                        else
                        {
                            value['callback'](values);
                        }
                    }
                }
                else
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
                                else if ((cssProperty == 'background-color') ||
                                        (cssProperty == 'color') ||
                                        (cssProperty == 'border-color'))
                                {
                                    publishNS.writeStyle(value['selector'], cssProperty,
                                        '#' + subhash[key]);
                                }
                                else
                                {
                                    publishNS.writeStyle(value['selector'], cssProperty,
                                        subhash[key]);
                                }
                            });
                        }
                        else if (value['selector'] !== undefined)
                        {
                            if (value['outsideWidget'] === true)
                            {
                                var $elem = $(value['selector']);
                            }
                            else
                            {
                                var $elem = $('.previewPane iframe').contents().find(value['selector']);
                            }
                            if (value['attr'] !== undefined)
                            {
                                $elem.attr(value['attr'], subhash[key]);
                            }
                            if (value['hideShow'] === true)
                            {
                                if (subhash[key])
                                {
                                    $elem.show();
                                }
                                else
                                {
                                    $elem.hide();
                                }
                            }
                            if (value['callback'] !== undefined)
                            {
                                value['callback']($elem, subhash[key]);
                            }
                        }
                        else
                        {
                            if (value['callback'] !== undefined)
                            {
                                value['callback'](subhash[key]);
                            }
                        }
                    }
                }
            }
            else if (typeof subapply[key] == 'object')
            {
                recurse(subapply[key], subhash[key]);
            }
            else
            {
                // malformed hash?
            }
        }
    };

    var $iframe = $('.previewPane iframe');
    if ($iframe.length === 0)
    { return; }

    var iframeNS = $iframe.get()[0].contentWindow;

    clearTimeout(publishNS.loadFrameTimeout);
    if ((typeof iframeNS.blist === 'undefined') ||
        (typeof iframeNS.blist.widget === 'undefined') ||
        (iframeNS.blist.widget.ready !== true))
    {
        // iframe may not have loaded yet.
        publishNS.loadFrameTimeout = setTimeout(
            function() { publishNS.applyCustomizationToPreview(hash); }, 50);
    }
    else
    {
        widgetNS = iframeNS.blist.widget;

        publishNS.clearStyles();
        recurse(publishNS.customizationApplication, hash);
        widgetNS.$resizeContainer.fullScreen().adjustSize();

        // ENABLE HACK: background-image won't take
        if (!$.support.linearGradient)
        { widgetNS.addGhettoHoverHook(); }

        if(publishNS.showEmbed !== false)
        {
            // Update copy code
            $('.publishCode textarea').text(
                $('.publishCode #codeTemplate').val()
                    .replace('%variation%', $('#template_name').val())
                    .replace('%width%', hash['publish']['dimensions']['width'])
                    .replace('%height%', hash['publish']['dimensions']['height'])
                    .replace((hash['publish']['show_title'] ? /^<div>/ : /^<div><p.*?<\/p>/), '<div>')
                    .replace((hash['publish']['show_powered_by'] ? /<\/div>$/ : /<p>.*<\/p><\/div>$/), '</div>'));
        }
        // Hide initial loading splash
        $('.previewPane .loadingIndicator').hide();
    }
};

blist.publish.stylesheet = null;
blist.publish.styleRules = {};
blist.publish.writeStyle = function(selector, key, value)
{
    if (publishNS.stylesheet === null)
    {
        // initialize the stylesheet
        $('.previewPane iframe').contents().find('#customizationStyles').empty().remove();

        var styleNode =
            $('.previewPane iframe').contents().find('head')
                .append('<style id="customizationStyles" type="text/css"></style>')
                .children('#customizationStyles')[0];

        var stylesheets = $('.previewPane iframe').get()[0].contentWindow.document.styleSheets;
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

blist.publish.valueChangedFired = false;
blist.publish.valueChanged = function(suppressMessage)
{
    if (blist.publish.valueChangedFired === true)
    {
        // prevent double fire on the same execution loop
        return;
    }

    var hash = publishNS.serializeForm();

    // Make a true deep clone of the merge
    var clone = $.extend(true, {}, publishNS.currentTheme);
    $.extend(true, clone, hash);

    publishNS.applyCustomizationToPreview(clone);

    publishNS.unsavedTheme = clone;
    if (suppressMessage !== true)
    {
        publishNS.showUnsavedChangesBar();
    }

    blist.publish.valueChangedFired = true;
    _.defer(function() { blist.publish.valueChangedFired = false; });
};

blist.publish.saveCustomization = function(hash)
{
    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "PUT",
        cache: false,
        contentType: "application/json",
        data: JSON.stringify({ 'customization': JSON.stringify(hash) }),
        dataType: "json",
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};

blist.publish.serializeForm = function()
{
    // The serializer will treat these as arrays if it runs into them.
    var arrays = [ 'menu_button_background', 'menu_button_background_hover' ];

    var hash = {};
    $('#publishOptionsPane form :input').each(function()
    {
        var $input = $(this);
        if ($input.attr('name').match(/^customization(\[[a-z0-9_]+\])+$/i))
        {
            var matches = $input.attr('name').match(/[a-z0-9_]+/ig);
            var subhash = hash;
            for (var i = 1; i < matches.length - 1; i++)
            {
                var key = matches[i];
                if (_.isArray(subhash))
                {
                    key = parseInt(key);
                }

                if (_.isUndefined(subhash[key]))
                {
                    subhash[key] = _.include(arrays, matches.slice(1, i + 1).join('_')) ? [] : {};
                }
                subhash = subhash[key];
            }
            switch ($input.attr('type'))
            {
                case 'radio':
                    if ($input.attr('checked'))
                    {
                        subhash[matches[matches.length - 1]] = publishNS.parseVal($input.val());
                    }
                    break;
                case 'checkbox':
                    subhash[matches[matches.length - 1]] = $input.attr('checked');
                    break;
                default:
                    subhash[matches[matches.length - 1]] =
                        $input.hasClass('prompt') ? '' : publishNS.parseVal($input.val());
            }
        }
    });

    return hash;
};

blist.publish.parseVal = function(val)
{
    switch (val)
    {
        case "true":  return true;
        case "false": return false;
        default:      return val;
    }
};

blist.publish.populateForm = function(hash)
{
    var recurse = function(subhash, prefix)
    {
        for (var key in subhash)
        {
            if ((typeof subhash[key] == 'object') || _.isArray(subhash[key]))
            {
                recurse(subhash[key], prefix + '[' + key + ']');
            }
            else
            {
                var $inputs = $('[name="' + prefix + '[' + key + ']"]');
                switch ($inputs.attr('type'))
                {
                    case 'checkbox':
                    case 'radio':
                        // [] syntax deals properly with checking/unchecking
                        $inputs.val([subhash[key].toString()]);
                        break;
                    case 'text':
                        // deal with textPrompt example text
                        $inputs.val(subhash[key].toString());
                        if ((subhash[key].toString() === "") && ($inputs.hasClass('textPrompt')))
                        {
                            $inputs.addClass('prompt');
                            $inputs.val($inputs.attr('title'));
                        }
                        break;
                    case 'hidden':
                        $inputs.val(subhash[key].toString());
                        if ($inputs.siblings('.colorPickerContainer').length > 0)
                        {
                            // deal with color pickers
                            $inputs.siblings('.colorPickerContainer').ColorPickerSetColor('#' + subhash[key].toString());
                        }
                        break;
                    default:
                        $inputs.val(subhash[key].toString());
                }
            }
        }
    };
    recurse(hash, 'customization');

    $('#customizationDescription').text(hash['description'] || '(none)');

    // Save loaded theme
    publishNS.currentTheme = hash;

    // Update preview
    publishNS.valueChanged(true);
};

blist.publish.checkVersion = function(customization)
{
    if (customization['version'] !== 1)
    {
        $('.livePreviewText, .previewPane').hide();
        $('#publishOptionsPane .summaryTabs').infoPaneNavigate().activateTab('#tabTemplates');
        $('#publishOptionsPane .summaryTabs').children(':not(:first)').hide();
        $('.versionMessage').show();
        return false;
    }
    else
    {
        $('.livePreviewText, .previewPane').show();
        $('#publishOptionsPane .summaryTabs').children().show();
        $('.versionMessage').hide();
        return true;
    }
};

blist.publish.cleanupColors = function(color)
{
    color = color.replace(/[^\da-f]/ig, '');
    if (color.length == 3)
    { color = color.replace(/(.)/, '$1$1'); }

    return color;
};

blist.publish.convertCustomization = function(customization)
{
    // transfer relevant values over
    var newCustomization = $.extend(true, {}, publishNS.v2Theme);
    newCustomization['frame']['color'] = publishNS.cleanupColors(customization['frame']['color']);
    newCustomization['frame']['border']['color'] = publishNS.cleanupColors(customization['frame']['border']);

    // none is no longer supported; default is already in the customization
    if ((customization['frame']['logo'] != 'none') &&
        (customization['frame']['logo'] != 'default'))
    {
        if (customization['frame']['logo'].match(/^[\dA-F]{8}-([\dA-F]{4}-){3}[\dA-F]{12}$/i))
        { newCustomization['logo']['image']['type'] = 'hosted'; }

        newCustomization['logo']['image']['href'] = customization['frame']['logo'];
    }

    newCustomization['grid']['font']['header_size'] = customization['style']['font']['grid_header_size'];
    newCustomization['grid']['font']['data_size'] = customization['style']['font']['grid_data_size'];
    newCustomization['grid']['row_numbers'] = customization['grid']['row_numbers'];
    newCustomization['grid']['wrap_header_text'] = customization['grid']['wrap_header_text'];
    newCustomization['grid']['header_icons'] = customization['grid']['header_icons'];
    newCustomization['grid']['title_bold'] = customization['grid']['title_bold'];
    newCustomization['grid']['zebra'] = publishNS.cleanupColors(customization['grid']['zebra']);

    newCustomization['behavior'] = customization['behavior'];
    newCustomization['publish'] = customization['publish'];

    return newCustomization;
};

blist.publish.loadCustomization = function()
{
    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "GET",
        cache: false,
        dataType: "json",
        success: function(responseData)
        {
            publishNS.hideUnsavedChangesBar();

            // set customization anyway in case populate isn't called
            var customization = JSON.parse(responseData['customization']);
            publishNS.currentTheme = customization;

            if (publishNS.checkVersion(customization))
            { publishNS.populateForm(customization); }

            $('.templateName').text(responseData['name']);
        },
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};

blist.publish.hideUnsavedChangesBar = function()
{
    $('.unsavedChangesBar').slideUp();
    $('body').animate({
        paddingTop: '0',
        backgroundPosition: '0 6px'
    });
};

blist.publish.showUnsavedChangesBar = function(showDiscard)
{
    $('.unsavedChangesBar').slideDown('normal');
    $('body').animate({
        paddingTop: '35px',
        backgroundPosition: '0 41px'
    });

    if (showDiscard === false)
    { $('.discardChangesButton').closest('li').hide(); }
    else
    { $('.discardChangesButton').closest('li').show(); }
};

(function($) {
    // Highlight copy code on click
    $.live('.publishCode textarea', 'click', function() { $(this).select(); });

    var initialTabSelect = "tabTemplates";
    var tabs = {
        "tabTemplates" :   ".singleInfoTemplates",
        "tabVisual" :      ".singleInfoVisual",
        "tabMenuControl" : ".singleInfoMenuControl",
        "tabAdvanced" :    ".singleInfoAdvanced"
    };
    if (publishNS.showTemplateChooser === false)
    {
        delete tabs["tabTemplates"];
        initialTabSelect = "tabVisual";
    }

    // Tab behavior
    $("#publishOptionsPane .summaryTabs").infoPaneNavigate({
        tabMap: tabs,
        allPanelsSelector : ".infoContentOuter",
        expandableSelector: ".infoContent",
        initialTab: initialTabSelect
    });


    // Color pickers
    var additionalColorHandlers = {
        customization_menu_button_background_0_color: function(color)
        {
            var darkerColor = $.subtractColors(color, '222');
            var lighterColor = $.addColors(color, '222');
            $('#customization_menu_button_background_1_color').val(darkerColor);
            $('#customization_menu_button_background_hover_0_color').val(lighterColor);
            $('#customization_menu_button_background_hover_1_color').val(color);
            $('#customization_menu_button_border').val(darkerColor);
        }
    };
    $('.colorPickerContainer').each(function() {
        var $this = $(this);
        $this.ColorPicker({
            flat: true,
            color: $this.siblings('.colorPickerTrigger').css('background-color'),
            onChange: function(hsb, hex, rgb) {
                $this.siblings('.colorPickerLabel').text(hex);
                $this.siblings('.colorPickerTrigger').css('background-color', '#' + hex);

                var $input = $this.siblings('input');
                $input.val(hex);
                if (_.isFunction(additionalColorHandlers[$input.attr('id')]))
                { additionalColorHandlers[$input.attr('id')](hex); }
            }
        });
        $this.siblings('.colorPickerTrigger').click(function()
        {
            $('.colorPickerContainer').hide();
            $this.show();
            $(document).bind('click.colorPicker', function(event)
            {
                var $target = $(event.target);
                if ((($target.parents('.colorPickerContainer').length == 0) &&
                    !$target.is('.colorPickerTrigger')) || $target.is('.colorpicker_close_link'))
                {
                    $(document).unbind('click.colorPicker');
                    $this.hide();

                    // Save changes
                    publishNS.valueChanged();
                }
            });
        });
    });

    // Load customizations when user chooses one
    $('#template_name').change(publishNS.loadCustomization);

    // Change template link (trust the timer to finish and save the template for us)
    $('.changeTemplateLink').click(function(event)
    {
        event.preventDefault();
        $("#publishOptionsPane .summaryTabs").infoPaneNavigate().activateTab('#tabTemplates');
    });

    // New template link needs to revert changes
    $('.newTemplateLink').click(function(event)
    {
        event.preventDefault();
        clearTimeout(publishNS.saveTimeout);
        publishNS.populateForm(publishNS.currentTheme);
    });

    // On clicking done, force a save before bailing
    $('.submitLink').click(function()
    {
        var hash = publishNS.serializeForm();

        // Make a true deep clone of the merge
        var clone = $.extend(true, {}, publishNS.currentTheme);
        $.extend(true, clone, hash);

        publishNS.saveCustomization(clone);
    });

    // Discard/save bar
    $('.unsavedChangesBar .discardChangesButton').click(function(event)
    {
        event.preventDefault();
        publishNS.populateForm(publishNS.currentTheme);
        publishNS.hideUnsavedChangesBar();
    });
    $('.unsavedChangesBar .saveChangesButton').click(function(event)
    {
        event.preventDefault();
        publishNS.saveCustomization(publishNS.unsavedTheme);
        publishNS.hideUnsavedChangesBar();
    });

    // Load in customization
    if (publishNS.checkVersion(publishNS.currentTheme))
    { publishNS.applyCustomizationToPreview(publishNS.currentTheme); }

    // Hide/show form elements custom UI
    $('[name="customization[frame][footer_link][show]"]').change(function()
    {
        var $this = $(this);
        if ($this.filter(':checked').val() == 'true')
        {
            $this.siblings('.subform').show();
        }
        else
        {
            $this.siblings('.subform').hide();
        }
    });
    $('[name=grid_zebra]').change(function()
    {
        var $this = $(this);
        if ($this.filter(':checked').val() == 'true')
        {
            $this.closest('dl').next()
                .show()
                .find('.colorPickerContainer').ColorPickerSetColor('#e7ebf2');
            $('#customization_grid_zebra').val('e7ebf2');
        }
        else
        {
            $this.closest('dl').next().hide();
            $('#customization_grid_zebra').val('ffffff');
            publishNS.valueChanged();
        }
    });

    // Upload custom UI
    $('#customization_logo_image_href option[value=disabled]').attr('disabled', true);
    $('#customization_logo_image_href').change(function () {
        var $this = $(this);
        var $typeField = $('#customization_logo_image_type');

        if ($this.val() == 'upload')
        {
            $("#modal").jqmShow($('<a href="/new_image"></a>'));
            $this.val('none');
            publishNS.valueChanged();

            blist.common.imageUploadedHandler = function(response)
            {
                if ($this.children('[disabled=disabled]').length === 0)
                {
                    // Add separator line
                    $this.append($.tag({ tagName: 'option', disabled: true }));
                }

                $this.append('<option value="' + response['id'] + '">'+ response['nameForOutput'] + '</option>');
                $this.val(response['id']);
                $typeField.val('hosted');

                publishNS.valueChanged();

                // Courtesy unbind
                blist.common.imageUploadedHandler = null;
            };
        }
        else if ($this.val() == publishNS.v2Theme['logo']['image']['href'])
        {
            // This is the default value; set the type to static
            $typeField.val('static');
        }
        else
        {
            // This is an uploaded logo; est the type to hosted
            $typeField.val('hosted');
        }
    });

    // Clear GA Code button
    $('#publishOptionsPane .singleInfoAdvanced .clearGACodeLink').click(function(event) {
        event.preventDefault();

        var $textbox = $(this).siblings('input[type="text"]');
        if (!$textbox.is('.prompt'))
        {
            $textbox.val('Paste tracking code here');
            $textbox.addClass('prompt');
        }
    });

    // Save whenever the user changes something; highlight textboxes on click
    $('select[name^=customization]').change(publishNS.valueChanged);
    $('input[name^=customization]:not([type=text])').click(publishNS.valueChanged);
    $(':input[name^=customization][type=text]')
        .change(publishNS.valueChanged)
        .blur(publishNS.valueChanged)
        .focus(function() {
            $(this).select();
        });

    window.onbeforeunload = function()
    {
        if ($('.unsavedChangesBar').is(':visible'))
        {
            return 'You will lose your changes to the current theme.';
        }
    };

    // Make public button
    $('.privateDatasetMessage .makePublicButton').click(function(event)
    {
        event.preventDefault();

        $.ajax({url: '/views/' + publishNS.viewId,
            data: {'method': 'setPermission', 'value': 'public.read'},
            error: function()
            { alert('There was a problem changing the permissions'); },
            success: function()
            {
                window.location.reload();
            }
        });
    });

    // Convert customization button
    $('.versionMessage .convertButton').click(function(event)
    {
        event.preventDefault();

        var convertedTheme = publishNS.convertCustomization(publishNS.currentTheme);
        publishNS.populateForm(convertedTheme);
        publishNS.checkVersion(convertedTheme);
        publishNS.showUnsavedChangesBar(false);
    });
})(jQuery);

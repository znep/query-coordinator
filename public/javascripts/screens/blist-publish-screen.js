var publishNS = blist.namespace.fetch('blist.publish');

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
blist.publish.applyFrameColor = function($elem, values)
{
    if (values['gradient'] === true)
    {
        // not yet implemented
    }
    else
    {
        $elem.find('#header, #header .wrapperT, #header .wrapperTR, .widgetFooterWrapper')
             .css('background-color', values['color'])
             .css('background-image', 'none');
        $elem.find('.gridInner').css('border-color', values['color']);
        if (values['border'] !== false)
        {
            $elem.find('#header').css('border', '1px solid ' + values['border']);
            $elem.find('#header').css('border-bottom', 'none');
        }
    }

    if (values['border'] !== false)
    {
        $elem.find('.gridOuter, .widgetFooterInner').css('border-color', values['border']);
    }
};

blist.publish.applyLogo = function($elem, values)
{
    // do stuff
};

blist.publish.applyTabs = function($elem, subhash)
{
    // $elem is the container of the tabs
    var tabs = new Array();
    for (var key in subhash)
    {
        var value = subhash[key];
        value['name'] = key;
        tabs.push(value);
    }

    tabs.sort(function(a, b) { return a['order'] - b['order']; });
    for (var i = 0; i < tabs.length; i++)
    {
        if (tabs[i]['show'] === true)
        {
            $elem.find('#tab' + $.capitalize(tabs[i]['name']))
                 .show()
                 .insertBefore($elem.find('.scrollArrow.prev'));
        }
        else
        {
            $elem.find('#tab' + $.capitalize(tabs[i]['name']))
                 .hide()
                 .insertAfter($elem.find('.scrollArrow.next'));
        }
    }
    if ($elem.children('li.active:not(:hidden)').length === 0)
    {
        //$elem.infoPaneNavigate().activateTab($elem.children('li:first-child'));
    }
};

blist.publish.applyInterstitial = function(value)
{
    if (value)
    {
        $('a:not([href^=#]):not(.noInterstitial)').live('click', blist.widget.showInterstitial);
    }
    else
    {
        $('a:not([href^=#]):not(.noInterstitial)').die('click');
    }
};

// builder hash!
blist.publish.customizationApplication = {
    style:          { font:          { face:                [ { selector: '*', css: 'font-family' } ],
                                       grid_header_size:    [ { selector: 'div.blist-th .info-container', css: 'font-size', hasUnit: true }],
                                       grid_data_size:      [ { selector: '.blist-td', css: 'font-size', hasUnit: true }] } },
    frame:          { _group:                               [ { selector: 'body', properties: ['color', 'gradient', 'border'], callback: publishNS.applyFrameColor } ],
                      logo:          { show:                [ { selector: '.widgetLogoWrapper', hideShow: true } ],
                                       _group:              [ { properties: ['type', 'url'], callback: publishNS.applyLogo } ] },
                      footer_link:   { show:                [ { selector: '.getPlayerAction', hideShow: true } ],
                                       url:                 [ { selector: '.getPlayerAction a', attr: 'href' } ],
                                       text:                [ { selector: '.getPlayerAction a', callback: function($elem, value) { $elem.text(value); } } ] } },
    grid:           { row_numbers:                          [ { selector: '.blist-table-locked-scrolls:has(.blist-table-row-numbers)', hideShow: true },
                                                              { selector: '.blist-table-header-scrolls, .blist-table-footer-scrolls', css: 'margin-left', map: { true: '49px', false: '0' } },
                                                              { selector: '.blist-table-inside .blist-tr', css: 'left', map: { true: '49px', false: '0' } } ],
                      wrap_header_text:                     [ { selector: '.blist-th .info-container, .blist-th .name-wrapper', css: 'height', map: { true: '2.5em', false: '' } },
                                                              { selector: '.blist-th .info-container', css: 'margin-top', map: { true: '-1.25em', false: '' } },
                                                              { selector: 'div.th-inner-container', css: 'white-space', map: { true: 'normal', false: '' } },
                                                              { selector: '.blist-table-header, .blist-th, .blist-th .dragHandle', css: 'height', map: { true: '4.5em', false: '' } } ],
                      header_icons:                         [ { selector: '.blist-th-icon', hideShow: true } ],
                      row_height:                           [ { selector: '.blist-td', css: 'height', hasUnit: true },
                                                              { selector: '.blist-td', css: 'line-height', hasUnit: true } ],
                      zebra:                                [ { selector: '.blist-tr-even .blist-td', css: 'background-color' } ] },
    menu:           { email:                                [ { selector: '.headerMenu .email', hideShow: true } ],
                      subscribe:     { rss:                 [ { selector: '.headerMenu .subscribe .rss', hideShow: true } ],
                                       atom:                [ { selector: '.headerMenu .subscribe .atom', hideShow: true } ] },
                      api:                                  [ { selector: '.headerMenu .api', hideShow: true } ],
                      download:                             [ { selector: '.headerMenu .export', hideShow: true } ],
                      print:                                [ { selector: '.headerMenu .print', hideShow: true } ],
                      fullscreen:                           [ { selector: '.headerMenu .fullscreen, .fullScreenButton', hideShow: true } ],
                      republish:                            [ { selector: '.headerMenu .publish', hideShow: true } ] },
    meta:                                                   [ { selector: '#widgetMeta .summaryTabs', callback: publishNS.applyTabs }],
    behavior:       { save_public_views:                    [ { selector: '#viewHeader', css: 'display', map: { true: '', false: 'none !important' } } ],
                      interstitial:                         [ { callback: publishNS.applyInterstitial } ] },
    publish:        { dimensions:   { width:                [ { selector: '.previewPane, .previewPane iframe', outsideWidget: true, callback: function($elem, value) { $elem.css('width', value + 'px'); } } ],
                                      height:               [ { selector: '.previewPane, .previewPane iframe', outsideWidget: true, callback: function($elem, value) { $elem.css('height', value + 'px'); } } ] },
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

                            if (value['css'] !== undefined)
                            {
                                if (value['hasUnit'] !== undefined)
                                {
                                    $elem.css(value['css'], subhash[key]['value'] + subhash[key]['unit']);
                                }
                                else if (value['map'] !== undefined)
                                {
                                    $elem.css(value['css'], value['map'][subhash[key]]);
                                }
                                else
                                {
                                    $elem.css(value['css'], subhash[key]);
                                }
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
    recurse(publishNS.customizationApplication, hash);
};

blist.publish.valueChanged = function()
{
    var hash = publishNS.serializeForm();

    // Make a true deep clone of the merge
    var clone = $.extend(true, {}, publishNS.currentTheme);
    $.extend(true, clone, hash);

    publishNS.applyCustomizationToPreview(clone);

    clearTimeout(publishNS.saveTimeout);
    publishNS.saveTimeout = setTimeout(function() { publishNS.saveCustomization(clone); }, 2000);
};

blist.publish.saveCustomization = function(hash)
{
    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "PUT",
        data: $.json.serialize({ 'customization': $.json.serialize(hash) }),
        dataType: "json",
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};

blist.publish.serializeForm = function()
{
    var hash = {};
    $('#publishOptionsPane form :input').each(function()
    {
        var $input = $(this);
        if ($input.attr('name').match(/^customization(\[[a-z_]+\])+$/i))
        {
            var matches = $input.attr('name').match(/[a-z_]+/ig);
            var subhash = hash;
            for (var i = 1; i < matches.length - 1; i++)
            {
                if (subhash[matches[i]] === undefined)
                {
                    subhash[matches[i]] = {};
                }
                subhash = subhash[matches[i]];
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
            if (typeof subhash[key] == 'object')
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
                            $inputs.siblings('.colorPickerContainer').ColorPickerSetColor(subhash[key].toString());
                        }
                        break;
                    default:
                        $inputs.val(subhash[key].toString());
                }
            }
        }
    };
    recurse(hash, 'customization');
    $('#tabsReorderList').reorderableList_updateFromData();

    $('#customizationDescription').text(hash['description'] || '(none)');

    // Save loaded theme
    publishNS.currentTheme = hash;
};

blist.publish.loadCustomization = function()
{
    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "GET",
        dataType: "json",
        success: function(responseData)
        {
            publishNS.populateForm($.json.deserialize(responseData['customization']));
            $('.templateName').text(responseData['name']);
            publishNS.applyCustomizationToPreview(publishNS.currentTheme);
        },
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        } 
    });
};

(function($) {
    // Highlight copy code on click
    $('.publishCode textarea').live('click', function() { $(this).select(); });

    // Tab behavior
    $("#publishOptionsPane .summaryTabs").infoPaneNavigate({
        tabMap: {
            "tabTemplates" : "#publishOptionsPane .singleInfoTemplates",
            "tabVisual" : "#publishOptionsPane .singleInfoVisual",
            "tabMenuControl" : "#publishOptionsPane .singleInfoMenuControl",
            "tabTab" : "#publishOptionsPane .singleInfoTab",
            "tabAdvanced" : "#publishOptionsPane .singleInfoAdvanced"
        },
        allPanelsSelector : "#publishOptionsPane .infoContentOuter",
        expandableSelector: "#publishOptionsPane .infoContent",
        initialTab: "tabTemplates"
    });

    // Color pickers
    $('.colorPickerContainer').each(function() {
        var $this = $(this);
        $this.ColorPicker({
            flat: true,
            color: $this.siblings('.colorPickerTrigger').css('background-color'),
            onChange: function(hsb, hex, rgb) {
                $this.siblings('.colorPickerTrigger').css('background-color', '#' + hex);
                $this.siblings('input').val('#' + hex);

                // Save changes
                publishNS.valueChanged();
            }
        });
        $this.siblings('.colorPickerTrigger').click(function()
        {
            $this.show();
            $(document).bind('click.colorPicker', function(event)
            {
                var $target = $(event.target);
                if (($target.parents('.colorPickerContainer').length == 0) &&
                    !$target.is('.colorPickerTrigger'))
                {
                    $(document).unbind('click.colorPicker');
                    $this.hide();
                }
            });
        });
    });

    // Reorderable List
    $('#tabsReorderList').reorderableList({
        onChange: publishNS.valueChanged
    });

    // Save whenever the user changes something
    $(':input[name^=customization]:not([type=text])').change(publishNS.valueChanged);
    $(':input[name^=customization][type=text]').keyup(publishNS.valueChanged);

    // Load customizations when user chooses one
    $('#template_name').change(publishNS.loadCustomization);

    // Cancel changes link
    $('.cancelCustomizationLink').click(function()
    {
        clearTimeout(publishNS.saveTimeout);
        publishNS.populateForm(publishNS.currentTheme);
        publishNS.saveCustomization(publishNS.currentTheme);
    });

    // Load in customization
    publishNS.applyCustomizationToPreview(publishNS.currentTheme);
})(jQuery);
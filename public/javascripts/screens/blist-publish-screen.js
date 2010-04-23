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
        var baseGradient = {
            h: 38,
            rh: 30,
            fc: $.gradientString([
                $.addColors(values['color'], '4c4c4c'),
                [$.addColors(values['color'], '191919'), 0.4],
                [values['color'], 0.4]])
        };
        if (values['border'] !== false)
        {
            baseGradient['ec'] = values['border'].slice(1);
            baseGradient['ew'] = 1;
        }

        // top gradients
        publishNS.writeStyle('#header .wrapperT', 'background-image',
            $.urlToImageBuilder($.extend({ w: 3, rw: 1, rx: 1 }, baseGradient), 'png', true));
        publishNS.writeStyle('#header .wrapperTR', 'background-image',
            $.urlToImageBuilder($.extend({ r: 8, rx: 8 }, baseGradient), 'png', true));
        publishNS.writeStyle('#header', 'background-image',
            $.urlToImageBuilder($.extend({ r: 8, rw: 8 }, baseGradient), 'png', true));

        // lower gradient
        publishNS.writeStyle('.widgetFooterWrapper', 'background-image',
            $.urlToImageBuilder($.extend({}, baseGradient,
            { h: 80, rh: 80, w: 3, rw: 1, rx: 1, fc: $.gradientString([ [ values['color'], 0.8 ], $.addColors(values['color'], '3f3f3f') ] ) }), 'png', true));
    }
    else
    {
        // frame
        publishNS.writeStyle('#header, #header .wrapperT, #header .wrapperTR, .widgetFooterWrapper',
            'background-color', values['color']);
        publishNS.writeStyle('#header, #header .wrapperT, #header .wrapperTR, .widgetFooterWrapper',
            'background-image', 'none');

        if (values['border'] !== false)
        {
            publishNS.writeStyle('#header', 'border', '1px solid ' + values['border']);
            publishNS.writeStyle('#header', 'border-bottom', 'none');
        }
    }
    
    // dialog headers
    publishNS.writeStyle('.dialogBox .header', 'background-color', values['color']);
    
    // sides
    publishNS.writeStyle('.gridInner', 'border-color', values['color']);

    // meta border
      // general borders
        publishNS.writeStyle('.infoContentOuter, .metadataPane .summaryTabs li, .singleInfoComments li.comment.ownerComment .commentBlock .cornerOuter, .metadataPane .summaryTabs',
            'border-color', values['color']);
      // inactive tab corners sprite
        publishNS.writeStyle('.metadataPane .summaryTabs li .tabOuter, .metadataPane .summaryTabs li .tabInner',
            'background-image', 'url(/ui/box.png?ew=1&rh=20&ec=' + values['color'].slice(1) + '&fc=ececec&h=23&r=3&s=h&bc=ececec)');
      // active tab corners sprite
        publishNS.writeStyle('.metadataPane .summaryTabs li.active .tabOuter, .metadataPane .summaryTabs li.active .tabInner',
            'background-image', 'url(/ui/box.png?ew=1&rh=20&ec=' + values['color'].slice(1) + '&fc=cacaca&h=23&r=3&s=h&bc=ececec)');
      // tab scroll buttons background color
        publishNS.writeStyle('.metadataPane .summaryTabs li.scrollArrow a, .metadataPane .summaryTabs li.scrollArrow.disabled a, .metadataPane .summaryTabs li.scrollArrow.disabled a:hover',
            'background-color', values['color']);
      // tab scroll buttons border color
        publishNS.writeStyle('.metadataPane .summaryTabs li.scrollArrow a, .metadataPane .summaryTabs li.scrollArrow.disabled a, .metadataPane .summaryTabs li.scrollArrow.disabled a:hover',
            'border-color', values['color']);

    // meta left bar bg
        publishNS.writeStyle('.infoContentOuter .infoContentInner', 'background-image',
            'url(/ui/box.png?w=150&h=1&fc=' + values['color'].slice(1) + ')');

    if (values['border'] !== false)
    {
        publishNS.writeStyle('.gridOuter, .widgetFooterInner', 'border-color', values['border']);
    }
};

blist.publish.applyDownloadMenu = function($elem, values)
{
    if (values['csv'] || values['json'] || values['pdf'] || values['xls'] ||
        values['xlsx'] || values['xml']) { $elem.show(); }
    else { $elem.hide(); }
};

blist.publish.applySubscribeMenu = function($elem, values)
{
    if (values['rss'] || values['atom'])
    {
        $elem.show();
    }
    else
    {
        $elem.hide();
    }
};

blist.publish.applySocializeMenu = function($elem, values)
{
    if (values['delicious'] || values['digg'] || values['facebook'] ||
        values['twitter']) { $elem.show(); }
    else { $elem.hide(); }
};

blist.publish.applyLogo = function($elem, value)
{
    var $logoPreview = $('#publishOptionsPane .logoPreview');
    var $urlSubForm = $('#publishOptionsPane .logoUrlForm').show();
    if (value == 'none')
    {
        $elem.addClass('hide');
        $logoPreview.addClass('hide');
        $urlSubForm.hide();
    }
    else if (value == 'default')
    {
        $elem.removeClass('hide')
             .css('background-image', 'url(/stylesheets/images/widgets/socrata_logo_player.png)');
        $logoPreview.addClass('hide');
    }
    else if (value.match(/[\dA-F]{8}-([\dA-F]{4}-){3}[\dA-F]{12}/))
    {
        $elem.removeClass('hide')
             .css('background-image', 'url(/assets/' + value + ')');
        $logoPreview.removeClass('hide')
             .attr('src', '/assets/' + value + '?s=tiny');
    }
    else
    {
        $elem.removeClass('hide')
             .css('background-image', 'url(' + value + ')');
        $logoPreview.removeClass('hide')
             .attr('src', value);
    }
};

blist.publish.applyTabs = function($elem, subhash)
{
    if ($elem.length < 1) { return; }

    // $elem is the container of the tabs
    var tabs = [];
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
        $elem.infoPaneNavigate().activateTab($elem.children('li:first-child'), true);
    }

    var $meta = $elem.closest('#widgetMeta');
    if ($elem.children('li:not(:hidden):not(.scrollArrow)').length === 0)
    {
        $meta.css('height', 0);
        $meta.siblings('.gridContainer').css('height', $meta.closest('.gridInner').css('height'));
    }
    else
    {
        $meta.css('height', null);
        $meta.siblings('.gridContainer').css('height', $meta.closest('.gridInner').innerHeight() - $meta.outerHeight(false));
    }
};

blist.publish.applyInterstitial = function(value)
{
    if (value)
    {
        widgetNS.enableInterstitial();
    }
    else
    {
        widgetNS.disableInterstitial();
    }
};

// builder hash!
blist.publish.customizationApplication = {
    style:          { font:          { face:                [ { selector: 'html', css: 'font-family' } ],
                                       grid_header_size:    [ { selector: 'div.blist-th .info-container', css: 'font-size', hasUnit: true }],
                                       grid_data_size:      [ { selector: '.blist-td', css: 'font-size', hasUnit: true }] } },
    frame:          { _group:                               [ { selector: 'body', properties: ['color', 'gradient', 'border'], callback: publishNS.applyFrameColor } ],
                      logo:                                 [ { selector: '.widgetLogoWrapper > a', callback: publishNS.applyLogo } ],
                      logo_url:                             [ { selector: '.widgetLogoWrapper > a', attr: 'href' } ],
                      footer_link:   { show:                [ { selector: '.getPlayerAction', hideShow: true } ],
                                       url:                 [ { selector: '.getPlayerAction a', attr: 'href' } ],
                                       text:                [ { selector: '.getPlayerAction a', callback: function($elem, value) { $elem.text(value); } } ] } },
    grid:           { row_numbers:                          [ { selector: '.blist-table-locked-scrolls:has(.blist-table-row-numbers)', hideShow: true },
                                                              { selector: '.blist-table-header-scrolls, .blist-table-footer-scrolls', css: 'margin-left', map: { 'true': '49px', 'false': '0' } },
                                                              { selector: '#data-grid .blist-table-inside .blist-tr', css: 'left', map: { 'true': '49px', 'false': '0' } } ],
                      wrap_header_text:                     [ { selector: '.blist-th .info-container, .blist-th .name-wrapper', css: 'height', map: { 'true': '2.45em', 'false': '1.6667em' } },
                                                              { selector: '.blist-th .info-container', css: 'white-space', map: { 'true': 'normal', 'false': 'nowrap' } },
                                                              { selector: '.blist-table-header, .blist-th, .blist-th .dragHandle', css: 'height', map: { 'true': '4.5em', 'false': '3.5em' } } ],
                      title_bold:                           [ { selector: '.blist-th .blist-th-name', css: 'font-weight', map: { 'true': 'bold', 'false' : 'normal' } } ],
                      header_icons:                         [ { selector: '.blist-th-icon', hideShow: true } ],
                      /* disabled row height
                      row_height:                           [ { selector: '.blist-td', css: 'height', hasUnit: true },
                                                              { selector: '.blist-td', css: 'line-height', hasUnit: true } ],*/
                      zebra:                                [ { selector: '.blist-tr-even .blist-td', css: 'background-color' } ] },
    menu:           {
                      top_fullscreen:                       [ { selector: '.fullScreenButton', hideShow: true } ],
                      // Main menu
                      print:                                [ { selector: '.headerMenu .print', hideShow: true } ],
                      fullscreen:                           [ { selector: '#mainMenu .fullscreen', hideShow: true } ],
                      download_menu: { csv:                 [ { selector: '.headerMenu .export .csv', hideShow: true } ],
                                       json:                [ { selector: '.headerMenu .export .json', hideShow: true } ],
                                       pdf:                 [ { selector: '.headerMenu .export .pdf', hideShow: true } ],
                                       xls:                 [ { selector: '.headerMenu .export .xls', hideShow: true } ],
                                       xlsx:                [ { selector: '.headerMenu .export .xlsx', hideShow: true } ],
                                       xml:                 [ { selector: '.headerMenu .export .xml', hideShow: true } ],
                                       _group:              [ { selector: '.headerMenu .export', properties: ['csv', 'json', 'pdf', 'xls', 'xlsx', 'xml'], callback: publishNS.applyDownloadMenu } ] },
                      api:                                  [ { selector: '.headerMenu .api', hideShow: true } ],
                      subscribe:     { atom:                [ { selector: '.headerMenu .subscribe .atom', hideShow: true } ],
                                       rss:                 [ { selector: '.headerMenu .subscribe .rss', hideShow: true } ],
                                       _group:              [ { selector: '.headerMenu .subscribe', properties: [ 'atom', 'rss' ], callback: publishNS.applySubscribeMenu } ] },
                      basic_analytics:                      [ { selector: '.headerMenu .basic_analytics', hideShow: true } ],
                      about:                                [ { selector: '.headerMenu .about', hideShow: true } ],
                      about_sdp:                            [ { selector: '.headerMenu .aboutSDP', hideShow: true } ],

                      // More Views menu
                      show_tags:                            [ { selector: '.headerMenu .rowTags', hideShow: true } ],
                      more_views:                           [ { selector: '.headerMenu .moreViews', hideShow: true } ],
                      views_fullscreen:                     [ { selector: '#viewsMenu .fullscreen, #viewsMenu > .sectionTitle', hideShow: true } ],

                      // Share menu
                      republish:                            [ { selector: '.headerMenu .publish', hideShow: true } ],
                      email:                                [ { selector: '.headerMenu .email', hideShow: true } ],
                      socialize:     { delicious:           [ { selector: '.headerMenu .socialize .delicious', hideShow: true } ],
                                       digg:                [ { selector: '.headerMenu .socialize .digg', hideShow: true } ],
                                       facebook:            [ { selector: '.headerMenu .socialize .facebook', hideShow: true } ],
                                       twitter:             [ { selector: '.headerMenu .socialize .twitter', hideShow: true } ],
                                       _group:              [ { selector: '.headerMenu .socialize', properties: [ 'delicious', 'digg', 'facebook', 'twitter' ], callback: publishNS.applySocializeMenu } ] }
                      },
    meta:                                                   [ { selector: '#widgetMeta .summaryTabs', callback: publishNS.applyTabs }],
    behavior:       { save_public_views:                    [ { selector: '#viewHeader', css: 'display', map: { 'true': '', 'false': 'none' } } ],
                      interstitial:                         [ { callback: publishNS.applyInterstitial } ] },
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
                            if (value['hasUnit'] !== undefined)
                            {
                                publishNS.writeStyle(value['selector'], value['css'],
                                    subhash[key]['value'] + subhash[key]['unit']);
                            }
                            else if (value['map'] !== undefined)
                            {
                                publishNS.writeStyle(value['selector'], value['css'],
                                    value['map'][subhash[key].toString()]);
                            }
                            else
                            {
                                publishNS.writeStyle(value['selector'], value['css'],
                                    subhash[key]);
                            }
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

    clearTimeout(publishNS.loadFrameTimeout);
    if ($('.previewPane iframe').length === 0)
    {
        return;
    }

    if ((typeof $('.previewPane iframe').get()[0].contentWindow.blist === 'undefined') ||
        (typeof $('.previewPane iframe').get()[0].contentWindow.blist.widget === 'undefined') ||
        ($('.previewPane iframe').get()[0].contentWindow.blist.widget.ready !== true))
    {
        // iframe may not have loaded yet.
        publishNS.loadFrameTimeout = setTimeout(
            function() { publishNS.applyCustomizationToPreview(hash); }, 50);
    }
    else
    {
        widgetNS = $('.previewPane iframe').get()[0].contentWindow.blist.widget;

        publishNS.clearStyles();
        recurse(publishNS.customizationApplication, hash);
        widgetNS.sizeGrid();

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
        eval('publishNS.styleRules[selectors[i]].style.' +
              key.replace(/-[a-z]/g, function(match) { return match.charAt(1).toUpperCase(); }) +
              ' = "' + value + '";');
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

blist.publish.valueChanged = function(suppressMessage)
{
    var hash = publishNS.serializeForm();

    // Make a true deep clone of the merge
    var clone = $.extend(true, {}, publishNS.currentTheme);
    $.extend(true, clone, hash);

    publishNS.applyCustomizationToPreview(clone);

    publishNS.unsavedTheme = clone;
    if (suppressMessage !== true)
    {
        $('.unsavedChangesBar').slideDown('normal');
        $('body').animate({
            paddingTop: '35px',
            backgroundPosition: '0 41px'
        });
    }
};

blist.publish.saveCustomization = function(hash)
{
    $.ajax({
        url: $('#publishOptionsPane form').attr('action') + $('#template_name').val(),
        type: "PUT",
        cache: false,
        contentType: "application/json",
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

    // Update preview
    publishNS.valueChanged(true);
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
            publishNS.populateForm($.json.deserialize(responseData['customization']));
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

(function($) {
    // Highlight copy code on click
    $.live('.publishCode textarea', 'click', function() { $(this).select(); });

    var initialTabSelect = "tabTemplates";
    var tabs = {
        "tabTemplates" :   ".singleInfoTemplates",
        "tabVisual" :      ".singleInfoVisual",
        "tabMenuControl" : ".singleInfoMenuControl",
        "tabTab" :         ".singleInfoTab",
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
    $('.colorPickerContainer').each(function() {
        var $this = $(this);
        $this.ColorPicker({
            flat: true,
            color: $this.siblings('.colorPickerTrigger').css('background-color'),
            onChange: function(hsb, hex, rgb) {
                $this.siblings('.colorPickerLabel').text('#' + hex);
                $this.siblings('.colorPickerTrigger').css('background-color', '#' + hex);
                $this.siblings('input').val('#' + hex);
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

    // Reorderable List
    $('#tabsReorderList').reorderableList({
        onChange: publishNS.valueChanged
    });

    // Save whenever the user changes something; highlight textboxes on click
    $('select[name^=customization]').change(publishNS.valueChanged);
    $('input[name^=customization]:not([type=text])').click(publishNS.valueChanged);
    $(':input[name^=customization][type=text]')
        .change(publishNS.valueChanged)
        .focus(function() {
            $(this).select();
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
    publishNS.applyCustomizationToPreview(publishNS.currentTheme);

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
            $('#customization_grid_zebra').val('#e7ebf2');
        }
        else
        {
            $this.closest('dl').next().hide();
            $('#customization_grid_zebra').val('#ffffff');
            publishNS.valueChanged();
        }
    });

    // Upload custom UI
    $('#customization_frame_logo').change(function () {
        var $this = $(this);
        if ($this.val() == 'upload')
        {
            $("#modal").jqmShow($('<a href="/new_image"></a>'));
            $this.val('none');
            publishNS.valueChanged();

            blist.common.imageUploadedHandler = function(response)
            {
                $this.append('<option value="' + response['id'] + '">'+ response['nameForOutput'] + '</option>');
                $this.val(response['id']);
                publishNS.valueChanged();

                // Courtesy unbind
                blist.common.imageUploadedHandler = null;
            };
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
})(jQuery);

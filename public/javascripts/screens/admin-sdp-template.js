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

////////////////////////////////////////////
// SECTION: Config

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
        $elem.children('.headerBar').children('.mainMenuButton')
            .removeClass('downArrow').addClass('upArrow');
    }
    else
    {
        $elem.children('.headerBar').insertAfter($widgetContent);
        $elem.children('.subHeaderBar').insertAfter($widgetContent);
        $elem.children('.toolbar').insertAfter($widgetContent);
        $elem.children('.headerBar').children('.mainMenuButton')
            .removeClass('upArrow').addClass('downArrow');
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
    }
    else
    {
        $elem.css('background-image', 'url(/assets/'  + value['href'] + ')')
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
    var target = $elem.children('a').attr('data-targetPane');
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

        if ($elem.closest('.widgetWrapper').children('.widgetContent')
                 .children('.widgetContent_' + target).is(':visible'))
        {
            widgetNS.showDataView();
            widgetNS.hideToolbar();
        }
    }

    var $mainMenu = $elem.closest('.mainMenu');
    $mainMenu.toggleClass('hide', $mainMenu.find('.menuEntry:not(.hide):not(.about)').length == 0);
};

// builder hash !
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
                      show_powered_by:                      [ { selector: '.previewPane p:last-child', outsideWidget: true, hideShow: true } ] }
};

// helpers for SDP Sidebars
blist.publish.dimensionOptions = [
    { text: 'ems', value: 'em' },
    { text: 'points', value: 'pt' },
    { text: 'pixels', value: 'px' },
    { text: 'inches', value: 'in' } ];

// get latest instance of data in spite of sidebar declaration
blist.publish.resolveWorkingTheme = function()
{
    return publishNS.workingTheme;
};
blist.publish.resolveCurrentThemeMeta = function()
{
    return {
        _name: publishNS.workingThemeMeta.name,
        description: publishNS.workingTheme.description
    };
};

// events for logo upload
blist.publish.wireLogoEditor = function($section)
{
    // restore normal styling, allow parser to see us
    $section.closest('.formSection').removeClass('custom');

    $section.find('.uploadNewLogoButton').click(function(event)
    {
        event.preventDefault();

        $.uploadDialog.version = 2;
        $.uploadDialog().show(
            function(fileName)
            {
                return '/assets.txt?name=' + fileName + '&type=WIDGET_CUSTOMIZATION_LOGO'
            },
            function(responseFile, file, response)
            {
                var $logoSelect = $('#gridSidebar_appearance #gridSidebar_appearance_logo\\:_logoSelect');
                $logoSelect.append('<option value="' + response['id'] + '">'+
                                    response['nameForOutput'] + '</option>');
                $logoSelect.val(response['id']);
                publishNS.handleValueChanged();
            },
            null, ['jpg', 'jpeg', 'gif', 'png'], 'Image');
    });
};

// wire up some custom behaviors into the sidebar
blist.publish.updateCustomUI = function()
{
    // hide zebra color if not zebraing
    $('#gridSidebar_appearance_rows\\:grid\\.zebra').closest('.line').toggleClass('disabled',
        !$('#gridSidebar_appearance_rows\\:_zebraStriping').is(':checked'));

    // update page title
    $('.publisherHeader h1').text('Editing ' + publishNS.workingThemeMeta.name);

    // update logoSelect to appropriate value
    var logoHref = publishNS.workingTheme._logoSelect;
    var $select = $('#gridSidebar_appearance #gridSidebar_appearance_logo\\:_logoSelect').val(logoHref);
    if (!_.isUndefined($.uniform.update)) { $.uniform.update($select); }
};

// Register the SDP sidebars !
_.each([
{
    name: 'metadata',
    priority: 1,
    title: 'Template Metadata',
    subtitle: 'Edit basic information about this Social Data Player Template',
    noReset: true,
    dataSource: publishNS.resolveCurrentThemeMeta,
    showCallback: publishNS.updateCustomUI,
    sections: [
    {
        title: 'Information', name: 'metadata',
        fields: [
        {   text: 'Name', name: '_name',
            prompt: 'Name this Template',
            type: 'text', required: true },
        {   text: 'Description', name: 'description',
            prompt: 'Record notes about this template here',
            type: 'textarea' }]
    }]
},
{
    name: 'appearance',
    priority: 2,
    title: 'Template Appearance',
    subtitle: 'Edit the appearance of this Social Data Player Template',
    noReset: true,
    dataSource: publishNS.resolveWorkingTheme,
    showCallback: publishNS.updateCustomUI,
    sections: [
    {
        title: 'Exterior', name: 'exterior',
        fields: [
        {   text: 'Width', name: 'publish.dimensions.width',
            type: 'text', required: true },
        {   text: 'Height', name: 'publish.dimensions.height',
            type: 'text', required: true },
        {   text: 'Powered By Text', name: 'publish.show_powered_by',
            type: 'checkbox' }]
    },
    {
        title: 'Logo', name: 'logo',
        customContent: {
            template: 'logoEdit',
            directive: {},
            callback: publishNS.wireLogoEditor
        }
    },
    {
        title: 'Color and Style', name: 'colors',
        fields: [
        {   text: 'Frame Color', name: 'frame.color',
            type: 'color', advanced: true, showLabel: true },
        {   text: 'Border Color', name: 'frame.border.color',
            type: 'color', advanced: true, showLabel: true },
        {   text: 'Button Color', name: '_menuButtonColor',
            type: 'color', advanced: true, showLabel: true },
        {   text: 'Toolbar Color', name: 'toolbar.color',
            type: 'color', advanced: true, showLabel: true },
        {   text: 'Find Field Color', name: 'toolbar.input_color',
            type: 'color', advanced: true, showLabel: true },
        {   type: 'group', text: 'Border Width', includeLabel: true,
            lineClass: 'dimensions', options: [
            {   type: 'text', name: 'frame.border.width.value', inputOnly: true },
            {   type: 'select', name: 'frame.border.width.unit', inputOnly: true,
                options: publishNS.dimensionOptions }] } ]
    },
    {
        title: 'Column Headers', name: 'columns',
        fields: [
        {   text: 'Wrap Column Titles', name: 'grid.wrap_header_text',
            type: 'checkbox' },
        {   text: 'Bold Titles', name: 'grid.title_bold',
            type: 'checkbox' },
        {   type: 'group', text: 'Font Size', includeLabel: true,
            lineClass: 'dimensions', options: [
            {   type: 'text', name: 'grid.font.header_size.value', inputOnly: true },
            {   type: 'select', name: 'grid.font.header_size.unit', inputOnly: true,
                options: publishNS.dimensionOptions }] } ]
    },
    {
        title: 'Rows', name: 'rows',
        fields: [
        {   text: 'Row Numbers', name: 'grid.row_numbers',
            type: 'checkbox' },
        {   type: 'group', text: 'Font Size', includeLabel: true,
            lineClass: 'dimensions', options: [
            {   type: 'text', name: 'grid.font.data_size.value', inputOnly: true },
            {   type: 'select', name: 'grid.font.data_size.unit', inputOnly: true,
                options: publishNS.dimensionOptions }] },
        {   text: 'Stripe Rows', name: '_zebraStriping',
            type: 'checkbox' },
        {   text: 'Stripe Color', name: 'grid.zebra',
            type: 'color', advanced: true, showLabel: true } ]
    },
    {
        title: 'Toolbars', name: 'toolbars',
        fields: [
        {   text: 'Dataset Title', name: 'frame.show_title',
            type: 'checkbox' },
        {   text: 'Orientation', name: 'frame.orientation',
            type: 'radioGroup', options: [
            {   value: 'downwards', type: 'static', isInput: true },
            {   value: 'upwards', type: 'static', isInput: true } ] } ]
    }]
},
{
    name: 'behavior',
    priority: 3,
    title: 'Behavior',
    subtitle: 'Edit the behavior of this Social Data Player Template',
    noReset: true,
    dataSource: publishNS.resolveWorkingTheme,
    showCallback: publishNS.updateCustomUI,
    sections: [
    {
        title: 'Menu', name: 'sdp_menu',
        fields: [
        {   text: 'More Views', name: 'menu.options.more_views',
            type: 'checkbox' },
        {   text: 'Comments', name: 'menu.options.comments',
            type: 'checkbox' },
        {   text: 'Downloads', name: 'menu.options.downloads',
            type: 'checkbox' },
        {   text: 'Embed', name: 'menu.options.embed',
            type: 'checkbox' },
        {   text: 'API', name: 'menu.options.api',
            type: 'checkbox' },
        {   text: 'Print', name: 'menu.options.print',
            type: 'checkbox' },
        {   text: 'About the SDP', name: 'menu.options.about_sdp',
            type: 'checkbox' }]
    },
    {
        title: 'General', name: 'general',
        fields: [
        {   text: 'Share Menu', name: 'menu.share',
            type: 'checkbox' },
        {   text: 'Full Screen', name: 'menu.fullscreen',
            type: 'checkbox' },
        {   text: 'Warn When Leaving', name: 'behavior.interstitial',
            type: 'checkbox' },
        {   value: 'Shows an alert notifying viewers that they are being ' +
                   'redirected to another site when clicking external links',
            type: 'static' }]
    }]
},
{
    name: 'advanced',
    priority: 3,
    title: 'Advanced',
    subtitle: 'Edit some advanced features of this Social Data Player Template',
    noReset: true,
    dataSource: publishNS.resolveWorkingTheme,
    showCallback: publishNS.updateCustomUI,
    sections: [
    {
        title: 'Google Analytics', name: 'analytics',
        fields: [
        {   text: 'GA Code', name: 'behavior.ga_code',
            type: 'text' },
        {   value: 'If you use Google Analytics you can embed your tracking ' +
                   'code into your Social Data Player', type: 'static' }]
    }]
}], $.gridSidebar.registerConfig);


////////////////////////////////////////////
// SECTION: Render methods

blist.publish.$iframe = null;
blist.publish.findCache = {};
blist.publish.findFrameElem = function(selector)
{
    if (_.isUndefined(publishNS.findCache[selector]))
    {
        publishNS.findCache[selector] = publishNS.$iframe.contents().find(selector);
    }
    return publishNS.findCache[selector];
};

blist.publish.customizationApplied = false;
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
                                var $elem = publishNS.findFrameElem(value['selector']);
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
                                var $elem = publishNS.findFrameElem(value['selector']);
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
    publishNS.$iframe = $iframe;

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

        // publishNS.clearStyles(); // DANGEROUS: no idea how well it works without this
        recurse(publishNS.customizationApplication, hash);

        // this is slow; let's let the UI refresh before running it.
        _.defer(function() { widgetNS.$resizeContainer.fullScreen().adjustSize(); });

        if (publishNS.showEmbed === true)
        {
            // Update copy code
            blist.publish.publishCode =
                $('#codeTemplate').val()
                    .replace('%variation%', $('#template_name').val())
                    .replace('%width%', hash['publish']['dimensions']['width'])
                    .replace('%height%', hash['publish']['dimensions']['height'])
                    .replace((hash['publish']['show_title'] ? /^<div>/ : /^<div><p.*?<\/p>/), '<div>')
                    .replace((hash['publish']['show_powered_by'] ? /<\/div>$/ : /<p>.*<\/p><\/div>$/), '</div>');
        }

        // first-load operations
        if (publishNS.customizationApplied === false)
        {
            // ENABLE HACK: background-image won't take in older IEs
            if (!$.support.linearGradient)
            { widgetNS.addGhettoHoverHook(); }

            // Hide initial loading splash and show widget
            $('.loadingMessage').fadeOut(function()
            {
                $('.previewScrollContainer').css('height', '100%').css('width', '100%');
            });

            publishNS.customizationApplied = true;
        }
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

////////////////////////////////////////////
// SECTION: Data handling methods

blist.publish.initCustomization = function()
{
    publishNS.workingTheme = $.extend(true, {}, publishNS.currentTheme);

    publishNS.workingTheme._menuButtonColor = publishNS.workingTheme.menu.button.background[0].color;
    publishNS.workingTheme._zebraStriping = (publishNS.workingTheme.grid.zebra !== 'ffffff');
    if (publishNS.workingTheme.logo.image.type == 'static')
    {
        // assume this is us
        publishNS.workingTheme._logoSelect = 'socrata';
    }
    else if (publishNS.workingTheme.logo.image.type == 'none')
    {
        publishNS.workingTheme._logoSelect = 'none';
    }
    else
    {
        publishNS.workingTheme._logoSelect = publishNS.workingTheme.logo.image.href;
    }

    publishNS.workingThemeMeta = $.extend({}, publishNS.currentThemeMeta);

    $('.publisherHeader').removeClass('unsaved');
    if (!_.isUndefined(publishNS.sidebar))
    {
        publishNS.sidebar.refresh();
    }
};

blist.publish.cleanData = function(hash)
{
    var cleanCopy = $.extend(true, {}, hash);

    // set menu button gradient correctly
    if (!_.isUndefined(cleanCopy._menuButtonColor))
    {
        var color = cleanCopy._menuButtonColor;
        var darkerColor = $.subtractColors(color, '222');
        var lighterColor = $.addColors(color, '222');

        cleanCopy.menu.button.background = [{ color: color }, { color: darkerColor }];
        cleanCopy.menu.button.background_hover = [{ color: lighterColor }, { color: color }];
        cleanCopy.menu.button.border = darkerColor;
    }

    // _zebraStriping indicates whether to ignore the specified color
    if (cleanCopy._zebraStriping === false)
    { cleanCopy.grid.zebra = 'ffffff'; }

    // name isn't really in workingTheme
    if (!_.isUndefined(cleanCopy._name))
    { publishNS.workingThemeMeta.name = cleanCopy._name; }

    // massage logo selection
    if (!_.isUndefined(cleanCopy._logoSelect))
    {
        if (cleanCopy._logoSelect == 'none')
        {
            // do nothing
            cleanCopy.logo.image.type = 'none';
            cleanCopy.logo.image.href = '';
        }
        else if (cleanCopy._logoSelect == 'socrata')
        {
            // this is the default logo
            cleanCopy.logo.image.type = 'static';
            cleanCopy.logo.image.href = publishNS.v2Theme['logo']['image']['href'];
        }
        else
        {
            // asset; set up path appropriately
            cleanCopy.logo.image.type = 'hosted';
            cleanCopy.logo.image.href = cleanCopy._logoSelect;
        }
    }

    // delete temp stuff
    _.each(cleanCopy, function(value, key)
    {
        if (key.startsWith('_'))
        {
            delete cleanCopy[key];
        }
    });

    return cleanCopy;
};

blist.publish.valueChangedFired = false;
blist.publish.handleValueChanged = function()
{
    // prevent double fire on the same execution loop
    if (blist.publish.valueChangedFired === true)
    { return; }

    // get values from current form section
    var hash = publishNS.sidebar.getFormValues($('#gridSidebar .outerPane:visible'));

    // merge changes in
    $.extend(true, publishNS.workingTheme, hash);

    // update UI
    publishNS.applyCustomizationToPreview(publishNS.cleanData(publishNS.workingTheme));
    $('.publisherHeader').addClass('unsaved');
    publishNS.updateCustomUI();

    blist.publish.valueChangedFired = true;
    _.defer(function() { blist.publish.valueChangedFired = false; });
};
blist.publish.deferredHandleValueChanged = function()
{
    _.defer(function() { publishNS.handleValueChanged(); });
};

blist.publish.saveCustomization = function()
{
    $.ajax({
        url: '/api/widget_customization/' + publishNS.currentThemeMeta.id,
        type: "PUT",
        cache: false,
        contentType: "application/json",
        data: JSON.stringify({ 'customization': JSON.stringify(publishNS.cleanData(publishNS.workingTheme)),
                               'name': publishNS.workingThemeMeta.name }),
        dataType: "json",
        success: function(response)
        {
            // update with latest from server
            publishNS.currentTheme = JSON.parse(response.customization);
            publishNS.currentThemeMeta.name = response.name;

            publishNS.initCustomization();
        },
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};

blist.publish.checkVersion = function(customization)
{
    if (customization['version'] !== 1)
    {
        $('.previewPane').hide();
        $('.versionMessage').show();
        return false;
    }
    else
    {
        $('.previewPane').show();
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


(function($) {
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


    // Init data
    if (publishNS.checkVersion(publishNS.currentTheme))
        publishNS.initCustomization();

    // Init and wire sidebar
    publishNS.sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: $('.publisherWorkspace'),
        onSidebarShown: function(activePane)
        {
            var $activeLink = $('#sidebarOptions a[data-paneName=' + activePane + ']');
            $('#sidebarOptions').css('background-color', $activeLink.css('background-color'))
                .find('li').removeClass('active');
            $activeLink.closest('li').addClass('active');
        },
        setSidebarTop: false
    });
    $('#sidebarOptions a[data-paneName]').each(function()
    {
        var $a = $(this);
        $a.click(function(e)
        {
            e.preventDefault();
            publishNS.sidebar.show($a.attr('data-paneName'));
        });
    });


    if (publishNS.checkVersion(publishNS.currentTheme))
    {
        publishNS.sidebar.show('metadata');

        // Load in customization
        publishNS.applyCustomizationToPreview(publishNS.workingTheme);
    }

    // Wire up all possible elements in the sidebars to refresh the preview
    $.live('#gridSidebar input[type=text], #gridSidebar select, #gridSidebar input[type=file]',
           'change', publishNS.handleValueChanged);
    if ($.browser.msie)
    { $.live('#gridSidebar input[type=checkbox], #gridSidebar input[type=radio]',
             'click', publishNS.handleValueChanged); }
    $.live('#gridSidebar input[type=checkbox], #gridSidebar input[type=radio]',
           'change', publishNS.handleValueChanged);
    $.live('#gridSidebar .slider', 'slide', publishNS.deferredHandleValueChanged);
    $.live('#gridSidebar .colorControl', 'color_change', publishNS.deferredHandleValueChanged);

    // Publishing action buttons
    $('.saveButton').click(function(event)
    {
        event.preventDefault();

        $('.publisherActions .loadingIcon').show().css('display', 'inline-block');
        publishNS.saveCustomization();
        publishNS.applyCustomizationToPreview(publishNS.workingTheme);

        $('.headerBar').removeClass('unsaved noRevert');
        $('.publisherActions .loadingIcon').hide();
    });
    $('.revertButton').click(function(event)
    {
        event.preventDefault();
        publishNS.initCustomization();
        publishNS.applyCustomizationToPreview(publishNS.workingTheme);
    });

    // Warn on leaving
    window.onbeforeunload = function()
    {
        if ($('.headerBar').hasClass('unsaved'))
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

        // convert and update internal structures
        publishNS.currentTheme = publishNS.convertCustomization(publishNS.currentTheme);
        publishNS.initCustomization();

        // update ui
        publishNS.checkVersion(publishNS.currentTheme);
        publishNS.applyCustomizationToPreview(publishNS.workingTheme);
        publishNS.sidebar.show('appearance');
        $('.headerBar').addClass('unsaved noRevert');
    });
})(jQuery);

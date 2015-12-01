var publishNS = blist.namespace.fetch('blist.publish');
var widgetNS;

/*jslint sub: true */

// Confused? Core functionality is in admin-customizer.js

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

    var firstColor = value[0]['color'];
    if (!firstColor.startsWith('#')) { firstColor = '#' + firstColor; }
    var lastColor = value[1]['color'];
    if (!lastColor.startsWith('#')) { lastColor = '#' + lastColor; }

    if (!$.support.linearGradient)
    {
        // ie/older
        widgetNS.setGhettoButtonImage((hover ? 'hover' : 'normal'), 'url(/ui/box.png?w=3&h=30&rx=1&ry=1&rw=1&fc=' +
            firstColor.slice(1) + ',' + lastColor.slice(1) + ')')
    }
    else
    {
        // firefox
        publishNS.writeStyle(selector, 'background', '-moz-linear-gradient(0 0 270deg, ' +
            firstColor + ', ' + lastColor + ')');
        // webkit
        publishNS.writeStyle(selector, 'background', '-webkit-gradient(linear, left top, left bottom, from(' +
            firstColor + '), to(' + lastColor + '))');
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
    toolbar:        { color:                                [ { selector: '.subHeaderBar, .toolbar', css: 'background-color' } ],
                      input_color:                          [ { selector: '.toolbar .toolbarTextboxWrapper .toolbarTextbox', css: 'background-color' } ] },
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

// get latest instance of data in spite of sidebar declaration
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
    var cpObj = this;
    // restore normal styling, allow parser to see us
    $section.closest('.formSection').removeClass('custom');

    $section.find('.uploadNewLogoButton').click(function(event)
    {
        event.preventDefault();

        $.uploadDialog().show(
            function(fileName)
            {
                return '/assets.txt?name=' + fileName + '&type=WIDGET_CUSTOMIZATION_LOGO'
            },
            function(responseFile, file, response)
            {
                var $logoSelect = $('#gridSidebar_appearance_logo\\:_logoSelect');
                $logoSelect.append('<option value="' + response['id'] + '">'+
                                    response['nameForOutput'] + '</option>');
                $logoSelect.val(response['id']);
                publishNS.handleValueChanged.call(cpObj);
            },
            null, ['jpg', 'jpeg', 'gif', 'png'], 'Image');
    });

    $section.find('#gridSidebar_appearance_logo\\:_logoSelect',
                  '#gridSidebar_appearance_logo\\:logo.href').change(function(event)
    {
        publishNS.handleValueChanged.call(cpObj);
    });
};

// wire up some custom behaviors into the sidebar
blist.publish.updateCustomUI = function()
{
    // hide zebra color if not zebraing
    $('#gridSidebar_appearance_rows\\:grid\\.zebra')
        .closest('.line').toggleClass('disabled', !publishNS.workingTheme._zebraStriping);

    // update page title
    $('.publisherHeader h1').text('Editing ' + publishNS.workingThemeMeta.name);

    // update logoSelect to appropriate value
    var $select = $('#gridSidebar_appearance_logo\\:_logoSelect')
                      .val(publishNS.workingTheme._logoSelect);
    if (!_.isUndefined($.uniform.update)) { $.uniform.update($select); }

    // hide url field if no logo, update value
    $('#gridSidebar_appearance_logo\\:logo\\.href')
        .val(publishNS.workingTheme.logo.href)
        .closest('.line').toggleClass('disabled', (publishNS.workingTheme._logoSelect == 'none'));

    // hide/show changes warning on embed pane
    $('#gridSidebar_embed .changesWarning').toggleClass('hide', !$('.publisherHeader').hasClass('unsaved'));

    // show validation messages
    publishNS.sidebar.$currentPane().find('form').valid();
};

blist.publish.generateEmbedCode = function(hash)
{
    if (_.isUndefined(hash)) { var hash = publishNS.workingTheme; }
    return $('#codeTemplate').val()
        .replace('%variation%', publishNS.currentThemeMeta.id)
        .replace('%width%', hash.publish.dimensions.width)
        .replace('%height%', hash.publish.dimensions.height)
        .replace((hash.publish.show_powered_by ? /<\/div>$/ : /<p>.*<\/p><\/div>$/), '</div>');
};

// Register the SDP sidebars !
$.Control.extend('pane_sdpTmplMetadata', {
    getTitle: function()
    { return 'Template Metadata'; },

    getTemplateName: function() {
        return 'sidebarPaneWithFieldset';
    },

    getSubtitle: function()
    { return 'Edit basic information about this Social Data Player Template'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveCurrentThemeMeta(); },

    shown: function()
    {
        this._super();
        publishNS.updateCustomUI();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Information', name: 'metadata',
            fields: [
            {   text: 'Name', name: '_name',
                prompt: 'Name this Template',
                type: 'text', required: true },
            {   text: 'Description', name: 'description',
                prompt: 'Record notes about this template here',
                type: 'textarea' }]
        }];
    }
}, {name: 'metadata', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('metadata', 'pane_sdpTmplMetadata');

$.Control.extend('pane_sdpTmplAppearance', {
    getTitle: function()
    { return 'Template Appearance'; },

    getTemplateName: function() {
        return 'sidebarPaneWithFieldset';
    },

    getSubtitle: function()
    { return 'Edit the appearance of this Social Data Player Template'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveWorkingTheme(); },

    shown: function()
    {
        this._super();
        publishNS.updateCustomUI();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Exterior', name: 'exterior',
            fields: [
            {   text: 'Width', name: 'publish.dimensions.width',
                type: 'text', required: true, validateMin: 425 },
            {   text: 'Height', name: 'publish.dimensions.height',
                type: 'text', required: true, validateMin: 425 },
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
            onlyIf: { func: function() { return publishNS.viewIsGrid; } },
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
            onlyIf: { func: function() { return publishNS.viewIsGrid; } },
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
                type: 'radioSelect', options: [ 'downwards', 'upwards' ] } ]
        }];
    }
}, {name: 'appearance', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('appearance', 'pane_sdpTmplAppearance');

$.Control.extend('pane_sdpTmplBehavior', {
    getTitle: function()
    { return 'Behavior'; },

    getTemplateName: function() {
        return 'sidebarPaneWithFieldset';
    },

    getSubtitle: function()
    { return 'Edit the behavior of this Social Data Player Template'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveWorkingTheme(); },

    shown: function()
    {
        this._super();
        publishNS.updateCustomUI();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Menu', name: 'sdp_menu',
            fields: [
            {   text: 'More Views', name: 'menu.options.more_views',
                type: 'checkbox' },
            {   text: 'Discuss', name: 'menu.options.comments',
                type: 'checkbox' },
            {   text: 'Downloads', name: 'menu.options.downloads',
                type: 'checkbox' },
            {   text: 'Embed', name: 'menu.options.embed',
                type: 'checkbox' },
            {   text: 'API', name: 'menu.options.api',
                type: 'checkbox' },
            {   text: 'Print', name: 'menu.options.print',
                type: 'checkbox', onlyIf: publishNS.viewIsGrid },
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
        }];
    }
}, {name: 'behavior', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('behavior', 'pane_sdpTmplBehavior');

$.Control.extend('pane_sdpTmplAdvanced', {
    getTitle: function()
    { return 'Advanced'; },

    getTemplateName: function() {
        return 'sidebarPaneWithFieldset';
    },

    getSubtitle: function()
    { return 'Edit some advanced features of this Social Data Player Template'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveWorkingTheme(); },

    shown: function()
    {
        this._super();
        publishNS.updateCustomUI();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Google Analytics', name: 'analytics',
            fields: [
            {   text: 'GA Code', name: 'behavior.ga_code',
                type: 'text' },
            {   value: 'If you use Google Analytics you can embed your tracking ' +
                       'code into your Social Data Player', type: 'static' }]
        }];
    }
}, {name: 'advanced', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('advanced', 'pane_sdpTmplAdvanced');

$.Control.extend('pane_sdpTmplEmbed', {
    getTitle: function()
    { return 'Embed'; },

    getSubtitle: function()
    { return 'Publish this Social Data Player on the web'; },

    _getCurrentData: function()
    { return this._super() || { code: publishNS.generateEmbedCode() }; },

    shown: function()
    {
        this._super();
        publishNS.updateCustomUI();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Embed Code', name: 'embedCode',
            fields: [
            {   text: 'Embed Code', name: 'code',
                type: 'textarea' },
            {   value: 'You have made changes to this template that have ' +
                       'not yet been saved. They will not reflect in published ' +
                       'until you save the template.', type: 'static', lineClass: 'changesWarning' }]
        }];
    }
}, {name: 'embed', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('embed', 'pane_sdpTmplEmbed');


////////////////////////////////////////////
// SECTION: Render methods

blist.publish.$iframe = null;
blist.publish.findCache = {};
blist.publish.findContextElem = function(selector)
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

        publishNS.applicator(publishNS.customizationApplication, hash);

        // update embed codes
        publishNS.findContextElem('#embed_code').text(publishNS.generateEmbedCode(hash));

        // this is slow; let's let the UI refresh before running it.
        _.defer(function() { widgetNS.$resizeContainer.fullScreen().adjustSize(); });

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

blist.publish.generateStyleNode = function()
{
    return $('.previewPane iframe').contents().find('head')
        .append('<style id="customizationStyles" type="text/css"></style>')
        .children('#customizationStyles')[0];
};

blist.publish.retrieveStylesheets = function()
{
    return $('.previewPane iframe').get()[0].contentWindow.document.styleSheets;
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

blist.publish.saveCustomization = function(callback)
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

            callback();
        },
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};

blist.publish.checkVersion = function(customization)
{
    if (_.isUndefined(customization) || (customization['version'] !== 1))
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


$(function() {
    // Init data
    if (publishNS.checkVersion(publishNS.currentTheme))
        publishNS.initCustomization();

    // Init and wire sidebar
    publishNS.sidebar = $('#gridSidebar').gridSidebar({
        onSidebarShown: function(activePane)
        {
            var $activeLink = $('#sidebarOptions a[data-paneName=' + activePane + ']');
            $('#sidebarOptions').css('background-color', $activeLink.css('background-color'))
                .find('li').removeClass('active');
            $activeLink.closest('li').addClass('active');
        },
        resizeNeighbor: '.publisherWorkspace',
        setSidebarTop: false
    });

    if (publishNS.checkVersion(publishNS.currentTheme))
    {
        publishNS.sidebar.show('metadata');

        // Load in customization
        publishNS.applyCustomizationToPreview(publishNS.workingTheme);
    }

    // Embed code highlight
    $.live('#gridSidebar_embed textarea', 'click', function() { $(this).select(); });

    // Make public button
    $('.privateDatasetMessage .makePublicButton').click(function(event)
    {
        event.preventDefault();

        $.ajax({url: '/views/' + publishNS.viewId +
                '.json?method=setPermission&value=public.read', type: 'PUT',
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
});

;(function($)
{

var publishNS = blist.namespace.fetch('blist.publish');

// Confused? Core functionality is in admin-customizer.js

/////////////////////////////////////
// SECTION: Config

blist.publish.applyAutoAdvance = function(value)
{
    blist.homepage.autoadvanceInit(value);
};

blist.publish.applyShadow = function(value)
{
    if (_.isNumber(value))
        return '0 0 5px rgba(0,0,0,' + value + ')';
    else
        return '0 0 ' + value.radius.value + value.radius.unit + ' rgba(0,0,0,' + value.alpha + ')';
};

blist.publish.customizationApplication = {
    autoAdvance:                            [ { callback: publishNS.applyAutoAdvance } ],
    height:                                 [ { selector: '.storiesContainer', css: 'height', hasUnit: true } ],
    orientation:                            [ { selector: '.storiesContainer .storyTexts li', css: 'right', map: { left: 'auto', right: 0 } },
                                              { selector: '.storiesContainer .storyTextbox', css: 'right', map: { left: 'auto', right: 0 } },
                                              { selector: '.storiesContainer .storyPager', css: 'right', map: { left: 'auto', right: 0 } },
                                              { selector: '.storiesContainer .storyImages li img', css: 'right', map: { left: 0, right: 'auto' } },
                                              { selector: '.storiesContainer', attr: 'data-orientation' } ],
    box:    { alpha:                        [ { selector: '.storiesContainer .storyTextbox', css: 'opacity' } ],
              body:     { color:            [ { selector: '.storiesContainer .storyTexts li .storyBody', css: 'color' } ],
                          font_family:      [ { selector: '.storiesContainer .storyTexts li .storyBody', css: 'font-family' } ],
                          font_size:        [ { selector: '.storiesContainer .storyTexts li .storyBody', css: 'font-size', hasUnit: true } ],
                          shadow:           [ { selector: '.storiesContainer .storyTexts li .storyBody', css: 'text-shadow', callback: publishNS.applyShadow } ] },
              color:                        [ { selector: '.storiesContainer .storyTextbox', css: 'background-color' } ],
              headline: { color:            [ { selector: '.storiesContainer .storyTexts li h2', css: 'color' } ],
                          font_family:      [ { selector: '.storiesContainer .storyTexts li h2', css: 'font-family' } ],
                          font_size:        [ { selector: '.storiesContainer .storyTexts li h2', css: 'font-size', hasUnit: true } ],
                          shadow:           [ { selector: '.storiesContainer .storyTexts li h2', css: 'text-shadow', callback: publishNS.applyShadow } ] },
              margin:                       [ { selector: '.storiesContainer .storyTexts li', css: 'margin', hasUnit: true },
                                              { selector: '.storiesContainer .storyTextbox', css: 'margin', hasUnit: true } ],
              shadow:                       [ { selector: '.storiesContainer .storyTextbox', css: 'box-shadow', callback: publishNS.applyShadow } ],
              width:                        [ { selector: '.storiesContainer .storyTextbox', css: 'width', hasUnit: true },
                                              { selector: '.storiesContainer .storyTexts li', css: 'width', hasUnit: true } ] },
    pager:  { disposition:                  [ { selector: '.storiesContainer .storyPager a', css: 'color', map: { light: '#ddd', dark: '#222' } },
                                              { selector: '.storiesContainer .storyPager a.selected', css: 'color', map: { light: '#fff', dark: '#000' } },
                                              { selector: '.storiesContainer .storyPagerBackground', css: 'background-color', map: { light: '#000', dark: '#fff' } },
                                              { selector: '.storiesContainer .storyPager a', css: 'background-position', map: { light: '0 0', dark: '0 -7px' } },
                                              { selector: '.storiesContainer .storyPager a.selected', css: 'background-position', map: { light: '-7px 0', dark: '-7px -7px' } } ],
              position:                     [ { selector: '.storiesContainer .storyPager', css: 'bottom', map: { box: '1.3em', center: '1em' } },
                                              { selector: '.storiesContainer .storyPager', css: 'height', map: { box: 'auto', center: '0.7em' } },
                                              { selector: '.storiesContainer .storyPager', css: 'padding', map: { box: '0 1.5em', center: '0' } },
                                              { selector: '.storiesContainer .storyPager', css: 'width', map: { box: 'auto', center: '100%' } },
                                              { selector: '.storiesContainer .storyPagerBackground', css: 'display', map: { box: 'none', center: 'block' } } ],
              type:                         [ { selector: '.storiesContainer .storyPager a', css: 'text-indent', map: { bullets: '-9999px', numbers: '0' } },
                                              { selector: '.storiesContainer .storyPager a', css: 'background-image', map: { bullets: 'url(/stylesheets/images/interface/story_pager.png)', numbers: 'none' } } ] }
};

$.Control.extend('pane_storiesTextbox', {
    getTitle: function()
    { return 'Text Box'; },

    getSubtitle: function()
    { return 'Customize the appearance of the text-based content area'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveWorkingTheme(); },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Layout and Appearance', name: 'overall',
            fields: [
            {   text: 'Position', name: 'orientation',
                prompt: 'Where the content should be positioned',
                type: 'radioSelect', options: ['left', 'right'] },
            {   type: 'group', text: 'Width', includeLabel: true,
                lineClass: 'dimensions', options: [
                {   type: 'text', name: 'box.width.value', inputOnly: true },
                {   type: 'select', name: 'box.width.unit', inputOnly: true,
                    options: publishNS.dimensionOptions }] },
            {   type: 'group', text: 'Margin', includeLabel: true,
                lineClass: 'dimensions', options: [
                {   type: 'text', name: 'box.margin.value', inputOnly: true },
                {   type: 'static', name: 'box.margin.unit', inputOnly: true,
                    value: 'em' }] },
            {   text: 'Background Color', name: 'box.color',
                prompt: 'The background color of the box',
                type: 'color', advanced: true, showLabel: true },
            {   text: 'Box Opacity', name: 'box.alpha',
                prompt: 'The background opacity of the box',
                type: 'slider', minimum: 0, maximum: 1 }/*,
            {   text: 'Shadow', name: 'box.shadow',
                prompt: 'Drop shadow strength around the box',
                type: 'slider', minimum: 0, maximum: 1 }*/ ]
        }, {
            title: 'Headline', name: 'text',
            fields: [
            {   text: 'Font Family', name: 'box.headline.font_family',
                prompt: 'Choose a font',
                type: 'select', options: publishNS.fontOptions },
            {   text: 'Font Color', name: 'box.headline.color',
                prompt: 'The color of the headline text',
                type: 'color', advanced: true, showLabel: true },
            {   type: 'group', text: 'Font Size', includeLabel: true,
                lineClass: 'dimensions', options: [
                {   type: 'text', name: 'box.headline.font_size.value', inputOnly: true },
                {   type: 'select', name: 'box.headline.font_size.unit', inputOnly: true,
                    options: publishNS.dimensionOptions }] },
            {   text: 'Shadow', name: 'box.headline.shadow.alpha',
                prompt: 'Drop shadow strength on the headline text',
                type: 'slider', minimum: 0, maximum: 1 } ]
        }, {
            title: 'Body Text', name: 'text',
            fields: [
            {   text: 'Font Family', name: 'box.body.font_family',
                prompt: 'Choose a font',
                type: 'select', options: publishNS.fontOptions },
            {   text: 'Font Color', name: 'box.body.color',
                prompt: 'The color of the body text',
                type: 'color', advanced: true, showLabel: true },
            {   type: 'group', text: 'Font Size', includeLabel: true,
                lineClass: 'dimensions', options: [
                {   type: 'text', name: 'box.body.font_size.value', inputOnly: true },
                {   type: 'select', name: 'box.body.font_size.unit', inputOnly: true,
                    options: publishNS.dimensionOptions } ] },
            {   text: 'Shadow', name: 'box.body.shadow.alpha',
                prompt: 'Drop shadow strength on the body text',
                type: 'slider', minimum: 0, maximum: 1 } ]
        } ];
    }
}, {name: 'textbox', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('textbox', 'pane_storiesTextbox');

$.Control.extend('pane_storiesPager', {
    getTitle: function()
    { return 'Pager'; },

    getSubtitle: function()
    { return 'Customize the appearance of the story pager'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveWorkingTheme(); },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Appearance and Layout', name: 'pager',
            fields: [
            {   text: 'Position', name: 'pager.position',
                prompt: 'Where the pager should be located',
                type: 'radioSelect', options: ['center', 'box'] },
            {   text: 'Pager Type', name: 'pager.type',
                prompt: 'Type of glyph the pager should use',
                type: 'radioSelect', options: ['bullets', 'numbers'] },
            {   text: 'Disposition', name: 'pager.disposition',
                prompt: 'Pager background and glyph color',
                type: 'radioSelect', options: ['light', 'dark'] } ]
        } ];
    }
}, {name: 'pager', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('pager', 'pane_storiesPager');

$.Control.extend('pane_storiesOther', {
    getTitle: function()
    { return 'Other'; },

    getSubtitle: function()
    { return 'Other customizable options on stories'; },

    _getCurrentData: function()
    { return this._super() || publishNS.resolveWorkingTheme(); },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function()
    {
        return [
        {
            title: 'Background', name: 'background',
            fields: [
            {   type: 'group', text: 'Height', includeLabel: true,
                lineClass: 'dimensions', options: [
                {   type: 'text', name: 'height.value', inputOnly: true },
                {   type: 'static', name: 'height.unit', inputOnly: true,
                    value: 'em' } ] },
            {   text: 'Slide Advance', name: 'autoAdvance',
                prompt: 'Length of time to wait (in seconds)',
                type: 'slider', minimum: 0, maximum: 20 },
            {   value: 'How long to pause on each slide before automatically ' +
                       'advancing to the next. Set to zero to disable it entirely.',
                type: 'static' } ]
        } ];
    }
}, {name: 'other', noReset: true}, 'controlPane');
$.gridSidebar.registerConfig('other', 'pane_storiesOther');

//////////////////////////////////////
// SECTION: Styling Helpers

blist.publish.findCache = {};
blist.publish.findContextElem = function(selector)
{
    if (_.isUndefined(publishNS.findCache[selector]))
    {
        publishNS.findCache[selector] = $(selector);
    }
    return publishNS.findCache[selector];
};

blist.publish.applyCustomizationToPreview = function(hash)
{
    publishNS.applicator(publishNS.customizationApplication, hash);

    // apply some weird things we can't handle in the applicator
    var $storyTextbox = $('.storiesContainer .storyTextbox');
    $storyTextbox.height($('.storiesContainer').height() -
        30 - ($storyTextbox.outerHeight(true) - $storyTextbox.outerHeight(false)));

    var $pager = $('.storiesContainer .storyPager');
    if (!$('.storiesContainer .storyPagerBackground').is(':visible'))
    {
        // then pager is in box mode.
        $pager.width($storyTextbox.width());
    }
    else
    {
        // the pager is in centered mode; unset explicit width
        $pager.css('width', '');
    }
};

blist.publish.generateStyleNode = function()
{
    return $('head')
        .append('<style id="customizationStyles" type="text/css"></style>')
        .children('#customizationStyles')[0];
};

blist.publish.retrieveStylesheets = function()
{
    return document.styleSheets;
};


//////////////////////////////////////
// SECTION: Data Handling Methods

blist.publish.initCustomization = function()
{
    publishNS.workingTheme = $.extend(true, {}, publishNS.currentTheme);

    $('.publisherHeader').removeClass('unsaved');
    if (!_.isUndefined(publishNS.sidebar))
    {
        publishNS.sidebar.refresh();
    }
};

blist.publish.cleanData = function(data)
{
    // right now, we're clean on this page.
    return data;
};

blist.publish.saveCustomization = function(callback)
{
    $.ajax({
        url: '/admin/home/stories/appearance',
        type: 'PUT',
        cache: false,
        contentType: "application/json",
        data: JSON.stringify({ stories: publishNS.cleanData(publishNS.workingTheme) }),
        dataType: "json",
        success: function(response)
        {
            // update with latest from server
            publishNS.currentTheme = response;

            publishNS.initCustomization();
            callback();
        },
        error: function(request, status, error)
        {
            // TODO: wait and retry and/or notify user
        }
    });
};


$(function()
{
    // Init data
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
    publishNS.sidebar.show('textbox');

    // Load in customization
    publishNS.applyCustomizationToPreview(publishNS.workingTheme);

    $('.previewScrollContainer').css('height', '100%').css('width', '100%');

});

})(jQuery);

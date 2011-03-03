;var publishNS = blist.namespace.fetch('blist.publish');

// We're not saving anything, so don't pester users
publishNS.dontPromptOnLeaving = true;

publishNS.cleanData = function(obj)
{
    if (!$.isPlainObject(obj)) { return obj; }

    var newObj = {};
    _.each(obj, function(v, k)
    {
        if (v && v !== '-any-') { newObj[k] = publishNS.cleanData(v); }
    });
    return newObj;
};

publishNS.applyCustomizationToPreview = function(hash)
{
    // No live updating, just reflect in the embed code
    catalogNS.updateBrowseEmbedCode();
};

publishNS.initCustomization = function()
{
    publishNS.workingTheme = $.extend(true, {}, publishNS.currentTheme);

    $('.publisherHeader').removeClass('unsaved');
    if (!_.isUndefined(publishNS.sidebar))
    {
        publishNS.sidebar.refresh();
    }
};

// Not really "save", more of "apply" (preview), but it fits our publisher
// paradigm better, as we don't want to refresh the iframe on every change
publishNS.saveCustomization = function(callback)
{
    publishNS.currentTheme = publishNS.workingTheme;
    catalogNS.updateMinSizes();

    catalogNS.loadIframe(publishNS.$previewPane, catalogNS.generateEmbedSrc(), function() {
        $('.loadingMessage').fadeOut();
        publishNS.$previewPane.fadeIn();
        callback();
    });
    publishNS.$previewPane.fadeOut(function() {
        $('.loadingMessage').fadeIn();
    });
};

var catalogNS = {
    anyValueHack: function(options)
    {
        options = options || [];
        options.unshift({
            text: 'Select a value',
            value: '-any-'
        });
        return options;
    },

    generateEmbedSrc: function(config) {
        var configuration = config || catalogNS.widgetDataSource();
        return publishNS.browseWidgetBase + '?' + $.param(publishNS.cleanData(configuration));
    },

    getMinWidth: function()
    {
        if (catalogNS.hasFacets())
        { return 750; }
        return 600;
    },

    handleResizeRequest: function($this, $formElem)
    {
        var val      = parseInt($this.val()),
            attr     = $this.attr('data-valbind'),
            minWidth = getMinWidth();

        if ($.isNaN(val) || val < minSizes[attr])
        {
            $this.closest('.line').addClass('error');
            return;
        }

        $this.closest('.line').removeClass('error');

        publishNS[attr] = val;
        catalogNS.updateBrowseEmbedCode();

        $('#previewWidget').animate({
            height: publishNS.browseWidgetHeight,
            width: publishNS.browseWidgetWidth
        });
        publishNS.$previewPane
            .animate({width: publishNS.browseWidgetWidth});
    },

    hasFacets: function() {
        return _.size((publishNS.cleanData(publishNS.currentTheme) || {}).facets) > 0;
    },

    loadIframe: function($target, src, callback)
    {
        $target.empty().append('<iframe frameborder="0" height="' +
           publishNS.browseWidgetHeight + 'px" width="' + publishNS.browseWidgetWidth + 'px" id="previewWidget"></iframe>');

        $target.find('iframe#previewWidget')
            .attr('src', src)
            .load(function() {
                callback(this);
            });
    },

    minSizes: {},

    updateBrowseEmbedCode: function()
    {
        var iframeSrc = '<iframe frameborder="0" height="' +
            publishNS.browseWidgetHeight + 'px" width="' +
            publishNS.browseWidgetWidth + 'px" src="'+
            catalogNS.generateEmbedSrc() + '"></iframe>';
        if(!$.isBlank(publishNS.$embedForm))
        { publishNS.$embedForm.val(iframeSrc); }
    },

    updateMinSizes: function()
    {
        catalogNS.minSizes.browseWidgetWidth = catalogNS.getMinWidth();
        catalogNS.minSizes.browseWidgetHeight = 55 * publishNS.currentTheme.limit;
        $('#gridSidebar_embed .minWidthHint').text(catalogNS.minSizes.browseWidgetWidth);
        $('#gridSidebar_embed .minHeightHint').text(catalogNS.minSizes.browseWidgetHeight);
    },

    widgetDataSource: function() {
        return publishNS.workingTheme;
    }
};

_.each([
{
    name: 'filter',
    priority: 1,
    title: 'Filter',
    subtitle: 'Choose the default filters',
    noReset: true,
    dataSource: catalogNS.widgetDataSource,
    sections: [
    {
        title: 'Search', name: 'search',
        fields: [
        {   text: 'Search Term', name: 'defaults.q',
            type: 'text'},
        {   text: 'Hide Search', name: 'disable.search',
            type: 'checkbox' }
        ]
    },
    {
        title: 'Views', name: 'views',
        fields: [
        {   text: 'View Type', name: 'defaults.limitTo', prompt: null,
            type: 'select', options: catalogNS.anyValueHack(publishNS.selectOptions.limitTo.options) },
        {   text: 'Show View Types', name: 'facets.type',
            type: 'checkbox' }
        ]
    },
    {
        title: 'Categories', name: 'categories',
        fields: [
        {   text: 'Category', name: 'defaults.category', prompt: null,
            type: 'select', options: catalogNS.anyValueHack(publishNS.selectOptions.categories.options) },
        {   text: 'Show Categories', name: 'facets.category',
            type: 'checkbox' }
        ]
    },
    {
        title: 'Topics', name: 'topics',
        fields: [
        {   text: 'Topic', name: 'defaults.tags', prompt: null,
            type: 'select', options: catalogNS.anyValueHack(publishNS.selectOptions.topics) },
        {   text: 'Show Topics', name: 'facets.topic',
            type: 'checkbox' }
        ]
    }]
},
{
    name: 'advanced',
    priority: 3,
    title: 'Advanced',
    subtitle: 'Choose sorting and advanced options',
    noReset: true,
    dataSource: catalogNS.widgetDataSource,
    sections: [
    {
        title: 'Sort Results', name: 'sort',
        fields: [
        {   text: 'Sort By', name: 'defaults.sortBy',
            type: 'select', options: publishNS.selectOptions.sortBy },
        {   text: 'Time Period', name: 'sortPeriod',
            type: 'select', linkedField: 'defaults.sortBy',
            options: function(val) {
                var sortOpt = _.detect(publishNS.selectOptions.sortBy, function(item) {
                    return item.value == val;
                });
                if (!(sortOpt && sortOpt.is_time_period))
                { return 'disabled'; }
                return publishNS.selectOptions.timePeriods;
            }
        },
        {   text: 'Hide Sort Control', name: 'disable.sort',
            type: 'checkbox' }]
    },
    {
        title: 'Result Options', name: 'limit',
        fields: [
        {   text: 'Results Per Page', name: 'limit',
            type: 'text' },
        {   text: 'Disable Paging', name: 'disable.pagination',
            type: 'checkbox' }]
    }]
},
{
    name: 'embed',
    priority: 5,
    title: 'Embed',
    subtitle: 'Grab the embed code for your catalog widget',
    noReset: true,
    dataSource: catalogNS.widgetDataSource,
    sections: [
    {
        customContent: {
            template: 'embedForm',
            directive: {},
            data: {},
            callback: function($formElem)
            {
                updateMinSizes();
                publishNS.$embedForm = $formElem.find('.htmlCode');
                publishNS.$embedForm.click(function() { $(this).select(); });

                $formElem.find('.sizeInput').change( function() {
                    catalogNS.handleResizeRequest($(this), $formElem)
                });
                // Generate initial embed code
                catalogNS.updateBrowseEmbedCode();
            }
        }
    }]
}], $.gridSidebar.registerConfig);

$(function(){

    publishNS.initCustomization();

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

    publishNS.$previewPane = $('.previewPane');
    publishNS.sidebar.show('filter');

    catalogNS.loadIframe(publishNS.$previewPane, catalogNS.generateEmbedSrc(), function() {
        $('.loadingMessage').fadeOut(function() {
            $('.previewScrollContainer')
                .css('height', '100%')
                .css('width', '100%');
        });
    });
});

var widgetNS = blist.namespace.fetch('blist.widget');
var commonNS = blist.namespace.fetch('blist.common');

blist.widget.resizeViewport = function()
{
    var $contentContainer = $('.widgetContent');
    var targetHeight = $(window).height() -
        widgetNS.theme.frame.border.width.value * 2 -
        widgetNS.theme.frame.padding.value;
    $contentContainer.siblings(':visible').each(function()
    {
        targetHeight -= $(this).outerHeight(true);
    });
    $contentContainer.children().height(targetHeight);

    $('#data-grid')
        .height($('.widgetContentGrid').innerHeight())
        .trigger('resize');
};

blist.widget.hideToolbar = function()
{
    $('.toolbar')
        .removeClass().addClass('toolbar')
        .hide(
            'slide',
            { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') },
            function()
            {
                widgetNS.resizeViewport();
            });
};

blist.widget.showToolbar = function()
{
    $('.toolbar').show('slide', { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') });
    widgetNS.resizeViewport();
};

$(function()
{
    // orientation
    widgetNS.orientation = widgetNS.theme['frame']['orientation'];

    // ie?
    if ($.browser.msie)
    {
        $('body').addClass('ie ie' + $.browser.version.slice(0, 1)); // I guess this will break when we hit IE10.
    }

    // sizing
    widgetNS.resizeViewport();
    $(window).resize(function() { widgetNS.resizeViewport(); });

    // generic events
    $.live('a[rel$=external]', 'focus', function(event)
    {
        this.target = "_blank";        
    });
    $.live('a[rel$=external]', 'click', function(event)
    {
        // interstitial
        if (theme['behavior']['interstitial'] === true)
        {
            event.preventDefault();
            // todo: pop interstitial
            return;
        }
    });

    // menus
    $('.mainMenu').menu({
        menuButtonClass: 'mainMenuButton',
        contents: [
            { text: 'Views', className: 'views', subtext: 'Filters, Charts, and Maps', href: '#views' },
            { text: 'Downloads', className: 'downloads', subtext: 'Download various file formats', href: '#downloads' },
            { text: 'Comments', className: 'comments', subtext: 'Read comments on this dataset', href: '#comments' },
            { text: 'Embed', className: 'embed', subtext: 'Embed this player on your site', href: '#embed' },
            { text: 'Print', className: 'print', subtext: 'Print out this dataset', href: '#print' },
            { text: 'About the Socrata Social Data Player', className: 'about', href: '#about' }
        ]
    });

    // toolbar
    $('.subHeaderBar .search a').click(function(event)
    {
        event.preventDefault();

        var $toolbar = $('.toolbar');
        if ($toolbar.hasClass('search') && $toolbar.is(':visible'))
        {
            widgetNS.hideToolbar();
        }
        else
        {
            $toolbar.removeClass().addClass('toolbar search');

            if (!$toolbar.is(':visible'))
            {
                widgetNS.showToolbar();
            }
        }
    });
    $('.toolbar .close').click(function(event)
    {
        widgetNS.hideToolbar();
    });

    // grid
    if (!widgetNS.isAltView)
    {
        var $dataGrid = $('#data-grid');
        if ($dataGrid.length > 0)
        {
            $dataGrid
                .bind('full_load',
                    function(){ $('#header .headerBar').removeClass('hide'); })
                .datasetGrid({viewId: widgetNS.viewId,
                    accessType: 'WIDGET',
                    showRowNumbers: widgetNS.theme['grid']['row_numbers'],
                    showRowHandle: widgetNS.theme['grid']['row_numbers'],
                    editEnabled: typeof(isOldIE) === 'undefined',
                    manualResize: true,
                    columnNameEdit: typeof(isOldIE) === 'undefined' &&
                        blist.isOwner,
                    filterForm: '.toolbar .toolbarSearchForm',
                    clearFilterItem: '.toolbar .close',
                    autoHideClearFilterItem: false,
                    clearTempViewCallback: widgetNS.clearTempViewTab,
                    setTempViewCallback: widgetNS.setTempViewTab,
                    initialResponse: $.unescapeObject(widgetNS.viewJson)
                });
        }
    }
    else if (blist.display.invokeVisualization)
    { $('#data-grid').visualization(); }
});
var widgetNS = blist.namespace.fetch('blist.widget');
var commonNS = blist.namespace.fetch('blist.common');

blist.widget.resizeViewport = function()
{
    var $contentContainer = $('.widgetContent');
    var targetHeight = $(window).height() - 5; // -2 for border, -3 for margin
    $contentContainer.siblings().each(function()
    {
        targetHeight -= $(this).outerHeight(true);
    });
    $contentContainer.children().height(targetHeight);

    $('#data-grid')
        .height($('.widgetContentGrid').innerHeight())
        .trigger('resize');
};

$(function()
{
    // ie?
    if ($.browser.msie)
    {
        $('body').addClass('ie ie' + $.browser.version[0]); // I guess this will break when we hit IE10.
    }

    widgetNS.resizeViewport();
    $(window).resize(function() { widgetNS.resizeViewport(); });

    // menus
    $('.mainMenu').menu({
        menuButtonClass: 'mainMenuButton',
        contents: [
            { text: 'Views', 'class': 'views', subtext: 'Filters, Charts, and Maps', href: '#views' },
            { text: 'Downloads', 'class': 'downloads', subtext: 'Download various file formats', href: '#downloads' },
            { text: 'Comments', 'class': 'comments', subtext: 'Read comments on this dataset', href: '#comments' },
            { text: 'Embed', 'class': 'embed', subtext: 'Embed this player on your site', href: '#embed' },
            { text: 'About the Socrata Social Data Player', 'class': 'about', href: '#about' }
        ]
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
                    filterForm: '#header form',
                    clearFilterItem: '#header form .clearSearch',
                    clearTempViewCallback: widgetNS.clearTempViewTab,
                    setTempViewCallback: widgetNS.setTempViewTab,
                    initialResponse: $.unescapeObject(widgetNS.viewJson)
                });
        }
    }
    else if (blist.display.invokeVisualization)
    { $('#data-grid').visualization(); }
});
var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

blist.datasetPage.expandSearch = function()
{
    $('#searchForm .searchField:not(.expanded)')
        .animate({ width: '11em' })
        .addClass('expanded');
};
blist.datasetPage.collapseSearch = function()
{
    $('#searchForm .searchField')
        .animate({ width: '2em' })
        .removeClass('expanded');
};
blist.datasetPage.adjustSize = function()
{
    $('.outerContainer').fullScreen().adjustSize();
};

blist.datasetPage.clearTempView = function()
{
    $('#sidebarOptions a.alert').removeClass('alert');
    $('body, #titleBox').removeClass('unsavedView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.setTempView = function()
{
    $('body, #titleBox').addClass('unsavedView');
    // For now unsaved view means something has changed in filter tab
    $('#sidebarOptions .tabFilter a').addClass('alert');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.updateValidView = function()
{
    $('.invalidView').removeClass('invalidView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.pageRenderTypeHidden = function()
{
    $('body').removeClass('pageRenderType');
    $(window).resize();
};

blist.datasetPage.pageRenderTypeShown = function()
{
    $('body').addClass('pageRenderType');
    $(window).resize();
};

blist.datasetPage.displayRow = function(rowId)
{
    datasetPageNS.pageRenderType.displayRowByID(rowId);
};


(function($)
{
    if (!blist.dataset.valid) { $('body').addClass('invalidView'); }
})(jQuery);

$(function()
{
    // Before we do anything else, clear away the about metadata.
    $('.aboutDataset').appendTo('#templates');
    $('.aboutLoad').remove();

    if (!$.isBlank($.uploadDialog)) { $.uploadDialog.version = 2; }

    // Before we fullscreen, move the footer inside the sizing container.
    $('#siteFooter')
        .addClass('clearfix')
        .appendTo('.siteInnerWrapper');

    $('.outerContainer').fullScreen();


    // Page render type
    datasetPageNS.pageRenderType = $('#pageRenderType').pageRenderType({
        hideCallback: datasetPageNS.pageRenderTypeHidden,
        showCallback: datasetPageNS.pageRenderTypeShown,
        view: blist.display.view
    });
    if ($.isBlank(blist.display.initialRow))
    { datasetPageNS.pageRenderType.hide(); }
    else
    { datasetPageNS.pageRenderType.displayRowByIndex(blist.display.initialRow); }

    $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId)
        { datasetPageNS.displayRow(rowId); });

    // grid
    var $dataGrid = blist.$display;
    if ($dataGrid.length > 0)
    {
        if (blist.dataset.isGrid())
        {
            $dataGrid
                .datasetGrid({view: blist.dataset,
                    columnDeleteEnabled: blist.dataset.type == 'blist' &&
                        blist.dataset.hasRight('remove_column'),
                    columnPropertiesEnabled: true,
                    columnNameEdit: blist.dataset.hasRight('update_view'),
                    showAddColumns: blist.dataset.type == 'blist' &&
                        blist.dataset.hasRight('add_column'),
                    accessType: 'WEBSITE', manualResize: true, showRowHandle: true,
                    clearTempViewCallback: datasetPageNS.clearTempView,
                    setTempViewCallback: datasetPageNS.setTempView,
                    filterForm: '#searchForm',
                    clearFilterItem: '#searchForm .clearSearch',
                    isInvalid: !blist.dataset.valid,
                    validViewCallback: datasetPageNS.updateValidView,
                    addColumnCallback: function(parId)
                    {
                        datasetPageNS.sidebar
                            .addPane('edit.addColumn', {parentId: parId});
                        datasetPageNS.sidebar.show('edit.addColumn');
                    },
                    editColumnCallback: function(colId, parId)
                    {
                        var col = blist.dataset.columnForID(colId) ||
                            blist.dataset.columnForID(parId);
                        if (col.id != colId) { col = col.childColumnForID(colId); }

                        datasetPageNS.sidebar.hide();
                        datasetPageNS.sidebar.addPane('columnProperties', col);
                        datasetPageNS.sidebar.show('columnProperties');
                    }
                });

            // Fire up guided filter if available
            if (!_.isUndefined(blist.dataset.metadata) &&
                !_.isUndefined(blist.dataset.metadata.facets))
            {
                blist.$display.bind('dataset_ready', function()
                { datasetPageNS.sidebar.show('filter.guidedFilter'); });
            }
        }
    }

    // sidebar and sidebar tabs
    datasetPageNS.sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: $dataGrid[0],
        onSidebarShown: function(primaryPane)
        {
            $('#sidebarOptions li').removeClass('active');
            $('#sidebarOptions a[data-paneName=' + primaryPane + ']')
                .closest('li').addClass('active');
        },
        onSidebarClosed: function()
        {
            $('#sidebarOptions li').removeClass('active');
        },
        setSidebarTop: false
    });
    $('#sidebarOptions a[data-paneName]').each(function()
    {
        var $a = $(this);
        var dataPaneName = $a.attr('data-paneName');
        if (datasetPageNS.sidebar.hasPane(dataPaneName))
        {
            $a.click(function(e)
            {
                e.preventDefault();
                datasetPageNS.sidebar.show(dataPaneName);
                $.analytics.trackEvent('dataset page (v4-chrome)',
                    dataPaneName + ' pane opened', blist.dataset.id);
            });
        }
        else
        { $a.closest('li').hide(); }
    });

    blist.dataset.bind('columns_changed',
        function() { datasetPageNS.sidebar.updateEnabledSubPanes(); });
    blist.dataset.bind('set_temporary', datasetPageNS.setTempView);
    blist.dataset.bind('clear_temporary', datasetPageNS.clearTempView);

    // toolbar area
    $('#viewsMenu').menu({
        additionalDataKeys: [ 'targetPane' ],
        menuButtonContents: '',
        menuButtonTitle: 'More Views',
        contents: [
            { text: 'Parent Dataset', className: 'typeBlist', href: '#parent',
              onlyIf: !_.include(['blist', 'blob'], blist.dataset.type) },
            { divider: true },
            { text: 'Saved Filters', className: 'typeFilter', href: '#savedFilters',
              targetPane: 'filter.savedFilters',
              onlyIf: !_.include(['href', 'blob'], blist.dataset.type) },
            { text: 'Saved Visualizations', className: 'typeVisualization',
              href: '#savedVisualizations', targetPane: 'visualize.savedVisualizations',
              onlyIf: !_.include(['href', 'blob'], blist.dataset.type) },
            { divider: true },
            { text: 'About This Dataset', className: 'about', href: '#about',
              targetPane: 'about' }
        ],
        onOpen: function()
        {
            $.analytics.trackEvent('dataset page (v4-chrome)', 'views menu opened',
                blist.dataset.id);
        }
    });

    $('#viewsMenu a[data-targetPane]').click(function(e)
    {
        e.preventDefault();
        $('#gridSidebar').gridSidebar().show($(this).attr('data-targetPane'));
    });

    $('#titleBox').expander({
        contentSelector: '#description',
        expandSelector: '.descriptionExpander',
        resizeFinishCallback: datasetPageNS.adjustSize
    });

    var $dsIcon = $('#datasetIcon');
    $dsIcon.socrataTip($dsIcon.text());

    var hideTimeout;
    var hideCheck = function()
    {
        clearTimeout(hideTimeout);
        _.defer(function()
        {
            if ($('#searchForm .searchField').hasClass('prompt'))
            { hideTimeout = setTimeout(datasetPageNS.collapseSearch, 1500); }
        });
    };
    $('#searchForm')
        .hover(function()
        {
            clearTimeout(hideTimeout);
            datasetPageNS.expandSearch();
        }, hideCheck)
        .find('.searchField').blur(hideCheck).end()
        .find('.icon').click(function()
        {
            $(this).closest('form').submit();
        });


    blist.datasetControls.hookUpShareMenu(blist.dataset,
        $('#shareMenu'),
        {
            menuButtonContents: $.tag({tagName: 'span', 'class': 'shareIcon'}, true),
            onOpen: function()
            {
                $.analytics.trackEvent('dataset page (v4-chrome)', 'share menu opened',
                    blist.dataset.id);
            }
        });

    // hook up menu items for events analytics
    $('#shareMenu .menuDropdown a, #viewsMenu .menuDropdown a').click(function()
    {
        $.analytics.trackEvent('dataset page (v4-chrome)', 'menu item clicked: ' +
            $(this).attr('href'), blist.dataset.id);
    });

    $('.fullscreenButton').click(function(event)
    {
        event.preventDefault();

        $('#siteHeader, #siteFooter').animate(
            { opacity: 'toggle' },
            datasetPageNS.adjustSize);
        datasetPageNS.adjustSize(); // So that when animating in footer is visible.
        $(this)
            .toggleClass('maximize')
            .toggleClass('minimize');
    });


    // Edit toolbar
    $('#editOptions .undo').click(function (event)
    {
        event.preventDefault();
        if (!$(event.target).is('.disabled'))
        { $dataGrid.blistModel().undo(); }
    });
    $('#editOptions .redo').click(function (event)
    {
        event.preventDefault();
        if (!$(event.target).is('.disabled'))
        { $dataGrid.blistModel().redo(); }
    });
    $dataGrid.bind('undo_redo_change', function(e)
    {
        var model = $dataGrid.blistModel();
        $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
        $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
    });
    if (!$.isBlank($dataGrid.blistModel))
    {
        var model = $dataGrid.blistModel();
        $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
        $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
    }


    // Format toolbar
    $('#formatOptions select').uniform();

    $('#formatOptions').formatOptions({gridSelector: $dataGrid});


    // Unsaved view stuff
    blist.dataset.bind('valid', function() { datasetPageNS.updateValidView(); });

    blist.datasetControls.unsavedViewPrompt();

    $('.unsavedLine a.save').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if ($a.is('.disabled')) { return; }

        $a.data('saveText', $a.text());
        $a.text($a.attr('data-savingText'));
        $a.addClass('disabled');

        blist.dataset.save(function()
        {
            $a.text($a.data('saveText'));
            $a.removeClass('disabled');
        });
    });

    $('.unsavedLine a.saveAs').click(function(e)
    {
        e.preventDefault();
        blist.datasetControls.showSaveViewDialog();
    });

    $('.unsavedLine a.revert').click(function(e)
    {
        e.preventDefault();
        blist.dataset.reload();
    });


    // Invalid views

    var viewEditPane = $.gridSidebar.paneForDisplayType[blist.dataset.type];
    if ($.isBlank(viewEditPane) ||
        !datasetPageNS.sidebar.isPaneEnabled(viewEditPane))
    { $('.invalidActions .editView').hide(); }
    else
    {
        $('.invalidActions .editView').click(function(e)
        {
            e.preventDefault();
            datasetPageNS.sidebar.show(viewEditPane);
        });
    }

    $('.invalidActions .removeView').click(function(e)
    {
        e.preventDefault();
        if (!confirm('Are you sure you want to remove this view?'))
        { return; }

        blist.dataset.remove(function()
        {
            blist.dataset.getParentDataset(function(parDS)
            {
                if (!$.isBlank(parDS)) { parDS.redirectTo(); }
                else { window.location = '/datasets'; }
            });
        });
    });

    // iPad special casing
    if ($.device.ipad)
    {
        // essentially, disable scrolling of the main container
        $(document).bind('touchmove', function(event)
        {
            event.originalEvent.preventDefault();
        });
    }

    // Data calls
    _.defer(function()
    {
        // register opening
        blist.dataset.registerOpening(null, document.referrer);


        // set up the main menu
        blist.dataset.getParentDataset(function(parDS)
        {
            if (!$.isBlank(parDS))
            {
                $('#viewsMenu .typeBlist a').attr('href', parDS.url);
            }
            else
            {
                $('#viewsMenu .typeBlist').hide().next().removeClass('divider');
            }
        });

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('dataset page (v4-chrome)',
            'page loaded', blist.dataset.id);
    });
});

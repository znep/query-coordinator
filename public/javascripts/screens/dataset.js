var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

blist.datasetPage.expandSearch = function()
{
    $('#searchButton .searchField:not(.expanded)')
        .animate({ width: '12em', paddingLeft: '0.3em', paddingRight: '1.6em' })
        .css('background-color', '#fff')
        .addClass('expanded');
};
blist.datasetPage.collapseSearch = function()
{
    $('#searchButton .searchField')
        .animate({ width: '2em', paddingLeft: '1px', paddingRight: '1px' })
        .css('background-color', '')
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

blist.datasetPage.updateValidView = function(view)
{
    blist.display.isInvalid = false;
    $('.invalidView').removeClass('invalidView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

(function($)
{
    if (blist.display.isInvalid) { $('body').addClass('invalidView'); }
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

    // grid
    var $dataGrid = blist.$display;
    if ($dataGrid.length > 0)
    {
        if (blist.display.isGrid)
        {
            $dataGrid
                .bind('columns_updated', function()
                    { datasetPageNS.sidebar.refresh(); })
                .datasetGrid({viewId: blist.display.view.id,
                    columnDeleteEnabled: _.include(blist.display.view.rights,
                        'remove_column'),
                    columnPropertiesEnabled: _.include(blist.display.view.rights,
                        'update_view'),
                    columnNameEdit: _.include(blist.display.view.rights,
                        'update_view'),
                    showAddColumns: blist.display.type == 'blist' &&
                        _.include(blist.display.view.rights, 'add_column'),
                    accessType: 'WEBSITE', manualResize: true, showRowHandle: true,
                    clearTempViewCallback: datasetPageNS.clearTempView,
                    setTempViewCallback: datasetPageNS.setTempView,
                    filterForm: '#searchButton .searchForm',
                    clearFilterItem: '#searchButton .clearSearch',
                    isInvalid: blist.display.isInvalid,
                    validViewCallback: datasetPageNS.updateValidView,
                    addColumnCallback: function(parId)
                    {
                        datasetPageNS.sidebar
                            .addPane('edit.addColumn', {parentId: parId});
                        datasetPageNS.sidebar.show('edit.addColumn');
                    },
                    editColumnCallback: function(colId, parId)
                    {
                        var col = _.detect(blist.display.view.columns, function(c)
                            { return c.id == colId || c.id == parId; });
                        if (col.id != colId)
                        {
                            col = _.detect(col.childColumns, function(c)
                                { return c.id == colId; });
                        }
                        datasetPageNS.sidebar.hide();
                        datasetPageNS.sidebar.addPane('columnProperties', col);
                        datasetPageNS.sidebar.show('columnProperties');
                    }
                });

            // Fire up guided filter if available
            if (!_.isUndefined(blist.display.view.metadata) &&
                !_.isUndefined(blist.display.view.metadata.facets))
            {
                blist.$display.bind('full_load.loadGuidedFilter', function()
                {
                    datasetPageNS.sidebar.show('filter.guidedFilter');
                    blist.$display.unbind('full_load.loadGuidedFilter');
                });
            }
        }
        else if (blist.display.invokeVisualization)
        { $dataGrid.visualization(); }
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
                    dataPaneName + ' pane opened', blist.display.view.id);
            });
        }
        else
        { $a.closest('li').hide(); }
    });

    $(document).bind(blist.events.COLUMNS_CHANGED,
        function() { datasetPageNS.sidebar.updateEnabledSubPanes(); });

    // toolbar area
    $('#viewsMenu').menu({
        additionalDataKeys: [ 'targetPane' ],
        menuButtonContents: '',
        menuButtonTitle: 'More Views',
        contents: [
            { text: 'Parent Dataset', className: 'typeBlist', href: '#parent',
              onlyIf: !_.include(['Blist', 'Blob'],
                blist.dataset.getDisplayType(blist.display.view)) },
            { divider: true },
            { text: 'Saved Filters', className: 'typeFilter', href: '#savedFilters',
              targetPane: 'filter.savedFilters' },
            { text: 'Saved Visualizations', className: 'typeVisualization',
              href: '#savedVisualizations', targetPane: 'visualize.savedVisualizations' },
            { divider: true },
            { text: 'About This Dataset', className: 'about', href: '#about',
              targetPane: 'about' }
        ],
        onOpen: function()
        {
            $.analytics.trackEvent('dataset page (v4-chrome)', 'views menu opened',
                blist.display.view.id);
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
            if ($('#searchButton .searchField').hasClass('prompt'))
            { hideTimeout = setTimeout(datasetPageNS.collapseSearch, 1500); }
        });
    };
    $('#searchButton')
        .hover(function()
        {
            clearTimeout(hideTimeout);
            datasetPageNS.expandSearch();
        }, hideCheck)
        .find('.searchField').blur(hideCheck);

    blist.dataset.controls.hookUpShareMenu(blist.display.view,
        $('#shareMenu'),
        {
            menuButtonContents: $.tag({tagName: 'span', 'class': 'shareIcon'}, true),
            onOpen: function()
            {
                $.analytics.trackEvent('dataset page (v4-chrome)', 'share menu opened',
                    blist.display.view.id);
            }
        });

    // hook up menu items for events analytics
    $('#shareMenu .menuDropdown a, #viewsMenu .menuDropdown a').click(function()
    {
        $.analytics.trackEvent('dataset page (v4-chrome)', 'menu item clicked: ' +
            $(this).attr('href'), blist.display.view.id);
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


    // Format toolbar
    $('#formatOptions select').uniform();

    $('#formatOptions').formatOptions({gridSelector: $dataGrid});


    // Unsaved view stuff
    $(document).bind(blist.events.VALID_VIEW,
        function() { datasetPageNS.updateValidView(); });

    blist.dataset.controls.unsavedViewPrompt();

    $('.unsavedLine a.save').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if ($a.is('.disabled')) { return; }

        $a.data('saveText', $a.text());
        $a.text($a.attr('data-savingText'));
        $a.addClass('disabled');

        $.ajax({url: '/views/' + blist.display.view.id + '.json',
            type: 'PUT', contentType: 'application/json', dataType: 'json',
            data: JSON.stringify(blist.dataset.cleanViewForSave(
                $.extend(true, {}, blist.display.view), true)),
            success: function()
            {
                $a.text($a.data('saveText'));
                $a.removeClass('disabled');

                if (blist.display.isGrid)
                { $dataGrid.datasetGrid().clearTempView(null, true); }
            }});
    });

    $('.unsavedLine a.saveAs').click(function(e)
    {
        e.preventDefault();
        blist.dataset.controls.showSaveViewDialog();
    });

    $('.unsavedLine a.revert').click(function(e)
    {
        e.preventDefault();
        $dataGrid.datasetGrid().clearTempView(null, true);
    });


    // Invalid views

    var viewEditPane = $.gridSidebar.paneForDisplayType[
        blist.dataset.getDisplayType(blist.display.view)];
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

        $.ajax({url: '/datasets/' + blist.display.view.id,
            type: 'DELETE', contentType: "application/json",
            success: function()
            {
                if (!$.isBlank(blist.parentViewId))
                {
                    window.location = blist.util.navigation
                        .getViewUrl(blist.parentViewId);
                }
                else
                { window.location = '/datasets'; }
            }
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
        var params = { method: "opening"};
        if (!$.isBlank(document.referrer))
        {
            params.referrer = document.referrer;
        }

        $.ajax({
            url: '/views/' + blist.display.view.id + '.json',
            data: params, 
            dataType: 'json'
        });


        // fetch some data that we'll need
        $.Tache.Get({ url: '/views.json',
            data: { method: 'getByTableId', tableId: blist.display.view.tableId },
            cache: false, dataType: 'json', contentType: 'application/json',
            success: function(views)
            {
                var parDS = _.detect(views, function(view)
                    { return blist.dataset.getDisplayType(view) == 'Blist'; });
                if (!$.isBlank(parDS))
                {
                    $('#viewsMenu .typeBlist a').attr('href',
                        $.generateViewUrl(parDS));
                    blist.parentViewId = parDS.id;
                }
            }});

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('dataset page (v4-chrome)', 'page loaded', blist.display.view.id);
    });
});

var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

blist.datasetPage.adjustSize = function()
{
    $('.outerContainer').fullScreen().adjustSize();
};

blist.datasetPage.clearTempView = function()
{
    $('#sidebarOptions a.alert').removeClass('alert');
    $('body, #datasetBar').removeClass('unsavedView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.setTempView = function()
{
    $('body, #datasetBar').addClass('unsavedView');
    // For now unsaved view means something has changed in filter tab
    $('#sidebarOptions .tabFilter a').addClass('alert');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.updateValidView = function()
{
    $('.invalidView').removeClass('invalidView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.hidePageRenderType = function()
{
    if (!datasetPageNS.$pageRenderType.is(':visible')) { return; }
    datasetPageNS.$pageRenderType.addClass('hide');
    $('body').removeClass('pageRenderType');
    $(window).resize();
    // If initially loaded page view, the grid hasn't been rendered yet
    datasetPageNS.initGrid();

    $('#renderTypeOptions li a').removeClass('active');
    $('#renderTypeOptions li .main').addClass('active');
};

blist.datasetPage.showPageRenderType = function()
{
    if (datasetPageNS.$pageRenderType.is(':visible')) { return; }
    datasetPageNS.$pageRenderType.removeClass('hide');
    $('body').addClass('pageRenderType');
    $(window).resize();

    $('#renderTypeOptions li a').removeClass('active');
    $('#renderTypeOptions li .page').addClass('active');
};

blist.datasetPage.initGrid = function()
{
    if (datasetPageNS.gridInitialized || !blist.dataset.isGrid()) { return; }

    datasetPageNS.$dataGrid
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
            filterForm: '#searchForm', clearFilterItem: '#searchForm .clearSearch',
            isInvalid: !blist.dataset.valid,
            validViewCallback: datasetPageNS.updateValidView,
            addColumnCallback: function(parId)
            {
                datasetPageNS.sidebar.addPane('edit.addColumn', {parentId: parId});
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
    datasetPageNS.gridInitialized = true;
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
    datasetPageNS.$pageRenderType = $('#pageRenderType');
    datasetPageNS.$pageRenderType.pageRenderType({ view: blist.dataset });
    var isPageRT = !$.isBlank(blist.initialRowId);
    if (!isPageRT) { datasetPageNS.hidePageRenderType(); }
    else
    {
        datasetPageNS.showPageRenderType();
        datasetPageNS.$pageRenderType.pageRenderType()
            .displayRowByID(blist.initialRowId);
    }


    // Render types
    $('#renderTypeOptions').pillButtons();
    $('#renderTypeOptions a').click(function(e)
    {
        e.preventDefault();
        if ($.hashHref($(this).attr('href')) == 'page')
        { datasetPageNS.showPageRenderType(); }
        else
        { datasetPageNS.hidePageRenderType(); }
    });
    $(document).bind(blist.events.DISPLAY_ROW, function()
            { datasetPageNS.showPageRenderType(); });


    // grid
    datasetPageNS.$dataGrid = blist.$display;
    if (datasetPageNS.$dataGrid.length > 0)
    {
        if (!isPageRT) { datasetPageNS.initGrid(); }

        if (blist.dataset.isGrid())
        {
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
        dataGrid: datasetPageNS.$dataGrid[0],
        onSidebarShown: function(primaryPane)
        {
            var $activeLink = $('#sidebarOptions a[data-paneName=' + primaryPane + ']');
            $('#sidebarOptions').css('background-color', $activeLink.css('background-color'))
                .find('li').removeClass('active');
            $activeLink.closest('li').addClass('active');
        },
        onSidebarClosed: function()
        {
            $('#sidebarOptions').css('background-color', 'transparent')
                .find('li').removeClass('active');
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
    $('#description').expander({
        contentSelector: 'p',
        expanderCollapsedClass: 'rightArrow',
        expanderExpandedClass: 'leftArrow',
        expandSelector: '.descriptionExpander',
        moveExpandTrigger: true,
        resizeFinishCallback: datasetPageNS.adjustSize
    });

    var $dsIcon = $('#datasetIcon');
    $dsIcon.socrataTip($dsIcon.text());


    blist.datasetControls.hookUpShareMenu(blist.dataset,
        $('#shareMenu'),
        {
            menuButtonContents: $.tag([{tagName: 'span', 'class': 'shareIcon'},
                                       {tagName: 'span', 'class': 'shareText', contents: 'Share'}], true),
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
        { datasetPageNS.$dataGrid.blistModel().undo(); }
    });
    $('#editOptions .redo').click(function (event)
    {
        event.preventDefault();
        if (!$(event.target).is('.disabled'))
        { datasetPageNS.$dataGrid.blistModel().redo(); }
    });
    datasetPageNS.$dataGrid.bind('undo_redo_change', function(e)
    {
        var model = datasetPageNS.$dataGrid.blistModel();
        $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
        $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
    });
    if (!$.isBlank(datasetPageNS.$dataGrid.blistModel))
    {
        var model = datasetPageNS.$dataGrid.blistModel();
        $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
        $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
    }


    // Format toolbar
    $('#formatOptions select').uniform();

    $('#formatOptions').formatOptions({gridSelector: datasetPageNS.$dataGrid});


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

    $('.unsavedLine a.revert, .basedOnTemp .revertLink').click(function(e)
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

    // massage search params
    $('#searchForm').submit(function() { if ($(this).find(
        '.searchField').val() == 'snuffleupadata') {
        _.times(20, function() {
            setTimeout(function() {
                $('<img src="/images/snuffleupadata.gif"/>')
                    .appendTo($('body'))
                    .css('position', 'absolute')
                    .css('zindex', '9999')
                    .css('left', '-48px')
                    .css('top', Math.random() * $(window).height())
                    .animate({left: $(window).width() + 48}, 'slow',
                        function() { $(this).remove(); }
        )}, Math.random() * 4000)})}});

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
                $('.basedOnParent')
                    .addClass('hasParent')
                    .find('.parentName')
                        .attr('href', parDS.url)
                        .text(parDS.name);
            }
        });

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('dataset page (v4-chrome)',
            'page loaded', blist.dataset.id);
    });
});

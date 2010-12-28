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
    datasetPageNS.initGrid();
};

blist.datasetPage.showDefaultRenderType = function()
{
    if (!_.any(datasetPageNS.$renderTypes, function($rt)
        { return $rt.is(':visible'); })) { return; }

    _.each(datasetPageNS.$renderTypes, function($rt)
    {
        $rt.addClass('hide');
        $rt.trigger('hide');
    });
    $('body').removeClass('richRenderType');
    $(window).resize();
    // If initially loaded page view, the grid hasn't been rendered yet
    datasetPageNS.initGrid();
    // If the grid is already loaded, need to force a refresh in case
    // things changed while we were gone
    datasetPageNS.$dataGrid.trigger('refresh');

    $('#renderTypeOptions li a').removeClass('active');
    $('#renderTypeOptions li .main').addClass('active');
};

blist.datasetPage.showRenderType = function(renderType)
{
    if (datasetPageNS.$renderTypes[renderType].is(':visible')) { return; }
    _.each(datasetPageNS.$renderTypes, function($rt) { $rt.addClass('hide'); });
    datasetPageNS.$renderTypes[renderType].removeClass('hide');
    datasetPageNS.$renderTypes[renderType].trigger('show');
    $('body').addClass('richRenderType');
    $(window).resize();

    $('#renderTypeOptions li a').removeClass('active');
    $('#renderTypeOptions li .' + renderType).addClass('active');
};

blist.datasetPage.initGrid = function()
{
    if (datasetPageNS.gridInitialized || !blist.dataset.isGrid() ||
        !blist.dataset.valid) { return; }

    datasetPageNS.$dataGrid
        .datasetGrid({view: blist.dataset,
            columnDeleteEnabled: blist.dataset.type == 'blist' &&
                blist.dataset.hasRight('remove_column'),
            columnPropertiesEnabled: true,
            columnNameEdit: blist.dataset.type == 'blist' &&
                blist.dataset.hasRight('update_column'),
            showAddColumns: blist.dataset.type == 'blist' &&
                blist.dataset.hasRight('add_column'),
            manualResize: true, showRowHandle: true,
            filterForm: '#searchForm', clearFilterItem: '#searchForm .clearSearch',
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

    // Before we fullscreen, move the footer inside the sizing container.
    $('#siteFooter')
        .addClass('clearfix')
        .appendTo('.siteInnerWrapper');

    $('.outerContainer').fullScreen();


    var defRen = $.urlParam(window.location.href, 'defaultRender');
    var isPageRT = !$.isBlank(blist.initialRowId) || defRen == 'page';
    var isFatRowRT = defRen == 'richList';
    var isAltRT = isPageRT || isFatRowRT;
    if ($('#pageRenderType').length > 0)
    {
        blist.$display.find('.rowLink').remove();

        // Page render type
        datasetPageNS.$renderTypes = {};
        datasetPageNS.$renderTypes.page = $('#pageRenderType');
        datasetPageNS.$renderTypes.page.pageRenderType({ view: blist.dataset });
        datasetPageNS.$renderTypes.fatrow = $('#fatRowRenderType');
        datasetPageNS.$renderTypes.fatrow.fatrowRenderType({ view: blist.dataset });

        // Render types
        $('#renderTypeOptions').pillButtons();
        $('#renderTypeOptions a').click(function(e)
        {
            e.preventDefault();
            var rt = $.urlParam($(this).attr('href'), 'defaultRender');
            if (rt == 'richList') { rt = 'fatrow'; }
            switch (rt)
            {
                case 'page':
                case 'fatrow':
                    datasetPageNS.showRenderType(rt);
                    break;
                default:
                    datasetPageNS.showDefaultRenderType();
                    break;
            }
        });

        $(document).bind(blist.events.DISPLAY_ROW, function()
                { datasetPageNS.showRenderType('page'); });

        if (!isAltRT) { datasetPageNS.showDefaultRenderType(); }
        else if (isFatRowRT)
        { datasetPageNS.showRenderType('fatrow'); }
        else if (isPageRT)
        {
            // Cheat by making sure the div is hidden initially
            datasetPageNS.$renderTypes.page.addClass('hide');
            datasetPageNS.showRenderType('page');
            if (!$.isBlank(blist.initialRowId))
            {
                datasetPageNS.$renderTypes.page.pageRenderType()
                    .displayRowByID(blist.initialRowId);
            }
        }
    }

    // grid
    datasetPageNS.$dataGrid = blist.$display;

    // .initGrid() isn't loaded yet, let the lazy-loader
    // handle the call
    if (datasetPageNS.$dataGrid.length > 0 && !isAltRT)
    {
        blist.common.initGrid = datasetPageNS.initGrid;
        blist.configuration._needsInitGrid = true;
    }

    // sidebar and sidebar tabs
    datasetPageNS.sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: datasetPageNS.$dataGrid[0],
        position: blist.sidebarPosition || 'right',
        waitOnDataset: blist.dataset.type != 'form' && blist.dataset.valid,
        onSidebarShown: function(primaryPane)
        {
            var $opts = $('#sidebarOptions');
            $opts.find('li').removeClass('active');

            var $activeLink = $('#sidebarOptions a[data-paneName=' +
                primaryPane + ']');
            if ($activeLink.length > 0)
            {
                $opts.css('background-color', $activeLink.css('background-color'))
                $activeLink.closest('li').addClass('active');
            }
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

    datasetPageNS.$moreViewsTab = $('#sidebarOptions a.moreViews');
    if (datasetPageNS.$moreViewsTab.is(':visible'))
    {
        // Wait until other requests have been fired first
        _.defer(function ()
        {
            blist.dataset.getRelatedViewCount(function(viewCount)
            {
                datasetPageNS.$moreViewsTab
                    .contentIndicator({text: viewCount || ''});
            });
        });
    }
    datasetPageNS.$feedTab = $('#sidebarOptions a.feed');
    if (datasetPageNS.$feedTab.is(':visible'))
    {
        datasetPageNS.$feedTab
            .contentIndicator({text: blist.dataset.numberOfComments || ''});
    }

    // Show guided filter by default
    datasetPageNS.sidebar.setDefault('filter.guidedFilter');

    blist.dataset.bind('columns_changed',
        function() { datasetPageNS.sidebar.updateEnabledSubPanes(); });

    // toolbar area
    $('#description').expander({
        contentSelector: 'p',
        expanderCollapsedClass: 'rightArrow',
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
        }, !blist.dataset.isPublic() && !blist.dataset.hasRight('grant'));

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
    blist.dataset.bind('set_temporary', datasetPageNS.setTempView);
    blist.dataset.bind('clear_temporary', datasetPageNS.clearTempView);

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

    blist.dataset.bind('valid', function() { datasetPageNS.updateValidView(); });

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

    // up up down down left right left right b a start
    var konami = new Konami();
    konami.code = function()
    {
        var elem = document.createElement('script');
        elem.type = 'text/javascript';
        document.body.appendChild(elem);
        elem.src = '/javascripts/util/asteroids.min.js';
    };
    konami.load();

    // Data calls
    _.defer(function()
    {
        // register opening
        blist.dataset.registerOpening(document.referrer);


        // set up the main menu
        if (!_.include(['blist', 'blob', 'href'], blist.dataset.type))
        {
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
        }

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('dataset page (v4-chrome)',
            'page loaded', blist.dataset.id);
    });
});

var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

blist.datasetPage.adjustSize = function()
{
    $('.outerContainer').fullScreen().adjustSize();
};

blist.datasetPage.clearTempView = function()
{
    $('#sidebarOptions a.alert').removeClass('alert');
    $('body, #datasetBar').removeClass('unsavedView minorChange');
    datasetPageNS.sidebar.updateEnabledSubPanes();

    // If pill buttons don't match ADT, then hide them
    $('#renderTypeOptions li a:visible').each(function()
    {
        var $a = $(this);
        var type = $.urlParam($a.attr('href'), 'defaultRender');
        if (type == 'richList') { type = 'fatrow'; }
        if (!_.include(blist.dataset.metadata.availableDisplayTypes, type))
        { $a.addClass('hide'); }
    });
};

blist.datasetPage.setTempView = function()
{
    if (blist.dataset.minorChange && !blist.dataset.hasRight('update_view'))
    { return; }

    $('body, #datasetBar').addClass('unsavedView')
        .toggleClass('minorChange', blist.dataset.minorChange);
    // For now unsaved view means something has changed in filter tab
    $('#sidebarOptions .tabFilter a').addClass('alert');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.updateValidView = function()
{
    $('.invalidView').removeClass('invalidView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
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

    // Set up pill buttons to change render types
    if ($('#renderTypeOptions').length > 0)
    {
        // Render types
        $('#renderTypeOptions').pillButtons();
        $.live('#renderTypeOptions a', 'click', function(e)
        {
            e.preventDefault();
            var rt = $.urlParam($(this).attr('href'), 'defaultRender') ||
                blist.dataset.displayType || 'table';
            if (rt == 'richList') { rt = 'fatrow'; }
            // Would call show on renderTypeManager; but updating the
            // dataset fires an event that RTM listens to
            blist.dataset.update({displayType: rt}, false, true);
        });
    }

    var prevType;
    if ($('#renderTypeOptions').length > 0)
    {
        blist.$container.bind('render_type_changed', function(e, newType)
        {
            // Special case for hiding button in page RT
            if (prevType == 'page') { $fullViewButton.addClass('hide'); }

            $('body').removeClass(prevType + '-renderType')
                .addClass(newType + '-renderType');
            prevType = newType;

            $('#renderTypeOptions li a').removeClass('active');
            var $pb = $('#renderTypeOptions li .' + newType);
            if ($pb.length < 1)
            {
                var $li = $('#renderTypeOptions li .template').parent().clone();
                $pb = $li.find('a').removeClass('template hide').addClass(newType);
                $pb.attr('title', $pb.attr('title').replace('template', newType));
                $pb.attr('href', $.urlParam($pb.attr('href'),
                    'defaultRender', newType));
                $('#renderTypeOptions').prepend($li);
            }
            $pb.addClass('active').removeClass('hide');
        });
    }

    // Initialize all data rendering
    var defRen = $.urlParam(window.location.href, 'defaultRender');
    if (defRen == 'richList') { defRen = 'fatrow'; }
    if (!$.isBlank(blist.initialRowId)) { defRen = 'page'; }

    datasetPageNS.rtManager = blist.$container.renderTypeManager({
        view: blist.dataset,
        defaultType: defRen,
        editEnabled: true,
        table: {
            addColumnCallback: function(parId)
            {
                datasetPageNS.sidebar.show('edit.addColumn', {parentId: parId});
            },
            editColumnCallback: function(colId, parId)
            {
                var col = blist.dataset.columnForID(colId) ||
                    blist.dataset.columnForID(parId);
                if (col.id != colId) { col = col.childColumnForID(colId); }

                datasetPageNS.sidebar.hide();
                datasetPageNS.sidebar.show('columnProperties', col);
            },
            showRowHandle: true,
            manualResize: true
        },
        page: { defaultRowId: blist.initialRowId }
    });

    var $dataGrid = datasetPageNS.rtManager.$domForType('table');


    // Page render type
    var pagePriorType = 'table';
    var $fullViewButton = $('#pageRenderType > .fullView').click(function(e)
    {
        e.preventDefault();
        blist.dataset.update({displayType: pagePriorType}, false, true);
    });

    $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId)
    {
        pagePriorType = datasetPageNS.rtManager.currentType;
        $fullViewButton.removeClass('hide');
        datasetPageNS.rtManager.setTypeConfig('page', {defaultRowId: rowId});
        blist.dataset.update({displayType: 'page'}, false, true);
    });

    // sidebar and sidebar tabs
    datasetPageNS.sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: $dataGrid[0],
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

    // Show guided filter by default if there is a default filter
    var hasConditions = function(filterCondition)
    {
        return (filterCondition.children || []).length > 0;
    };
    if (($.subKeyDefined(blist.dataset, 'query.filterCondition') &&
             hasConditions(blist.dataset.query.filterCondition)) ||
        ($.subKeyDefined(blist.dataset, 'metadata.filterCondition') &&
             hasConditions(blist.dataset.metadata.filterCondition)))
    {
        datasetPageNS.sidebar.setDefault('filter.unifiedFilter');
    }

    var sidebarUpdate = function()
        { datasetPageNS.sidebar.updateEnabledSubPanes(); };
    blist.dataset
        .bind('columns_changed', sidebarUpdate)
        .bind('displaytype_change', sidebarUpdate);

    // Hook up search form
    var $clearSearch = $('#searchForm .clearSearch');
    var $searchForm = $('#searchForm');

    $searchForm.submit(function (e)
    {
        e.preventDefault();
        var searchText = $(e.currentTarget).find(':input').val();
        blist.dataset.update({searchString: searchText});
        if (!searchText || searchText === '')
        { $clearSearch.hide(); }
        else
        { $clearSearch.show(); }
    });

    var clearSearchForm = function()
    {
        $searchForm.find(':input').val('').blur();
        $clearSearch.hide();
    };

    $clearSearch.click(function (e)
    {
        e.preventDefault();
        clearSearchForm();
        blist.dataset.update({searchString: null});
    }).hide();
    blist.dataset.bind('clear_temporary', function() { clearSearchForm(); });

    if (!$.isBlank(blist.dataset.searchString))
    {
        $searchForm.find(':input').focus().val(blist.dataset.searchString).blur();
        $clearSearch.show();
    }

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

    $('#shareOptions .email').click(function(event)
    {
        event.preventDefault();
        if(_.isFunction(blist.dialog.sharing))
        { blist.dialog.sharing(event); }
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

    $('.viewError').text(blist.dataset.invalidMessage());

    var viewEditPane = $.gridSidebar
        .paneForDisplayType[blist.dataset.metadata.availableDisplayTypes[0]] ||
        $.gridSidebar.paneForDisplayType[blist.dataset.type];
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

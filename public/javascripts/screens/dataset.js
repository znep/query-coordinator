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
    $('#titleBox').removeClass('unsavedView');
};

blist.datasetPage.setTempView = function()
{
    $('#titleBox').addClass('unsavedView');
    // For now unsaved view means something has changed in filter tab
    $('#sidebarOptions .tabFilter a').addClass('alert');
};

$(function()
{
    $('.outerContainer').fullScreen();

    // grid
    var $dataGrid = $('#mainGrid');
    if ($dataGrid.length > 0)
    {
        if (blist.display.isGrid)
        {
            $dataGrid
                .datasetGrid({viewId: blist.display.viewId,
                    columnDeleteEnabled: blist.isOwner,
                    columnPropertiesEnabled: blist.isOwner,
                    columnNameEdit: blist.isOwner,
                    showAddColumns: blist.isOwner && blist.display.type == 'blist',
                    currentUserId: blist.currentUserId,
                    accessType: 'WEBSITE', manualResize: true, showRowHandle: true,
                    clearTempViewCallback: datasetPageNS.clearTempView,
                    setTempViewCallback: datasetPageNS.setTempView,
                    filterForm: '#searchButton .searchForm',
                    clearFilterItem: '#searchButton .clearSearch'
//                    isInvalid: blist.display.isInvalid,
//                    validViewCallback: blistGridNS.updateValidView
                });
        }
        else if (blist.display.invokeVisualization)
        { $dataGrid.visualization(); }
    }

    // Placeholder config for tabs that haven't been implemented yet
    $.gridSidebar.registerConfig({name: 'feed.foo', title: 'Placeholder',
        subtitle: 'Placeholder'});
    $.gridSidebar.registerConfig({name: 'about.foo', title: 'Placeholder',
        subtitle: 'Placeholder'});

    // sidebar and sidebar tabs
    var sidebar = $('#gridSidebar').gridSidebar({
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
        if (sidebar.hasPane($a.attr('data-paneName')))
        {
            $a.click(function(e)
            {
                e.preventDefault();
                sidebar.show($a.attr('data-paneName'));
            });
        }
        else
        { $a.closest('li').hide(); }
    });

    $(document).bind(blist.events.COLUMNS_CHANGED,
        function() { sidebar.updateEnabledSubPanes(); });

    // toolbar area
    $('#viewsMenu').menu({
        menuButtonContents: '',
        menuButtonTitle: 'More Views',
        contents: [
            { text: 'Parent Dataset', className: 'typeBlist', href: '#parent',
              onlyIf: blist.dataset.getDisplayType(blist.display.view) != 'Blist' },
            { divider: true },
            { text: 'Saved Filters', className: 'typeFilter', href: '#savedFilters' },
            { text: 'Saved Visualizations', className: 'typeVisualization', href: '#savedVisualizations' },
            { divider: true },
            { text: 'About This Dataset', className: 'about', href: '#about' }
        ]
    });

    $('#viewsMenu .typeFilter').click(function(e)
    {
        e.preventDefault();
        $('#gridSidebar').gridSidebar().show('filter.savedFilters');
    });
    $('#viewsMenu .typeVisualization').click(function(e)
    {
        e.preventDefault();
        $('#gridSidebar').gridSidebar().show('visualize.savedVisualizations');
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
        { menuButtonContents: $.tag({ tagName: 'span', 'class': 'shareIcon' }, true)});

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

    // Unsaved view stuff
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
            data: JSON.stringify(blist.display.view),
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
        $('.saveViewDialog').jqmShow();
    });

    var saveView = function()
    {
        var name = $('.saveViewDialog .viewName').val();
        if ($.isBlank(name))
        {
            $('.saveViewDialog .mainError').text('A view name is required');
            return;
        }

        $('.saveViewDialog .mainError').text('');

        var doSave = function()
        {
            $('.saveViewDialog').find('.loadingOverlay, .loadingSpinner')
                .removeClass('hide');
            $.ajax({url: '/views.json', type: 'POST', dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify($.extend({},
                    blist.display.view, {name: name})),
                error: function(xhr)
                {
                    $('.saveViewDialog').find('.loadingOverlay, .loadingSpinner')
                        .addClass('hide');
                    $('.saveViewDialog .mainError')
                        .text(JSON.parse(xhr.responseText).message);
                },
                success: function(view)
                {
                    $('.saveViewDialog').jqmHide();
                    blist.util.navigation.redirectToView(view.id);
                }});
        };

        if (!$.isBlank(blist.util.inlineLogin))
        {
            var msg = 'You must be logged in to save a view';
            blist.util.inlineLogin.verifyUser(
                function(isSuccess)
                {
                    if (isSuccess) { doSave(); }
                    else { $('.saveViewDialog .mainError').text(msg); }
                }, msg);
        }
        else
        { doSave(); }
    };

    $('.saveViewDialog form').submit(function(e)
    {
        e.preventDefault();
        saveView();
    });

    $('.saveViewDialog a.save').click(function(e)
    {
        e.preventDefault();
        saveView();
    });

    // fetch some data that we'll need
    $.Tache.Get({ url: '/views.json',
        data: { method: 'getByTableId', tableId: blist.display.view.tableId },
        dataType: 'json', contentType: 'application/json',
        success: function(views)
        {
            $('#viewsMenu .typeBlist a').attr('href', $.generateViewUrl(
                _.detect(views, function(view) { return blist.dataset.getDisplayType(view) == 'Blist'; })));
        }});
});

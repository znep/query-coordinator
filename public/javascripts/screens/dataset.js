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
//                .bind('full_load',
//                    function(){ $('#lensContainer .headerBar').removeClass('hide'); })
                .datasetGrid({viewId: blist.display.viewId,
                    columnDeleteEnabled: blist.isOwner,
                    columnPropertiesEnabled: blist.isOwner,
                    columnNameEdit: blist.isOwner,
                    showAddColumns: blist.isOwner && blist.display.type == 'blist',
                    currentUserId: blist.currentUserId,
                    accessType: 'WEBSITE', manualResize: true, showRowHandle: true
//                    clearTempViewCallback: blistGridNS.clearTempViewTab,
//                    setTempViewCallback: blistGridNS.setTempViewTab,
//                    updateTempViewCallback: blistGridNS.updateTempViewTab,
//                    filterForm: '#lensContainer .headerBar form',
//                    autoHideClearFilterItem: false,
//                    isInvalid: blist.display.isInvalid,
//                    validViewCallback: blistGridNS.updateValidView
                });
        }
        else if (blist.display.invokeVisualization)
        { $dataGrid.visualization(); }
    }

    // Placeholder config for tabs that haven't been implemented yet
    $.gridSidebar.registerConfig({name: 'filter.foo', title: 'Placeholder',
        subtitle: 'Placeholder'});
    $.gridSidebar.registerConfig({name: 'export.foo', title: 'Placeholder',
        subtitle: 'Placeholder'});
    $.gridSidebar.registerConfig({name: 'feed.foo', title: 'Placeholder',
        subtitle: 'Placeholder'});
    $.gridSidebar.registerConfig({name: 'about.foo', title: 'Placeholder',
        subtitle: 'Placeholder'});

    // sidebar and sidebar tabs
    var sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: $dataGrid[0],
        onSidebarClosed: function()
        {
            $('#sidebarOptions li').removeClass('active');
        }
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
                $a.closest('li')
                    .addClass('active')
                    .siblings()
                        .removeClass('active');
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

    $('.descriptionExpander').click(function(event)
    {
        event.preventDefault();
        var $this = $(this);
        var $description = $('#description');

        if ($this.hasClass('downArrow'))
        {
            // need to expand; measure how tall
            $description
                .removeClass('collapsed')
                .css('height', null);
            var targetHeight = $description.height();
            $description
                .addClass('collapsed')
                .animate({
                    height: targetHeight
                },
                function() { $('.outerContainer').fullScreen().adjustSize(); });
            $this.removeClass('downArrow').addClass('upArrow');
        }
        else
        {
            // need to collapse
            $description
                .animate({
                    height: $description.css('line-height')
                },
                function() { $('.outerContainer').fullScreen().adjustSize(); });
            $this.removeClass('upArrow').addClass('downArrow');
        }
    });

    var $dsIcon = $('#datasetIcon');
    $dsIcon.socrataTip($dsIcon.text());

    blist.dataset.controls.hookUpShareMenu(blist.display.view,
        $('#shareMenu'),
        { menuButtonContents: $.tag({ tagName: 'span', 'class': 'shareIcon' }, true)});

    // fetch some data that we'll need
    $.ajax({ url: '/views.json',
        data: { method: 'getByTableId', tableId: blist.display.view.tableId },
        dataType: 'json', contentType: 'application/json',
        success: function(views)
        {
            // TODO: make views reusable for the views sidebar
            $('#viewsMenu .typeBlist a').attr('href', $.generateViewUrl(
                _.detect(views, function(view) { return blist.dataset.getDisplayType(view) == 'Blist'; })));
        }});
});

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

    /* TODO: do we want this?
    var $desc = $('#description');
    $desc.socrataTip($desc.text());*/

    blist.dataset.controls.hookUpShareMenu(blist.display.view,
        $('#shareMenu'),
        { menuButtonContents: $.tag({ tagName: 'span', 'class': 'shareIcon' }, true)});

    $.ajax({url: '/views.json',
        data: {method: 'getByTableId', tableId: blist.display.view.tableId},
        dataType: 'json', contentType: 'application/json',
        success: function(views)
        {
            views = _.reject(views, function(v)
                { return v.flags && _.include(v.flags, 'default') ||
                    v.id == blist.display.view.id; });
            views = _.sortBy(views, function(v) { return v.name.toLowerCase(); });
            var items = _.map(views, function(v)
            {
                return {text: v.name,
                    className: 'type' + blist.dataset.getDisplayType(v),
                    href: $.generateViewUrl(v)};
            });
            $('#viewsMenu').menu({
                attached: false,
                menuButtonContents: '',
                menuButtonTitle: 'More Views',
                contents: items
            });
        }});
});

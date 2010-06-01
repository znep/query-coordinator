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

    var sidebar = $('#gridSidebar').gridSidebar({dataGrid: $dataGrid[0]});
    $('#sidebarOptions a[data-paneName]').each(function()
    {
        var $a = $(this);
        if (sidebar.hasPane($a.attr('data-paneName')))
        {
            $a.click(function(e)
            {
                e.preventDefault();
                sidebar.show($(this).attr('data-paneName'));
            });
        }
        else
        { $a.hide(); }
    });

    $(document).bind(blist.events.COLUMNS_CHANGED,
        function() { sidebar.updateEnabledSubPanes(); });

    var $dsIcon = $('#datasetIcon');
    $dsIcon.socrataTip($dsIcon.text());

    var $desc = $('#description');
    $desc.socrataTip($desc.text());

    blist.dataset.controls.hookUpShareMenu(blist.display.view,
        $('#shareMenu'));

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
                menuButtonTitle: 'More Views',
                contents: items
            });
        }});
});

$(function()
{
    $('.outerContainer').fullScreen();

    // grid
    var $dataGrid = $('#mainGrid');
    if ($dataGrid.length > 0)
    {
        if (blist.display.isGrid)
        {
            var isOwner = blist.currentUserId == blist.display.viewOwner;
            $dataGrid
//                .bind('full_load',
//                    function(){ $('#lensContainer .headerBar').removeClass('hide'); })
                .datasetGrid({viewId: blist.display.viewId,
                    columnDeleteEnabled: isOwner,
                    columnPropertiesEnabled: isOwner,
                    columnNameEdit: isOwner,
                    showAddColumns: isOwner && blist.display.type == 'blist',
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

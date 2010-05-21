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
});

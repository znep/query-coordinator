$(function()
{
    $('.outerContainer').fullScreen();

    // grid
    if (blist.$display.length > 0 && blist.dataset.isGrid())
    {
        blist.$display
            .datasetGrid({view: blist.dataset,
                columnDeleteEnabled: false,
                columnPropertiesEnabled: false,
                columnNameEdit: false,
                showAddColumns: false,
                manualResize: false, showRowHandle: false
            });
    }
});

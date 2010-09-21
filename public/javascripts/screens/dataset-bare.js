var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

blist.datasetPage.adjustSize = function()
{
    $('.outerContainer').fullScreen().adjustSize();
};

blist.datasetPage.initGrid = function()
{
    if (datasetPageNS.gridInitialized || !blist.dataset.isGrid()) { return; }

    blist.$display
        .datasetGrid({view: blist.dataset,
            columnDeleteEnabled: false,
            columnPropertiesEnabled: false,
            columnNameEdit: false,
            showAddColumns: false,
            accessType: 'WEBSITE', manualResize: false, showRowHandle: false,
            clearTempViewCallback: function(){},
            setTempViewCallback: function(){},
            filterForm: '#searchForm', clearFilterItem: '#searchForm .clearSearch',
            isInvalid: false,
            validViewCallback: function(){},
            addColumnCallback: function(){},
            editColumnCallback: function(){}
        });
    datasetPageNS.gridInitialized = true;
};


$(function()
{
    $('.outerContainer').fullScreen();

    // grid
    datasetPageNS.$dataGrid = blist.$display;
    if (datasetPageNS.$dataGrid.length > 0)
    {
        datasetPageNS.initGrid();
    }
    // TODO: Adjust size: datasetPageNS.adjustSize()

});

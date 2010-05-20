var statsNS = blist.namespace.fetch("blist.stats");

blist.stats.columns = [[
    {cls: "sparkline", width: 27, dataIndex: "sparkline", type: 'text', name: "", sortable: false},
    {cls: "url", width: 360, dataIndex: "url", type: 'url', name: "URL"},
    {cls: "views", width: 55, dataIndex: "views", type: 'number', name: "Visits"}
]];

blist.stats.options = {
    simpleCellExpand: true,
    cellExpandEnabled: false,
    disableLastColumnResize: true,
    generateHeights: false,
    manualResize: false,
    showRowNumbers: false
};

blist.stats.initializeGrid = function ()
{
    statsNS.model = $("#url-grid")
        .blistTable(statsNS.options)
        .blistModel();

    statsNS.model.meta({view: {}, columns: statsNS.columns});
    statsNS.model.sort(2, true); /* number of visits column */
    statsNS.model.rows(statsNS.urlData);
};

$(function() {
    statsNS.initializeGrid();
});

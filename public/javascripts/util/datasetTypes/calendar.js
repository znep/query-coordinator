blist.namespace.fetch('blist.datasetUtil.calendar');

blist.datasetUtil.calendar.isValid = function(view)
{
    view = blist.datasetUtil.calendar.convertLegacy($.extend(true, {}, view));
    var startCol = blist.datasetUtil.columnForTCID(view,
        view.displayFormat.startDateTableId);
    var titleCol = blist.datasetUtil.columnForTCID(view,
        view.displayFormat.titleTableId);

    return !$.isBlank(startCol) && !$.isBlank(titleCol);
};

blist.datasetUtil.calendar.convertLegacy = function(view)
{
    view.displayFormat = view.displayFormat || {};

    _.each(['startDate', 'endDate', 'title', 'description'], function(n)
    {
        if ($.isBlank(view.displayFormat[n + 'TableId']) &&
            !$.isBlank(view.displayFormat[n + 'Id']))
        {
            var c = _.detect(view.columns,
                function(c) { return c.id == view.displayFormat[n + 'Id']; });
            if (!$.isBlank(c))
            { view.displayFormat[n + 'TableId'] = c.tableColumnId; }
        }
    });

    return view;
};

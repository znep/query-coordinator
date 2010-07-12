blist.namespace.fetch('blist.dataset.calendar');

blist.dataset.calendar.isValid = function(view)
{
    view = blist.dataset.calendar.convertLegacy($.extend(true, {}, view));
    var startCol = blist.dataset.columnForTCID(view,
        view.displayFormat.startDateTableId);
    var titleCol = blist.dataset.columnForTCID(view,
        view.displayFormat.titleTableId);

    return !$.isBlank(startCol) && !$.isBlank(titleCol);
};

blist.dataset.calendar.convertLegacy = function(view)
{
    view.displayFormat = view.displayFormat || {};

    _.each(['startDate', 'endDate', 'title', 'description'], function(n)
    {
        if ($.isBlank(view.displayFormat[n + 'TableId']) &&
            !$.isBlank(view.displayFormat[n + 'Id']))
        {
            view.displayFormat[n + 'TableId'] = _.detect(view.columns,
                function(c) { return c.id == view.displayFormat[n + 'Id']; })
                .tableColumnId;
        }
    });

    return view;
};

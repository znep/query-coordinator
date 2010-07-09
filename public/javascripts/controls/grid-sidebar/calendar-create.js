(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.calendarCreate) { return; }

    var isEdit = blist.dataset.getDisplayType(blist.display.view) == 'Calendar';

    var configName = 'visualize.calendarCreate';
    var config =
    {
        name: configName,
        priority: 5,
        title: 'Calendar',
        subtitle: 'Views with dates can be displayed in a monthly calendar format',
        onlyIf: function(view)
        {
            var dateCols = _.select(view.columns, function(c)
                {
                    return _.include(['date', 'calendar_date'], c.dataTypeName) &&
                        (isEdit || ($.isBlank(c.flags) ||
                            !_.include(c.flags, 'hidden')));
                });
            var textCols = _.select(view.columns, function(c)
                {
                    return c.dataTypeName == 'text' && (isEdit ||
                        ($.isBlank(c.flags) || !_.include(c.flags, 'hidden')));
                });
            return dateCols.length > 0 && textCols.length > 0;
        },
        disabledSubtitle: 'This view must have a date column and a text column',
        sections: [
            {
                title: 'Calendar Name',
                fields: [
                    {text: 'Name', name: 'name', type: 'text', required: true,
                        prompt: 'Enter a name',
                        wizard: 'Enter a name for your calendar'
                    }
                ]
            },
            {
                title: 'Dates',
                fields: [
                    {text: 'Starting Date', name: 'displayFormat.startDateTableId',
                        type: 'columnSelect', required: true, notequalto: 'dateCol',
                        isTableColumn: true,
                        columns: {type: ['calendar_date', 'date'], hidden: isEdit},
                        wizard: 'Select the column with the initial date of events'
                    },
                    {text: 'Ending Date', name: 'displayFormat.endDateTableId',
                        type: 'columnSelect', notequalto: 'dateCol',
                        isTableColumn: true,
                        columns: {type: ['calendar_date', 'date'], hidden: isEdit},
                        wizard: 'Select the column with the ending date of events'
                    }
                ]
            },
            {
                title: 'Event Information',
                fields: [
                    {text: 'Event Title', name: 'displayFormat.titleTableId',
                        type: 'columnSelect', required: true, isTableColumn: true,
                        columns: {type: 'text', hidden: isEdit},
                        wizard: 'Select the column with the primary ' +
                            'text that should display in each event'
                    },
                    {text: 'Description', name: 'displayFormat.descriptionTableId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: 'text', hidden: isEdit},
                        wizard: 'Select the column with the ' +
                            'descriptive text that will appear on mousing ' +
                            'over the event'
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [isEdit ? $.gridSidebar.buttons.update :
                $.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' calendar'
        }
    };

    config.dataSource = function()
    {
        if (!isEdit) { return null; }

        var view = $.extend(true, {}, blist.display.view);
        view.displayFormat = view.displayFormat || {};

        if ($.isBlank(view.displayFormat.startDateTableId) &&
            !$.isBlank(view.displayFormat.startDateId))
        {
            view.displayFormat.startDateTableId = _.detect(view.columns,
                function(c) { return c.id == view.displayFormat.startDateId; })
                .tableColumnId;
        }

        if ($.isBlank(view.displayFormat.endDateTableId) &&
            !$.isBlank(view.displayFormat.endDateId))
        {
            view.displayFormat.endDateTableId = _.detect(view.columns,
                function(c) { return c.id == view.displayFormat.endDateId; })
                .tableColumnId;
        }

        if ($.isBlank(view.displayFormat.titleTableId) &&
            !$.isBlank(view.displayFormat.titleId))
        {
            view.displayFormat.titleTableId = _.detect(view.columns,
                function(c) { return c.id == view.displayFormat.titleId; })
                .tableColumnId;
        }

        if ($.isBlank(view.displayFormat.descriptionTableId) &&
            !$.isBlank(view.displayFormat.descriptionId))
        {
            view.displayFormat.descriptionTableId = _.detect(view.columns,
                function(c) { return c.id == view.displayFormat.descriptionId; })
                .tableColumnId;
        }

        return view;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'calendar';

        $.extend(view, sidebarObj.getFormValues($pane));

        var url = '/views' + (isEdit ? '/' + blist.display.view.id : '') + '.json';
        $.ajax({url: url, type: isEdit ? 'PUT' : 'POST', dataType: 'json',
            data: JSON.stringify(view), contentType: 'application/json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.finishProcessing();
                if (!isEdit)
                { blist.util.navigation.redirectToView(resp.id); }
                else
                {
                    $.syncObjects(blist.display.view, resp);

                    $('.currentViewName').text(blist.display.view.name);

                    var finishUpdate = function()
                    {
                        sidebarObj.$grid().blistCalendar()
                            .reload(blist.display.view.displayFormat);

                        sidebarObj.$dom().socrataAlert(
                            {message: 'Your calendar has been updated',
                                overlay: true});

                        sidebarObj.hide();
                        sidebarObj.addPane(configName);
                    };

                    var p = blist.display.view.displayFormat;
                    _.each(_.compact([p.startDateTableId, p.endDateTableId,
                        p.titleTableId, p.descriptionTableId]),
                    function(tId)
                    {
                        var col = _.detect(blist.display.view.columns, function(c)
                            { return c.tableColumnId == tId; });
                        if (_.include(col.flags || [], 'hidden'))
                        {
                            $.socrataServer.addRequest({url: '/views/' +
                                blist.display.view.id + '/columns/' + col.id +
                                '.json', type: 'PUT',
                                data: JSON.stringify({hidden: false})});
                        }
                    });
                    if (!$.socrataServer.runRequests({success: finishUpdate}))
                    { finishUpdate(); }
                }
            }});
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);

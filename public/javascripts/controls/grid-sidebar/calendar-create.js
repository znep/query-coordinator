(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.calendarCreate) { return; }

    var config =
    {
        name: 'visualize.calendarCreate',
        title: 'Calendar',
        subtitle: 'Views with dates can be displayed in a monthly calendar format',
        onlyIf: function(view)
        {
            var dateCols = _.select(view.columns, function(c)
                {
                    return _.include(['date', 'calendar_date'], c.dataTypeName) &&
                        ($.isBlank(c.flags) || !_.include(c.flags, 'hidden'));
                });
            var textCols = _.select(view.columns, function(c)
                {
                    return c.dataTypeName == 'text' &&
                        ($.isBlank(c.flags) || !_.include(c.flags, 'hidden'));
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
                        wizard: {prompt: 'Enter a name for your calendar'}
                    }
                ]
            },
            {
                title: 'Dates',
                fields: [
                    {text: 'Starting Date', name: 'displayFormat.startDateTableId',
                        type: 'columnSelect', required: true, notequalto: 'dateCol',
                        isTableColumn: true,
                        columns: {type: ['calendar_date', 'date'], hidden: false},
                        wizard: {prompt: 'Select the column with the initial date of events'}
                    },
                    {text: 'Ending Date', name: 'displayFormat.endDateTableId',
                        type: 'columnSelect', notequalto: 'dateCol',
                        isTableColumn: true,
                        columns: {type: ['calendar_date', 'date'], hidden: false},
                        wizard: {prompt: 'Select the column with the ending date of events'}
                    }
                ]
            },
            {
                title: 'Event Information',
                fields: [
                    {text: 'Event Title', name: 'displayFormat.titleTableId',
                        type: 'columnSelect', required: true, isTableColumn: true,
                        columns: {type: 'text', hidden: false},
                        wizard: {prompt: 'Select the column with the primary text that should display in each event'}
                    },
                    {text: 'Description', name: 'displayFormat.descriptionTableId',
                        type: 'columnSelect', isTableColumn: true,
                        columns: {type: 'text', hidden: false},
                        wizard: {prompt: 'Select the column with the descriptive text that will appear on mousing over the event'}
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.create, $.gridSidebar.buttons.cancel],
            wizard: {prompt: "Now you're ready to create a new calendar"}
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var model = sidebarObj.$grid().blistModel();
        var view = blist.dataset.baseViewCopy(blist.display.view);
        view.displayType = 'calendar';

        $.extend(view, sidebarObj.getFormValues($pane));

        $.ajax({url: '/views.json', type: 'POST', data: JSON.stringify(view),
            dataType: 'json', contentType: 'application/json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.finishProcessing();
                blist.util.navigation.redirectToView(resp.id);
            }});
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);

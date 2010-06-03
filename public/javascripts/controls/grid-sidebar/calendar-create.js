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
                    return c.dataTypeName == 'date' &&
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
                    {text: 'Name', name: 'calName', type: 'text', required: true,
                        prompt: 'Enter a name',
                        wizard: {prompt: 'Enter a name for your form',
                            actions: [$.gridSidebar.wizard.buttons.done]}
                    }
                ]
            },
            {
                title: 'Dates',
                fields: [
                    {text: 'Starting Date', name: 'startCol', type: 'columnSelect',
                        required: true, notequalto: 'dateCol',
                        columns: {type: 'date', hidden: false},
                        wizard: {prompt: 'Select the column with the initial date of events'}
                    },
                    {text: 'Ending Date', name: 'endCol', type: 'columnSelect',
                        notequalto: 'dateCol',
                        columns: {type: 'date', hidden: false},
                        wizard: {prompt: 'Select the column with the ending date of events',
                            actions: [$.gridSidebar.wizard.buttons.skip]}
                    }
                ]
            },
            {
                title: 'Event Information',
                fields: [
                    {text: 'Event Title', name: 'eventTitle', type: 'columnSelect',
                        required: true, columns: {type: 'text', hidden: false},
                        wizard: {prompt: 'Select the column with the primary text that should display in each event'}
                    },
                    {text: 'Description', name: 'descCol', type: 'columnSelect',
                        columns: {type: 'text', hidden: false},
                        wizard: {prompt: 'Select the column with the descriptive text that will appear on mousing over the event',
                            actions: [$.gridSidebar.wizard.buttons.skip]}
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
        view.displayFormat = {};

        view.name = $pane.find('#calName:not(.prompt)').val();

        view.displayFormat.startDateTableId =
            model.columnIdToTableId($pane.find('#startCol').val());
        var endCol = $pane.find('#endCol').val();
        if (!$.isBlank(endCol))
        { view.displayFormat.endDateTableId = model.columnIdToTableId(endCol); }

        view.displayFormat.titleTableId =
            model.columnIdToTableId($pane.find('#eventTitle').val());
        var descCol = $pane.find('#descCol').val();
        if (!$.isBlank(descCol))
        {
            view.displayFormat.descriptionTableId =
                model.columnIdToTableId(descCol);
        }

        $.ajax({url: '/views.json', type: 'POST', data: JSON.stringify(view),
            dataType: 'json', contentType: 'application/json',
            error: function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); },
            success: function(resp)
            {
                sidebarObj.resetFinish();
                blist.util.navigation.redirectToView(resp.id);
            }});
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);

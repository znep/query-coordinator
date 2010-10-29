(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.calendarCreate) { return; }

    var isEdit = blist.dataset.type == 'calendar';

    var configName = 'visualize.calendarCreate';
    var config =
    {
        name: configName,
        priority: 5,
        title: 'Calendar',
        subtitle: 'Views with dates can be displayed in a monthly calendar format',
        onlyIf: function()
        {
            var dateCols = _.select(blist.dataset.realColumns, function(c)
                {
                    return _.include(['date', 'calendar_date'], c.dataTypeName) &&
                        (isEdit || !c.hidden);
                });
            var textCols = _.select(blist.dataset.realColumns, function(c)
                {
                    return c.dataTypeName == 'text' && (isEdit || !c.hidden);
                });
            return dateCols.length > 0 && textCols.length > 0 &&
                (blist.dataset.valid || isEdit);
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid && !isEdit ? 'This view must be valid' :
                'This view must have a date column and a text column';
        },
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
        return isEdit ? blist.dataset : null;
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend({displayType: 'calendar'},
            sidebarObj.getFormValues($pane));
        blist.dataset.update(view);

        if (!isEdit)
        {
            blist.dataset.saveNew(function(newView)
            {
                sidebarObj.finishProcessing();
                newView.redirectTo();
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
        else
        {
            blist.dataset.save(function(newView)
            {
                sidebarObj.finishProcessing();

                $('.currentViewName').text(newView.name);

                var finishUpdate = function()
                {
                    sidebarObj.$dom().socrataAlert(
                        {message: 'Your calendar has been updated',
                            overlay: true});

                    sidebarObj.hide();
                    sidebarObj.addPane(configName);
                };

                var colIds = _.pluck(newView.realColumns, 'id');

                if (colIds.length > 0)
                { newView.setVisibleColumns(colIds, finishUpdate); }
                else { finishUpdate(); }
            },
            function(xhr) { sidebarObj.genericErrorHandler($pane, xhr); });
        }
    };

    $.gridSidebar.registerConfig(config, 'calendar');

})(jQuery);

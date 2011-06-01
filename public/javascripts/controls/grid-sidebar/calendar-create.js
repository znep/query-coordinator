(function($)
{
    if (blist.sidebarHidden.visualize &&
        blist.sidebarHidden.visualize.calendarCreate) { return; }

    var isEdit = _.include(blist.dataset.metadata.availableDisplayTypes, 'calendar');

    var sidebar;
    var configName = 'visualize.calendarCreate';
    var config =
    {
        name: configName,
        priority: 5,
        title: 'Calendar',
        subtitle: 'Views with dates can be displayed in a monthly calendar format',
        dataSource: blist.dataset,
        showCallback: function(sidebarObj) { sidebar = sidebarObj; },
        onlyIf: function()
        {
            var dateCols = _.select(blist.dataset.realColumns, function(c)
                {
                    return _.include(['date', 'calendar_date'], c.renderTypeName) &&
                        (isEdit || !c.hidden);
                });
            var textCols = _.select(blist.dataset.realColumns, function(c)
                {
                    return c.renderTypeName == 'text' && (isEdit || !c.hidden);
                });
            return dateCols.length > 0 && textCols.length > 0 &&
                (blist.dataset.valid || isEdit) &&
                (_.include(blist.dataset.metadata.availableDisplayTypes,
                    'calendar') || !blist.dataset.isAltView());
        },
        disabledSubtitle: function()
        {
            return (!blist.dataset.valid && !isEdit) ? 'This view must be valid' :
                ((!_.include(blist.dataset.metadata.availableDisplayTypes,
                    'calendar') && blist.dataset.isAltView()) ?
                'A view may only have one visualization on it' :
                'This view must have a date column and a text column');
        },
        sections: [
            {
                title: 'Dates',
                fields: [
                    {text: 'Starting Date', name: 'displayFormat.startDateTableId',
                        type: 'columnSelect', required: true, notequalto: 'dateCol',
                        isTableColumn: true,
                        columns: {type: ['calendar_date', 'date'], hidden: isEdit,
                            defaultNames: ['start date', 'start']},
                        wizard: 'Select the column with the initial date of events'
                    },
                    {text: 'Ending Date', name: 'displayFormat.endDateTableId',
                        type: 'columnSelect', notequalto: 'dateCol',
                        isTableColumn: true,
                        columns: {type: ['calendar_date', 'date'], hidden: isEdit,
                            defaultNames: ['end date', 'end']},
                        wizard: 'Select the column with the ending date of events'
                    }
                ]
            },
            {
                title: 'Event Information',
                fields: [
                    {text: 'Event Title', name: 'displayFormat.titleTableId',
                        type: 'columnSelect', required: true, isTableColumn: true,
                        columns: {type: 'text', hidden: isEdit,
                            defaultNames: ['title']},
                        wizard: 'Select the column with the primary ' +
                            'text that should display in each event'
                    },
                    {type: 'repeater', name: 'displayFormat.descriptionColumns',
                        field: {text: 'Details', name: 'tableColumnId',
                               type: 'columnSelect', isTableColumn: true,
                               columns: {hidden: isEdit}},
                        minimum: 1, addText: 'Add Details'
                    }
                ]
            }
        ],
        finishBlock: {
            buttons: [$.gridSidebar.buttons.apply, $.gridSidebar.buttons.cancel],
            wizard: "Now you're ready to " +
                (isEdit ? 'update your' : 'create a new') + ' calendar'
        }
    };

    config.finishCallback = function(sidebarObj, data, $pane, value)
    {
        if (!sidebarObj.baseFormHandler($pane, value)) { return; }

        var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {calendar: true}}}},
            sidebarObj.getFormValues($pane), {metadata: blist.dataset.metadata});
        blist.dataset.update(view);

        if (isEdit)
        {
            // We need to show all columns when editing a view so that
            // any filters/facets work properly
            var colIds = _.pluck(blist.dataset.realColumns, 'id');
            if (colIds.length > 0)
            { blist.dataset.setVisibleColumns(colIds, null, true); }
        }

        sidebarObj.finishProcessing();
        sidebarObj.refresh(configName);
    };

    blist.dataset.bind('clear_temporary', function()
        { if (!$.isBlank(sidebar)) { sidebar.refresh(configName); } });

    $.gridSidebar.registerConfig(config, 'calendar');

})(jQuery);

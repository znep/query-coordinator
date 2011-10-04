(function($)
{
    $.Control.extend('pane_calendarCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj.settings.view.bind('clear_temporary', function() { cpObj.reset(); });
        },

        getTitle: function()
        { return 'Calendar'; },

        getSubtitle: function()
        { return 'Views with dates can be displayed in a monthly calendar format'; },

        _getCurrentData: function()
        { return this._super() || this.settings.view; },

        isAvailable: function()
        {
            var cpObj = this;
            var dateCols = cpObj.settings.view.columnsForType(['date', 'calendar_date'], isEdit(cpObj));
            var textCols = cpObj.settings.view.columnsForType('text', isEdit(cpObj));

            return dateCols.length > 0 && textCols.length > 0 &&
                (cpObj.settings.view.valid || isEdit(cpObj)) &&
                (_.include(cpObj.settings.view.metadata.availableDisplayTypes, 'calendar') ||
                    !cpObj.settings.view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return (!this.settings.view.valid && !isEdit(this)) ? 'This view must be valid' :
                ((!_.include(this.settings.view.metadata.availableDisplayTypes, 'calendar') &&
                this.settings.view.isAltView()) ?
                'A view may only have one visualization on it' :
                'This view must have a date column and a text column');
        },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    title: 'Dates',
                    fields: [
                        {text: 'Starting Date', name: 'displayFormat.startDateTableId',
                            type: 'columnSelect', required: true, notequalto: 'dateCol',
                            isTableColumn: true,
                            columns: {type: ['calendar_date', 'date'], hidden: isEdit(cpObj),
                                defaultNames: ['start date', 'start']}
                        },
                        {text: 'Ending Date', name: 'displayFormat.endDateTableId',
                            type: 'columnSelect', notequalto: 'dateCol', isTableColumn: true,
                            columns: {type: ['calendar_date', 'date'], hidden: isEdit(cpObj),
                                defaultNames: ['end date', 'end']}
                        }
                    ]
                },
                {
                    title: 'Event Information',
                    fields: [
                        {text: 'Event Title', name: 'displayFormat.titleTableId',
                            type: 'columnSelect', required: true, isTableColumn: true,
                            columns: {type: 'text', hidden: isEdit(cpObj), defaultNames: ['title']}
                        },
                        {type: 'repeater', name: 'displayFormat.descriptionColumns',
                            field: {text: 'Details', name: 'tableColumnId',
                                   type: 'columnSelect', isTableColumn: true,
                                   columns: {hidden: isEdit(cpObj)}},
                            minimum: 1, addText: 'Add Details'
                        }
                    ]
                }
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {calendar: true}}}},
                cpObj._getFormValues(), {metadata: cpObj.settings.view.metadata});
            cpObj.settings.view.update(view);

            var didCallback = false;
            if (isEdit(cpObj))
            {
                // We need to show all columns when editing a view so that
                // any filters/facets work properly
                var colIds = _.pluck(cpObj.settings.view.realColumns, 'id');
                if (colIds.length > 0)
                {
                    cpObj.settings.view.setVisibleColumns(colIds, finalCallback, true);
                    didCallback = true;
                }
            }

            cpObj._finishProcessing();
            cpObj.reset();
            if (!didCallback && _.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'calendarCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj.settings.view.metadata.availableDisplayTypes, 'calendar'); };


    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.calendarCreate)
    { $.gridSidebar.registerConfig('visualize.calendarCreate', 'pane_calendarCreate', 5, 'calendar'); }

})(jQuery);

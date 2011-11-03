(function($)
{
    $.Control.extend('pane_calendarCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);
        },

        getTitle: function()
        { return 'Calendar'; },

        getSubtitle: function()
        { return 'Views with dates can be displayed in a monthly calendar format'; },

        _getCurrentData: function()
        { return this._super() || this._view; },

        isAvailable: function()
        {
            var cpObj = this;
            var dateCols = cpObj._view.columnsForType(['date', 'calendar_date'], isEdit(cpObj));

            return dateCols.length > 0 && (cpObj._view.valid || isEdit(cpObj)) &&
                (_.include(cpObj._view.metadata.availableDisplayTypes, 'calendar') ||
                    !cpObj._view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return (!this._view.valid && !isEdit(this)) ? 'This view must be valid' :
                ((!_.include(this._view.metadata.availableDisplayTypes, 'calendar') &&
                this._view.isAltView()) ?
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
                                noDefault: true, defaultNames: ['end date', 'end']}
                        }
                    ]
                },
                {
                    title: 'Event Information',
                    fields: [
                        {text: 'Event Title', name: 'displayFormat.titleTableId',
                            type: 'columnSelect', required: true, isTableColumn: true,
                            columns: {type: ['calendar_date', 'dataset_link', 'date', 'drop_down_list',
                                'email', 'flag', 'html', 'location',  'money', 'number', 'percent',
                                'phone', 'stars', 'text', 'url'], hidden: isEdit(cpObj),
                                defaultNames: ['title']}
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
                cpObj._getFormValues(), {metadata: cpObj._view.metadata});
            cpObj._view.update(view);

            var didCallback = false;
            if (isEdit(cpObj))
            {
                // We need to show all columns when editing a view so that
                // any filters/facets work properly
                var colIds = _.pluck(cpObj._view.realColumns, 'id');
                if (colIds.length > 0)
                {
                    cpObj._view.setVisibleColumns(colIds, finalCallback, true);
                    didCallback = true;
                }
            }

            cpObj._finishProcessing();
            cpObj.reset();
            if (!didCallback && _.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'calendarCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj._view.metadata.availableDisplayTypes, 'calendar'); };


    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.calendarCreate)
    { $.gridSidebar.registerConfig('visualize.calendarCreate', 'pane_calendarCreate', 5, 'calendar'); }

})(jQuery);

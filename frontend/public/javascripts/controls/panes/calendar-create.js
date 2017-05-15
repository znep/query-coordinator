(function($) {
  $.Control.extend('pane_calendarCreate', {
    _init: function() {
      var cpObj = this;
      cpObj._super.apply(cpObj, arguments);
      cpObj._view.bind('clear_temporary', function() {
        cpObj.reset();
      }, cpObj);
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.calendar.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.calendar.subtitle');
    },

    _getCurrentData: function() {
      return this._super() || this._view;
    },

    isAvailable: function() {
      var cpObj = this;
      var dateCols = cpObj._view.columnsForType(['date', 'calendar_date'], isEdit(cpObj));

      return dateCols.length > 0 && (cpObj._view.valid || isEdit(cpObj)) &&
        (_.include(cpObj._view.metadata.availableDisplayTypes, 'calendar') ||
          cpObj._view.shouldShowViewCreationOptions());
    },

    getDisabledSubtitle: function() {
      return (!this._view.valid && !isEdit(this)) ? $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
        ((!_.include(this._view.metadata.availableDisplayTypes, 'calendar') &&
            !this._view.shouldShowViewCreationOptions()) ?
          $.t('screens.ds.grid_sidebar.calendar.validation.viz_limit') :
          $.t('screens.ds.grid_sidebar.calendar.validation.invalid_columns'));
    },

    _getSections: function() {
      var cpObj = this;
      return [{
        title: $.t('screens.ds.grid_sidebar.calendar.dates.title'),
        fields: [{
          text: $.t('screens.ds.grid_sidebar.calendar.dates.start'),
          name: 'displayFormat.startDateTableId',
          type: 'columnSelect',
          required: true,
          notequalto: 'dateCol',
          isTableColumn: true,
          columns: {
            type: ['calendar_date', 'date'],
            hidden: isEdit(cpObj),
            defaultNames: ['start date', 'start']
          }
        }, {
          text: $.t('screens.ds.grid_sidebar.calendar.dates.end'),
          name: 'displayFormat.endDateTableId',
          type: 'columnSelect',
          notequalto: 'dateCol',
          isTableColumn: true,
          columns: {
            type: ['calendar_date', 'date'],
            hidden: isEdit(cpObj),
            noDefault: true,
            defaultNames: ['end date', 'end']
          }
        }]
      }, {
        title: $.t('screens.ds.grid_sidebar.calendar.information.title'),
        fields: [{
          text: $.t('screens.ds.grid_sidebar.calendar.information.event_title'),
          name: 'displayFormat.titleTableId',
          type: 'columnSelect',
          required: true,
          isTableColumn: true,
          columns: {
            type: ['calendar_date', 'dataset_link', 'date', 'drop_down_list',
              'email', 'flag', 'html', 'location', 'money', 'number', 'percent',
              'phone', 'stars', 'text', 'url'
            ],
            hidden: isEdit(cpObj),
            defaultNames: ['title']
          }
        }, {
          type: 'repeater',
          name: 'displayFormat.descriptionColumns',
          field: {
            text: $.t('screens.ds.grid_sidebar.calendar.information.details'),
            name: 'tableColumnId',
            type: 'columnSelect',
            isTableColumn: true,
            columns: {
              hidden: isEdit(cpObj)
            }
          },
          minimum: 1,
          addText: $.t('screens.ds.grid_sidebar.calendar.information.new_details_button')
        }]
      }];
    },

    _getFinishButtons: function() {
      return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel];
    },

    _finish: function(data, value, finalCallback) {
      var cpObj = this;
      if (!cpObj._super.apply(this, arguments)) {
        return;
      }

      var view = $.extend(true, {
          metadata: {
            renderTypeConfig: {
              visible: {
                calendar: true
              }
            }
          }
        },
        cpObj._getFormValues(), {
          metadata: cpObj._view.metadata
        });
      cpObj._view.update(view);

      var didCallback = false;
      if (isEdit(cpObj)) {
        // We need to show all columns when editing a view so that
        // any filters/facets work properly
        var colIds = _.pluck(cpObj._view.realColumns, 'id');
        if (colIds.length > 0) {
          cpObj._view.setVisibleColumns(colIds, finalCallback, true);
          didCallback = true;
        }
      }

      cpObj._finishProcessing();
      cpObj.reset();
      if (!didCallback && _.isFunction(finalCallback)) {
        finalCallback();
      }
    }
  }, {
    name: 'calendarCreate'
  }, 'controlPane');

  var isEdit = function(cpObj) {
    return _.include(cpObj._view.metadata.availableDisplayTypes, 'calendar');
  };

  if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.calendarCreate) {
    $.gridSidebar.registerConfig('visualize.calendarCreate', 'pane_calendarCreate', 5, 'calendar');
  }

})(jQuery);

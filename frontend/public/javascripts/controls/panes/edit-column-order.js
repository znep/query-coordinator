(function($) {
  var isLoading = false;

  $.Control.extend('pane_editColumnOrder', {
    _init: function() {
      var cpObj = this;
      cpObj._super.apply(cpObj, arguments);

      cpObj._view.bind('columns_changed', function() {
        if (isLoading) {
          return;
        }
        cpObj.reset();
      }, cpObj);
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.column_order.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.column_order.subtitle');
    },

    isAvailable: function() {
      return this._view.valid &&
        (!this._view.temporary || this._view.minorChange) &&
        !_.isEmpty(this._view.visibleColumns);
    },

    getDisabledSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.column_order.validation.valid_columns');
    },

    _getSections: function() {
      return [{
        title: $.t('screens.ds.grid_sidebar.column_order.columns.title'),
        customContent: {
          template: 'columnOrderBlock',
          directive: {
            'li.columnItem': {
              'column<-': {
                '.@data-columnId': 'column.id',
                '.name': 'column.name!',
                '.@class+': 'column.renderTypeName'
              }
            }
          },
          data: this._view.visibleColumns
        }
      }];
    },

    shown: function() {
      this._super();
      this.$dom().find('ul.columnsList').awesomereorder();
    },

    _getFinishButtons: function() {
      return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel];
    },

    _finish: function(data, value, finalCallback) {
      var cpObj = this;
      if (!cpObj._super.apply(cpObj, arguments)) {
        return;
      }

      var $columnsList = cpObj.$dom().find('.columnsList');
      var columns = _.pluck(_.sortBy(cpObj._view.visibleColumns, function(column) {
        return $columnsList.children('[data-columnId=' + column.id + ']').index();
      }), 'id');

      isLoading = true;
      cpObj._view.setVisibleColumns(columns, function() {
        cpObj._finishProcessing();
        cpObj._hide();
        isLoading = false;
        if (_.isFunction(finalCallback)) {
          finalCallback();
        }
      });
    }
  }, {
    name: 'editColumnOrder'
  }, 'controlPane');

  if ($.isBlank(blist.sidebarHidden.edit) || !blist.sidebarHidden.edit.updateColumn) {
    $.gridSidebar.registerConfig('edit.columnOrder', 'pane_editColumnOrder', 2);
  }

})(jQuery);

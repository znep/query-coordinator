(function($) {
  var isLoading = false;

  $.Control.extend('pane_showHideColumns', {
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
      return $.t('screens.ds.grid_sidebar.showhide_columns.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.showhide_columns.subtitle');
    },

    isAvailable: function() {
      return this._view.valid;
    },

    getDisabledSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.base.validation.invalid_view');
    },

    _getSections: function() {
      var cpObj = this;
      var sortFunc = function(c) {
        // Sort all the visible columns first, so start the sort string
        // with 'a'; then sort by position.  For hidden columns, start
        // with 'z' to sort them at the end; then just sort
        // alphabetically
        if (!c.hidden) {
          return 'a' + ('000' + c.position).slice(-3);
        }
        return 'z' + c.name;
      };

      var cols = _.chain(cpObj._view.realColumns).sortBy(sortFunc).map(function(c) {
        if (!$.isBlank(c.realChildColumns)) {
          return [c].concat(_.sortBy(c.realChildColumns, sortFunc));
        } else {
          return c;
        }
      }).flatten().value();

      if (cpObj._view.isGrouped()) {
        // Filter out columns that can't be displayed
        cols = _.reject(cols, function(c) {
          return !_.any(cpObj._view.metadata.jsonQuery.select, function(s) {
            return s.columnFieldName == c.fieldName;
          });
        });
      }

      return [{
        title: $.t('screens.ds.grid_sidebar.showhide_columns.columns.title'),
        customContent: {
          template: 'showHideBlock',
          data: cols,
          directive: {
            'li.columnItem': {
              'column<-': {
                'input@disabled': function(a) {
                  // Recursively pluck out all columnFieldNames from the query
                  // Theses are things being grouped by, filtered on, or rolled up.
                  var fields = a.item.view.getFilteredFieldNames();
                  // If this column is in the list of fields, we will stop the user
                  // from trying to hide it.
                  return _.includes(fields, a.item.fieldName) ? 'disabled' : undefined;
                },
                'input@checked': function(a) {
                  return a.item.hidden ? '' : 'checked';
                },
                'input@data-columnId': 'column.id',
                'input@id': 'showHide_#{column.id}',
                'label .name': 'column.name!',
                'label@for': 'showHide_#{column.id}',
                'label@class+': 'column.renderTypeName',
                '@data-parentId': function(a) {
                  return (a.item.parentColumn || {}).id || '';
                },
                '@class+': function(a) {
                  return !$.isBlank(a.item.parentColumn) ? 'childCol' : '';
                }
              }
            }
          },
          callback: function($sect) {
            // Turns out that purejs doesn't ignore attributes
            // that return undefined. Instead, it turns undefined into a string
            // and assigns it to the attribute.
            //
            // Well, that's not going to work for disabled.
            $sect.find('input[type="checkbox"]').each(function() {
              // If we run into a disabled that has a string value
              // of undefined, then we remove it.
              if (this.getAttribute('disabled') === 'undefined') {
                this.removeAttribute('disabled');
              } else {
                $(this).parent('li').socrataTip({
                  trigger: 'hover',
                  message: $.t('screens.ds.grid_sidebar.showhide_columns.warnings.active_filter'),
                  parent: 'body',
                  isSolo: true
                });
              }
            });

            $sect.find('li.columnItem[data-parentId]').each(function() {
              var $t = $(this);
              var $i = $sect.find('input[data-columnId=' + $t.attr('data-parentId') + ']');
              var updateViz = function() {
                _.defer(function() {
                  $t.toggle($i.is(':checked'));
                });
              };
              $i.change(updateViz).click(updateViz);
              updateViz();
            });
          }
        }
      }];
    },

    _getFinishButtons: function() {
      return [{
        text: $.t('core.dialogs.apply'),
        isDefault: true,
        value: true
      }, $.controlPane.buttons.cancel];
    },

    _finish: function(data, value, finalCallback) {
      var cpObj = this;
      if (!cpObj._super.apply(cpObj, arguments)) {
        return;
      }

      var cols = [];
      var children = {};
      cpObj.$dom().find('.columnItem :input:checked:visible').each(function() {
        var $t = $(this);
        var $colItem = $t.closest('li.columnItem');
        var colId = $t.attr('data-columnId');
        if ($colItem.is('.childCol')) {
          children[$colItem.attr('data-parentId')].push(colId);
        } else {
          cols.push(colId);
          if ($colItem.find('label').is('.nested_table')) {
            children[colId] = [];
          }
        }
      });

      cols = _.sortBy(cols, function(cId) {
        return cpObj._view.columnForID(cId).position;
      });

      var isUnhidingCols = _.any(
        _.select(cpObj._view.realColumns, function(col) {
          return col.hidden;
        }),
        function(col) {
          return _.include(cols, col.id + '');
        });

      _.each(children, function(__, id) {
        var parCol = cpObj._view.columnForID(id);
        cols = _.sortBy(cols, function(cId) {
          return parCol.childColumnForID(cId).position;
        });
        parCol.setVisibleChildColumns(cols);
      });

      isLoading = true;
      cpObj._view.setVisibleColumns(cols, function() {
        cpObj._finishProcessing();
        if (isUnhidingCols) {
          cpObj._view.invalidateRows();
        }
        cpObj._hide();
        isLoading = false;
        if (_.isFunction(finalCallback)) {
          finalCallback();
        }
      });
    }
  }, {
    name: 'showHide'
  }, 'controlPane');

  if (
    !blist.feature_flags.enable_2017_grid_view_refresh &&
    ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.showHide)
  ) {
    $.gridSidebar.registerConfig('manage.showHide', 'pane_showHideColumns', 5);
  }

})(jQuery);

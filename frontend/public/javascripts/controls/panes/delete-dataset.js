/* global prettyConfirm */

(function($) {
  $.Control.extend('pane_deleteDataset', {
    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.delete.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.delete.subtitle', {
        view_type: this._view.displayName
      });
    },

    _getSections: function() {
      var message = '';
      if (this._view.type == 'blist') {
        if (this._view.isPublished()) {
          message = $.t('screens.ds.grid_sidebar.delete.warning.published');
        } else {
          message = $.t('screens.ds.grid_sidebar.delete.warning.working_copy');
        }
      } else if (this._view.isAPI()) {
        message = $.t('screens.ds.grid_sidebar.delete.warning.api');
      } else if (this._view.viewType == 'tabular') {
        message = $.t('screens.ds.grid_sidebar.delete.warning.view');
      }

      return [{
        fields: [{
          type: 'static',
          value: message
        }]
      }];
    },

    _getFinishButtons: function() {
      return [{
          isDefault: true,
          text: $.t('screens.ds.grid_sidebar.delete.delete_button', {
            view_type: this._view.displayName
          }),
          value: true
        },
        $.controlPane.buttons.cancel
      ];
    },

    _finish: function() {
      var cpObj = this;
      if (!cpObj._super.apply(cpObj, arguments)) {
        return;
      }

      var onRemoved = function() {
        // too weird to try to use the callback here, since it won't work
        // if the dataset's been deleted. the grid page will fetch it onload
        // anyway, so count on that to return. otherwise, we have sane behavior
        // anyway.
        var possibleViewObj = cpObj._view._publishedView || cpObj._view._modifyingView || cpObj._view._parent;
        if (_.isUndefined(possibleViewObj)) {
          window.location.href = $.path('/profile');
        } else {
          possibleViewObj.redirectTo();
        }
      };

      cpObj._finishProcessing();

      var message = '';

      if (_.indexOf(this._view.flags, 'restorable') != -1) {
        message = $.t('screens.ds.grid_sidebar.delete.confirm_restorable', {
          number_of_days_restorable: (function() {
            var numberOfDaysRestorable = 0;

            try {
              // TODO: This was taken verbatim from /util/dataset/dataset.js,
              // but it's clearly broken insofar as it will return a jQuery
              // ajax instance and not a number. Let's fix this, but eventually,
              // since apparently nobody has ever filed a bug about it, either.
              numberOfDaysRestorable = parseInt(
                $.ajax({
                  url: '/views.json?method=numberOfDaysRestorable',
                  async: false
                }).responseText,
                10
              );
            } catch (e) {} // eslint-disable-line no-empty

            return numberOfDaysRestorable;
          })()
        });
      } else {
        message = $.t('screens.ds.grid_sidebar.delete.confirm_permanent', {
          view_type: this._view.displayName
        });
      }

      prettyConfirm(message, function() {
        cpObj._view.remove(onRemoved);
      });
    }

  }, {
    name: 'deleteDataset'
  }, 'controlPane');

  if (blist.sidebarHidden && ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.deleteDataset)) {
    $.gridSidebar.registerConfig('manage.deleteDataset', 'pane_deleteDataset', 9);
  }

})(jQuery);

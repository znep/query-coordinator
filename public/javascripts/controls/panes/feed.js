(function($) {
  $.Control.extend('pane_feed', {
    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.feed.title');
    },

    getSubtitle: function() {

      var subtitle = $.t('screens.ds.grid_sidebar.feed.subtitle');
      // On feature flag 'remove_views_from_discuss_pane' rollback,
      // the 'subtitle' re-assignment below will be removed.
      if (window.blist.feature_flags.remove_views_from_discuss_pane === true)
        subtitle = $.t('screens.ds.grid_sidebar.feed.route_to_more_views_subtitle');
      return subtitle;
    },

    _getSections: function() {
      return [{
        customContent: {
          template: 'feedList',
          directive: {},
          data: {},
          callback: function() {
            var cpObj = this;
            cpObj._startProcessing();

            var comments;
            var views = [];

            var currentView = cpObj._view;
            var callback;

            function renderDiscuss() {
              cpObj._finishProcessing();
              cpObj.$dom().find('.feedList .feed').feedList({
                comments: comments,
                mainView: currentView,
                views: views,
                addCommentCallback: function(view) {
                  $('.controlPane.about .numberOfComments').text(view.numberOfComments);
                  if (!$.isBlank(blist.datasetPage)) {
                    blist.datasetPage.$feedTab.contentIndicator().setText(view.numberOfComments);
                  }
                }
              });
            }

            function getComments(cb) {
              currentView.getComments(function(responseData) {
                comments = responseData;
                cb();
              });
            }

            function getParent(cb) {
              currentView.getParentDataset(function(parDS) {
                if (!$.isBlank(parDS)) {
                  views = views.concat(parDS);
                }
                cb();
              });
            }

            function getRelatedViews(cb) {
              currentView.getRelatedViews(function(relatedViews) {
                views = views.concat(relatedViews);
                cb();
              });
            }

            // This is part of the fix for ticket EN-5453
            // The grid view discuss pane has the option to see the activity around a dataset (such as derived views creation and modification)
            // On datasets with a lot of derived views, loading the discuss pane takes a long time
            // due to the slowness of core's api/views?getByTableId endpoint.
            // A workaround is to remove the option of viewing derived views from the discuss pane through the use of a feature flag.
            // For customers that have feature flag `remove_views_from_discuss_pane` set to true, the discuss pane will only show comments.
            // This feature flag is false by default and will be turned on only for data.cityofnewyork.us

            // Note that renderDiscuss is not idempotent -- it is important to only call it once
            // after all the requests have completed.

            // on feature flag rollback, the if else statement has to be removed and replaced with the body of "else"
            if (window.blist.feature_flags.remove_views_from_discuss_pane === true) {
              callback = _.after(2, renderDiscuss);
              getComments(callback);
              getParent(callback);
            } else {
              callback = _.after(3, renderDiscuss);
              getComments(callback);
              getParent(callback);
              getRelatedViews(callback);
            }
          }
        }
      }];
    }
  }, {
    name: 'feed',
    noReset: true
  }, 'controlPane');

  if ($.isBlank(blist.sidebarHidden.feed) || !blist.sidebarHidden.feed.discuss) {
    $.gridSidebar.registerConfig('feed', 'pane_feed');
  }

})(jQuery);

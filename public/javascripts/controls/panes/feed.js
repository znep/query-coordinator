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

            // This is part of the fix for ticket EN-5453
            // The grid view discuss pane has the option to see the activity around a dataset (such as derived views creation and modification)
            // On datasets with a lot of derived views, loading the discuss pane takes a long time
            // due to the slowness of core's api/views?getByTableId endpoint.
            // A workaround is to remove the option of viewing derived views from the discuss pane through the use of a feature flag.
            // For customers that have feature flag `remove_views_from_discuss_pane` set to true, the discuss pane will only show comments.
            // This feature flag is false by default and will be turned on only for data.cityofnewyork.us

            // We hard code the number of times doRender (line 51) has to wait before rendering.
            // The reason is that doRender is not idempotent, and if called multiple times it will re-render items.
            // It is safe to hard code this value given that the number of requests is static and not defined by the user.
            // On line 48, we adjust the count to 1 if the feature flag is turned on
            // because we only need to wait for one request (to fetch comments) before rendering
            // as opposed to three requests (for getting comments, derived views, and the main view)
            var requestCount = 3;

            // on feature flag rollback, this line of code has to be removed (EN-5453)
            if (window.blist.feature_flags.remove_views_from_discuss_pane  === true) {
               requestCount = 1;
            }

            var doRender = _.after(requestCount, function() {
              cpObj._finishProcessing();

              cpObj.$dom().find('.feedList .feed').feedList({
                comments: comments,
                mainView: cpObj._view,
                views: views,
                addCommentCallback: function(view) {
                  $('.controlPane.about .numberOfComments').text(view.numberOfComments);
                  if (!$.isBlank(blist.datasetPage)) {
                    blist.datasetPage.$feedTab.contentIndicator().setText(view.numberOfComments);
                  }
                }
              });
            });

            cpObj._view.getComments(function(responseData) {
              comments = responseData;
              doRender();
            });

            // When `remove_views_from_discuss_pane` is to true, we do not need to get the parent and related views
            // On feature flag rollback:
            // the condition that checks the value of `remove_views_from_discuss_pane` has to be removed
            // derived views and the view will be loaded for all domains.
            if (window.blist.feature_flags.remove_views_from_discuss_pane === false) {
              cpObj._view.getRelatedViews(function(relatedViews) {
                views = views.concat(relatedViews);
                doRender();
              });
              cpObj._view.getParentDataset(function(parDS) {
              if (!$.isBlank(parDS)) {
                views = views.concat(parDS);
              }
              doRender();
            });
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

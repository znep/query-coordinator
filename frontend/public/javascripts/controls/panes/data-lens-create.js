(function($) {
  $.Control.extend('pane_dataLensCreate', {
    _init: function() {
      var cpObj = this;
      cpObj._super.apply(cpObj, arguments);
      cpObj._view.bind('clear_temporary', function() {
        cpObj.reset();
      }, cpObj);
    },

    _getSections: function() {
      return [{
        customContent: {
          template: 'dataLensPaneContentWrapper'
        }
      }];
    },

    render: function(data, isTempData, completeCallback) {
      var cpObj = this;

      // This is to avoid overwriting earlier callbacks
      cpObj._super(data, isTempData, function() {
        if (_.isFunction(completeCallback)) {
          completeCallback();
        }

        var button = cpObj.$dom().find('.dataLensPaneContentWrapper .finishButtons .button');

        // Display flyout while fetching the correct href (and the button is disabled)
        var msg = $.t('screens.ds.grid_sidebar.data_lens.button_flyout');
        button.socrataTip({
          content: msg,
          positions: 'left'
        });

        generateDataLensLinkHref().then(function(href) {
          if (href !== '#') {
            button.
            removeClass('disabled').
            attr('href', href).
            socrataTip().destroy();
          }
        });
      });
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.data_lens.title');
    }

  }, {
    name: 'dataLensCreate'
  }, 'controlPane');

  // See datasets_helper.rb for sidebarHidden settings
  var userCanUpdateMetadata = $.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.dataLensCreate;
  var _newBackendMetadata;

  // We already check the feature flag when deciding whether or not to show the data lens pane,
  // but just to be extra safe, let's double check the feature flag to bootstrap derived views
  // is turned on.
  var isDerivedView = _.includes(['grouped', 'filter'], blist.dataset.type);
  var allowDerivedViewBootstrap = blist.feature_flags.enable_data_lens_using_derived_view;

  if (userCanUpdateMetadata) {
    $.gridSidebar.registerConfig('visualize.dataLensCreate', 'pane_dataLensCreate', 2, 'chart');

    // Fetch dataset migration, in case it's needed later
    if (!isDerivedView) {
      _newBackendMetadata = blist.dataset.getNewBackendMetadata();
    }
  }

  function generateDataLensLinkParams() {
    var hasGroupBys = !_.isUndefined(blist.dataset.query) && !_.isUndefined(blist.dataset.query.groupBys);

    return {
      hasGroupBys: hasGroupBys,
      dataset: blist.dataset
    };
  }

  function generateDataLensLinkHref() {
    var href = '#';
    var localePart = blist.locale === blist.defaultLocale ? '' : '/' + blist.locale;
    var linkParams = generateDataLensLinkParams();
    var canBootstrapDataLens = !linkParams.hasGroupBys;
    var deferred = $.Deferred(); // eslint-disable-line new-cap

    // Prevent data lens button for geo dataset
    if (linkParams.dataset.viewType === 'geo') {

      deferred.resolve(href);
      return deferred.promise();

    } else if (linkParams.dataset.newBackend) {

      if (canBootstrapDataLens) {
        href = '{0}/view/bootstrap/{1}'.format(localePart, linkParams.dataset.id);
      }
      deferred.resolve(href);
      return deferred.promise();

    } else if (isDerivedView && allowDerivedViewBootstrap) {

      // we need to ensure that there's a NBE copy for the parent view, or the read_from_nbe flag
      // we use to make derived views work will return OBE columns and everything in data lens will
      // self-destruct.
      var getParentViewPromise = function() {
        var parentViewDeferred = $.Deferred(); // eslint-disable-line new-cap

        // we're creating parentViewDeferred because dataset.getParentView takes a callback,
        // but dataset.getNewBackendMetadata returns a promise. parentViewDeferred lets us
        // get all the information we need to enable the button, below.
        blist.dataset.getParentView(function(parentView) {
          if (parentView) {
            parentViewDeferred.resolve(parentView);
          } else {
            parentViewDeferred.reject();
          }
        });

        return parentViewDeferred.promise();
      };

      // as of 12/2016, this page is using jQuery 1.7. pipe is deprecated as of jQuery 1.8, but
      // in 1.7, the promise chain breaks if you use then (then invokes callbacks but does not
      // return a promise, whereas pipe invokes callbacks and then returns a promise with the
      // result of the callbacks). generateDataLensLinkHref needs to return a promise (see where
      // it is invoked, above).
      return getParentViewPromise().
        pipe(function(parentView) {
          return parentView.getNewBackendMetadata();
        }).
        pipe(function(nbeMetadata) {
          if (nbeMetadata) {
            href = '{0}/view/bootstrap/{1}'.format(localePart, linkParams.dataset.id);
          }
          return href;
        }).
        fail(function() {
          return href;
        });

    } else {

      if (_.isUndefined(_newBackendMetadata)) {
        deferred.resolve(href);
        return deferred.promise();
      }

      // as of 12/2016, this page is using jQuery 1.7. pipe is deprecated as of jQuery 1.8, but
      // in 1.7, the promise chain breaks if you use then (then invokes callbacks but does not
      // return a promise, whereas pipe invokes callbacks and then returns a promise with the
      // result of the callbacks). generateDataLensLinkHref needs to return a promise (see where
      // it is invoked, above).
      return _newBackendMetadata.
        pipe(function(nbeMetadata) {
          if (nbeMetadata && canBootstrapDataLens) {
            href = '{0}/view/bootstrap/{1}'.format(localePart, nbeMetadata.id);
          }
          return href;
        }).
        fail(function() {
          return href;
        });

    }
  }
})(jQuery);

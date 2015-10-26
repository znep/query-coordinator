(function($) {
  $.Control.extend('pane_dataLensCreate', {
    _init: function() {
      var cpObj = this;
      cpObj._super.apply(cpObj, arguments);
      cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);
    },

    _getSections: function() {
      return [
        {
          customContent: {
            template: 'dataLensPaneContentWrapper'
          }
        }
      ]
    },

    render: function(data, isTempData, completeCallback) {
      var cpObj = this;

      // This is to avoid overwriting earlier callbacks
      cpObj._super(data, isTempData, function() {
        if (_.isFunction(completeCallback)) {
          completeCallback();
        }

        generateDataLensLinkHref().then(function(href) {
          var button = $('.dataLensPaneContentWrapper .finishButtons .button');

          if (href !== '#') {
            button.removeClass('disabled');
            button.attr('href', href);
          }
        });
      });
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.data_lens.title');
    }

  }, {name: 'dataLensCreate'}, 'controlPane');

  // See datasets_helper.rb for sidebarHidden settings
  var userCanUpdateMetadata = $.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.dataLensCreate;
  var useEphemeralBootstrap = blist.feature_flags.use_ephemeral_bootstrap;
  var _newBackendMetadata;

  if (useEphemeralBootstrap && userCanUpdateMetadata) {
    $.gridSidebar.registerConfig('visualize.dataLensCreate', 'pane_dataLensCreate', 2, 'chart');

    // Fetch dataset migration, in case it's needed later
    _newBackendMetadata = blist.dataset.getNewBackendMetadata();
  }

  // Refer to getNewUXLinkParams in dataset-show.js
  function generateDataLensLinkParams() {
    var hasGroupBys = !_.isUndefined(blist.dataset.query) && !_.isUndefined(blist.dataset.query.groupBys);

    return {
      hasGroupBys: hasGroupBys,
      dataset: blist.dataset,
      dataLensState: blist.feature_flags.data_lens_transition_state
    };
  }

  // Refer to getNewUXLinkHref in dataset-show.js.
  // This function duplicates logic, but returns a promise instead of creating data lens popup
  // through side effects.
  function generateDataLensLinkHref() {
    var href = '#';
    var localePart = blist.locale === blist.defaultLocale ? '' : '/' + blist.locale;
    var linkParams = generateDataLensLinkParams();
    var canBootstrapDataLens = !linkParams.hasGroupBys;
    var deferred = $.Deferred();

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

    } else {

      if (_.isUndefined(_newBackendMetadata)) {
        deferred.resolve(href);
        return deferred.promise();
      }

      // pipe is deprecated as of jQuery 1.8, but the promise chain breaks without it :(
      return _newBackendMetadata.pipe(function(nbeMetadata) {
        if (nbeMetadata && canBootstrapDataLens) {
          href = '{0}/view/bootstrap/{1}'.format(localePart, nbeMetadata.id);
        }
        return href;
      }).fail(function() { return href; });

    }
  }
})(jQuery);

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
          if (href !== '#') {
            var button = $('.dataLensPaneContentWrapper .finishButtons .button');

            button.toggleClass('disabled');
            button.attr('href', href);
          }
        });
      });
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.data_lens.title');
    }

  }, {name: 'dataLensCreate'}, 'controlPane');

  // Checks if dataset migrates successfully before rendering data lens pane
  var _newBackendMetadata = blist.dataset.getNewBackendMetadata();

  _newBackendMetadata.pipe(function() {
    if (canUpdateMetadata() && blist.feature_flags.use_ephemeral_bootstrap) {
      $.gridSidebar.registerConfig('visualize.dataLensCreate', 'pane_dataLensCreate', 2, 'chart');
    }
  });

  // Refer to canUpdateMetadata in dataset-show.js
  function canUpdateMetadata() {
    var hasRights = !_.isNull(blist.currentUser) && !_.isUndefined(blist.currentUser) && blist.currentUser.hasOwnProperty('rights');

    if (blist.feature_flags.create_v2_data_lens) {
      // The user has a role on the domain.
      return hasRights && blist.currentUser.rights.length > 0;
    } else {
      // The user is an admin or publisher.
      return hasRights && blist.currentUser.rights.indexOf('edit_others_datasets') > -1;
    }
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
    var dummyHref = '#';
    var localePart = blist.locale === blist.defaultLocale ? '' : '/' + blist.locale;
    var linkParams = generateDataLensLinkParams();
    var canBootstrapDataLens = !linkParams.hasGroupBys;
    var deferred = $.Deferred();

    // Prevent data lens button for geo dataset
    if (linkParams.dataset.viewType === 'geo') {
      deferred.resolve(dummyHref);
      return deferred.promise();
    } else if (linkParams.dataset.newBackend) {
      if (canBootstrapDataLens) {
        deferred.resolve(localePart + '/view/bootstrap/{0}'.format(linkParams.dataset.id));
        return deferred.promise();
      } else {
        deferred.resolve(dummyHref);
        return deferred.promise();
      }
    } else {
      // pipe is deprecated as of jQuery 1.8, but the promise chain breaks without it :(
      return _newBackendMetadata.pipe(function(nbeMetadata) {
        if (!nbeMetadata) return dummyHref;
        if (nbeMetadata.defaultPage) {
          var lensViewId = nbeMetadata.defaultPage;
          return $.get('/metadata/v1/page/{0}.json'.format(lensViewId)).pipe(function(lensMetadata) {
            // For OBE dataset pages, only show link to the lens view if the domain is post_beta
            // and the corresponding lens page is set to public.
            var isDataLensAccessible = linkParams.dataLensState === 'post_beta' && lensMetadata.permissions.isPublic;

              if (isDataLensAccessible) {
                return localePart + '/view/{0}'.format(lensViewId);
              } else {
                return dummyHref;
              }
          }).fail(function() {
            // This is a workaround because the metadata holds a `defaultPage` reference
            // that doesn't correspond to an existing page (i.e. page deleted but metadata
            // not kept in sync). In this case, attempt to rebootstrap the page, which will
            // update the metadata appropriately.
            if (canBootstrapDataLens) {
              return localePart + '/view/bootstrap/{0}'.format(nbeMetadata.id);
            } else {
              return dummyHref;
            }
          });
        } else if (canBootstrapDataLens) {
          // No view has been bootstrapped yet, only let the user bootstrap if the
          // dataset can be bootstrapped.
          return localePart + '/view/bootstrap/{0}'.format(nbeMetadata.id);
        } else {
          return dummyHref;
        }
      });
    }
  }
})(jQuery);

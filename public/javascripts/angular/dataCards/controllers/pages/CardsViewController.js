(function() {

  'use strict';

  function CardsViewController($scope, $location, $log, $window, AngularRxExtensions, SortedTileLayout, Filter, PageDataService, UserSession, FlyoutService, page) {

    AngularRxExtensions.install($scope);

    /*************************
    * General metadata stuff *
    *************************/

    $scope.page = page;
    $scope.bindObservable('pageName', page.observe('name').map(function(name) {
      return _.isUndefined(name) ? 'Untitled' : name;
    }));
    $scope.bindObservable('pageDescription', page.observe('description'));

    $scope.bindObservable('dataset', page.observe('dataset'));
    $scope.bindObservable('datasetPages', page.observe('dataset').observeOnLatest('pages'));
    $scope.bindObservable('datasetRowDisplayUnit', page.observe('dataset').observeOnLatest('rowDisplayUnit'));
    $scope.bindObservable('datasetDaysUnmodified', page.observe('dataset').observeOnLatest('updatedAt').map(function(date) {
      // TODO just a placeholder implementation
      if (!date) return '';
      return moment(date).fromNow();
    }));

    $scope.bindObservable('sourceDatasetName', page.observe('dataset').observeOnLatest('name'));

    $scope.bindObservable('sourceDatasetURL',
      page.observe('datasetId').map(function(datasetId) {
        return '/ux/dataset/{0}'.format(datasetId);
      })
    );

    /***************
    * User session *
    ***************/

    // Bind the current user to the scope, or null if no user is logged in or there was an error
    // fetching the current user.
    $scope.bindObservable(
      'currentUser',
      Rx.Observable.fromPromise(UserSession.getCurrentUser()),
      _.constant(null)
    );


    /*****************
    * API panel junk *
    *****************/

    $scope.bindObservable('datasetCSVDownloadURL',
      page.observe('dataset').map(function(dataset) {
        if (dataset && dataset.hasOwnProperty('id')) {
          return '/api/views/{0}/rows.csv?accessType=DOWNLOAD'.format(dataset.id);
        } else {
          return '#';
        }
      }));

    $scope.bindObservable('datasetAPIURL', Rx.Observable.combineLatest(
      page.observe('dataset').map(function(dataset) { if (dataset) { return dataset.id; } else { return null; } }),
      page.observe('dataset').observeOnLatest('domain').map(function(domain) { if (domain) { return domain; } else { return null; } }),
      function(datasetId, domain) {
        if ($.isPresent(datasetId) && $.isPresent(domain)) {
          return 'https://{0}/resource/{1}.json'.format(domain, datasetId);
        } else {
          return '#';
        }
      }));

    $scope.bindObservable('datasetDocumentationURL',Rx.Observable.combineLatest(
      page.observe('dataset').map(function(dataset) { if (dataset) { return dataset.id; } else { return null; } }),
      page.observe('dataset').observeOnLatest('domain').map(function(domain) { if (domain) { return domain; } else { return null; } }),
      function(datasetId, domain) {
        if ($.isPresent(datasetId) && $.isPresent(domain)) {
          return 'http://dev.socrata.com/foundry/#/{0}/{1}'.format(domain, datasetId);
        } else {
          return '#';
        }
      }));

    // Track whether or not the panel is visible in the UI.
    $scope.apiPanelActive = false;

    $('#api-panel-toggle-btn').on('click', function() {
      $scope.$apply(function() {
        $scope.apiPanelActive = !$scope.apiPanelActive;
      });
    });

    /* Handle selection of the API endpoint URL in the API panel */

    // Don't include this in scope! It either won't work and will require an .$apply()
    // or it will cause a bunch of digest cycles unnecessarily.
    var mouseHasNotMovedSinceMouseDown = false;

    $('#api-url-display').on('mousedown', function() {
      mouseHasNotMovedSinceMouseDown = true;
    });

    $('#api-url-display').on('mousemove', function() {
      mouseHasNotMovedSinceMouseDown = false;
    });

    // Also reset the mouse state on scroll so it doesn't auto-select the API url
    // when we try to maniuplate the scroll bar.
    $('#api-url-display').on('scroll', function() {
      mouseHasNotMovedSinceMouseDown = false;
    });

    $('#api-url-display').on('mouseup', function() {
      if (mouseHasNotMovedSinceMouseDown) {

        var text = document.getElementById('api-url-content');

        // Cater to IE...
        if (document.body.createTextRange) {
            var range = document.body.createTextRange();
            range.moveToElementText(text);
            range.select();
        // ...or everyone else.
        } else if (window.getSelection) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }

      }
    });

    $('#api-url-display').on('blur', function() {
      urlDisplayNotFocused = true;
    });


    /*******************************
    * Filters and the where clause *
    *******************************/

    var allCardsFilters = page.observe('cards').flatMap(function(cards) {
      if (!cards) { return Rx.Observable.never(); }
      return Rx.Observable.combineLatest(_.map(cards, function(d) { return d.observe('activeFilters');}), function() {
        return _.zipObject(_.pluck(cards, 'fieldName'), arguments);
      });
    });

    var allCardsWheres = allCardsFilters.map(function(filters) {
      var wheres = _.map(filters, function(operators, field) {
        if (_.isEmpty(operators)) {
          return null;
        } else {
          return _.invoke(operators, 'generateSoqlWhereFragment', field).join(' AND ');
        }
      });
      return _.compact(wheres).join(' AND ');
    });

    $scope.bindObservable('globalWhereClauseFragment', allCardsWheres.combineLatest(page.observe('baseSoqlFilter'), function(cardWheres, basePageWhere) {
      return _.compact([basePageWhere, cardWheres]).join(' AND ');
    }));

    $scope.bindObservable('appliedFiltersForDisplay', allCardsFilters.combineLatest(page.observe('dataset').observeOnLatest('columns'), function(filters, columns) {

      function humanReadableOperator(filter) {
        if (filter instanceof Filter.BinaryOperatorFilter) {
          if (filter.operator === '=') {
            return 'is';
          } else {
            throw new Error('Only the "=" filter is currently supported.');
          }
        } else if (filter instanceof Filter.TimeRangeFilter) {
          return 'is';
        } else if (filter instanceof Filter.IsNullFilter) {
          if (filter.isNull) {
            return 'is';
          } else {
            return 'is not';
          }
        } else {
          throw new Error('Cannot apply filter of unsupported type "' + filter + '".');
        }
      }

      function humanReadableOperand(filter) {
        if (filter instanceof Filter.BinaryOperatorFilter) {
          return filter.humanReadableOperand || filter.operand;
        } else if (filter instanceof Filter.IsNullFilter) {
          return 'blank';
        } else if (filter instanceof Filter.TimeRangeFilter) {
          var format = 'YYYY MMMM DD';
          return '{0} to {1}'.format(
            moment(filter.start).format(format),
            moment(filter.end).format(format)
          );
        } else {
          throw new Error('Cannot apply filter of unsupported type "' + filter + '".');
        }
      }

      return _.reduce(filters, function(accumulator, appliedFilters, fieldName) {
        if ($.isPresent(appliedFilters)) {
          if (appliedFilters.length > 1) {
            $log.warn('Cannot apply multiple filters to a single card.');
          }
          var filter = _.first(appliedFilters);
          accumulator.push({
            column: columns[fieldName],
            operator: humanReadableOperator(filter),
            operand: humanReadableOperand(filter)
          });
        }
        return accumulator;
      }, []);

    }));


    /***************************
    * View/edit modal behavior *
    ***************************/

    $scope.editMode = false;

    // Global save events. Elements in this stream include only:
    // * 'idle': Initial and resting state.
    // * 'saving': A save was started.
    // * 'saved': A save was successfully completed.
    // * 'failed': A save failed to complete.
    var globalSaveEvents = new Rx.BehaviorSubject('idle');

    $scope.bindObservable('saveStatus', globalSaveEvents);
    $scope.bindObservable('saveStatusText', globalSaveEvents.map(function(activity) {
      if (activity === 'saving') { return 'Saving'; }
      if (activity === 'saved') { return 'Saved!'; }
      if (activity === 'failed') { return 'Failed'; }

      return 'Save';
    }));

    // We've got changes if the last action was an edit (vs. a save).
    // All sets map to true, and all saves map to false. Thus, the latest
    // value is what we want to set to hasChanges.
    $scope.bindObservable(
      'hasChanges',
      Rx.Observable.merge(
        page.observePropertyChangesRecursively().map(_.constant(true)),
        globalSaveEvents.filter(function(activity) { return activity === 'saved'; }).map(_.constant(false))
      )
    );

    $scope.savePage = function() {
      if ($scope.hasChanges) {
        var savedMessagePersistenceMsec = 3000;
        var failureMessagePersistenceMsec = 8000;
        var pretendSaveTakesAtLeastThisLongMsec = 300;

        globalSaveEvents.onNext('saving');

        // Desired behavior is to jump out of edit mode immediately upon hitting save.
        $scope.editMode = false;

        var savePromise = PageDataService.save(page.serialize(), page.id);

        // Sequence of exactly one false or exactly one true, signifying failure or success, respectively.
        var successOrFailure = Rx.Observable.fromPromise(savePromise).
          map(_.constant(true)).                        // We don't care what the promise returns. If it resolves, it's a success.
          catchException(Rx.Observable.returnValue(false));  // All exceptions mean that we failed.

        // Convenience.
        var failures = successOrFailure.filter(function(v) { return !v; });
        var successes = successOrFailure.filter(_.identity);

        // We want to pretend that the save always takes at least
        // a few ms, otherwise the action taken isn't clear.

        // Subscription is shared, so only one timer will be made.
        var timeout = Rx.Observable.timer(pretendSaveTakesAtLeastThisLongMsec).share();

        var debouncedSuccesses = Rx.Observable.firstToReact(timeout, successes). // Surface the sequence which reacts first.
          map(function(sequence) {
            // Depending on which sequence reacted first, figure out when to tell the user success happened.
            if (sequence === timeout) return successes; // Timeout happened, which means the minimum delay was reached. Just use the real success.
            else return timeout; // Success happened too fast. Return success when the timeout completes.
          }).
          switchLatest(); // Use the sequence from the map above.

        // Ultimately, we need to return to idle after showing a message for a few seconds.
        // So, delay the success or failure message appropriately.
        var successOrFailureDelayed = Rx.Observable.merge(
            debouncedSuccesses,
            failures
          ).
          delayWithSelector(
            function(result) {
              return Rx.Observable.timer(
                result ? savedMessagePersistenceMsec : failureMessagePersistenceMsec
              );
            }
          );

        // Translate these sequences into global page event nomenclature, and pipe to globalSaveEvents
        Rx.Observable.merge(
          debouncedSuccesses.map(_.constant('saved')),
          failures.map(_.constant('failed')),
          successOrFailureDelayed.map(_.constant('idle')), // Ultimate time-shifted failure or success always causes us to revert to idle.
          Rx.Observable.never() // Make this sequence never complete, otherwise we'll cause globalSaveEvents to complete too.
        ).
        subscribe(globalSaveEvents); 
      }
    };

    $scope.savePageAs = function(name, description) {
      var newPage = _.extend(page.serialize(), {
        name: name,
        description: description
      });
      PageDataService.
        save(newPage).
        then(function(response) {
          var data = response.data;
          $window.location.href = '/view/{0}'.format(data.pageId);
        },
        function(error) {
          // TODO: Handling the error case is a separate, future story. For now,
          // at least tell the user what went wrong.
          alert('Unable to save: {0}: {1}'.format(error.status, error.statusText));
        });
    };


    //TODO consider extending register() to take a selector, too.
    FlyoutService.register('save-button', function() {
      if (globalSaveEvents.value === 'failed') {
        return '<div class="flyout-title">An error occurred</div><div>Please contact Socrata Support</div>';
      } else if (globalSaveEvents.value === 'idle') {
        return $scope.hasChanges ? '<div class="flyout-title">Click to save your changes</div>'
                                 : '<div class="flyout-title">No changes to be saved</div>';
      }
    });

    FlyoutService.register('save-as-button', function() {
      return $scope.hasChanges ? '<div class="flyout-title">Click to save your changes as a new view</div>'
                               : '<div class="flyout-title">No changes to be saved</div>';
    });
    //
    // Since we have a flyout handler whose output depends on globalSaveEvents and $scope.hasChanges,
    // we need to poke the FlyoutService. We want the flyout to update immediately.
    globalSaveEvents.merge($scope.observe('hasChanges')).subscribe(function() {
      FlyoutService.refreshFlyout();
    });


    /******************************************
    * Clean up if/when the scope is destroyed *
    ******************************************/

    $scope.$on('$destroy', function() {
      $('#api-panel-toggle-btn').off('click');
      $('#api-url-display').off('mousedown');
      $('#api-url-display').off('mousemove');
      $('#api-url-display').off('scroll');
      $('#api-url-display').off('mouseup');
      $('#api-url-display').off('blur');
    });

  };

  angular.
    module('dataCards.controllers').
      controller('CardsViewController', CardsViewController);

})();

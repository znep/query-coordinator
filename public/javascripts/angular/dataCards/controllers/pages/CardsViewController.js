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

    /**
     * CSV download Button
     */
    $scope.bindObservable('datasetCSVDownloadURL',
      page.observe('dataset').map(function(dataset) {
        if (dataset && dataset.hasOwnProperty('id')) {
          return '/api/views/{0}/rows.csv?accessType=DOWNLOAD'.format(dataset.id);
        } else {
          return '#';
        }
      }));

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

    // Global save events. Elements in this stream are objects
    // with a status key set to one of only:
    // * 'idle': Initial and resting state.
    // * 'saving': A save was started.
    // * 'saved': A save was successfully completed.
    // * 'failed': A save failed to complete.
    //
    // If the status is 'saved', there must be an additional
    // key of 'id' set to the saved page's ID.
    var currentPageSaveEvents = new Rx.BehaviorSubject({ status: 'idle' });

    // Bind save status related things so the UI reflects them.
    $scope.bindObservable('saveStatus', currentPageSaveEvents.pluck('status'));

    // We've got changes if the last action was an edit (vs. a save).
    // All sets map to true, and all saves map to false. Thus, the latest
    // value is what we want to set to hasChanges.
    $scope.bindObservable(
      'hasChanges',
      Rx.Observable.merge(
        page.observePropertyChangesRecursively().map(_.constant(true)),
        currentPageSaveEvents.filter(function(event) { return event.status === 'saved'; }).map(_.constant(false))
      )
    );

    function writeSerializedPageJsonAndNotify(serializedJson, publishTo) {
      var savedMessagePersistenceMsec = 3000;
      var failureMessagePersistenceMsec = 8000;
      var pretendSaveTakesAtLeastThisLongMsec = 300;

      publishTo.onNext({ status: 'saving' });

      // Desired behavior is to jump out of edit mode immediately upon hitting save.
      $scope.editMode = false;

      var savePromise = PageDataService.save(serializedJson, serializedJson.pageId);

      var saveResponseData = Rx.Observable.fromPromise(savePromise).pluck('data');

      // Convenience.
      var savedId = saveResponseData.pluck('pageId').ignoreErrors();
      var failures = saveResponseData.errors();

      // We want to pretend that the save always takes at least
      // a few ms, otherwise the action taken isn't clear.
      var successesDelayedForUsersBenefit = savedId.imposeMinimumDelay(pretendSaveTakesAtLeastThisLongMsec);

      // Ultimately, we need to return to idle after showing a message for a few seconds.
      // So, delay the success or failure message appropriately depending on success or failure.
      var saveComplete = Rx.Observable.firstToReact(
        successesDelayedForUsersBenefit,
        failures
      ).
      map(function(sequence) {
        return Rx.Observable.timer(
          sequence === successesDelayedForUsersBenefit ? savedMessagePersistenceMsec : failureMessagePersistenceMsec
        );
      }).
      switchLatest();

      // Translate these sequences into global page event nomenclature, and pipe to publishTo
      Rx.Observable.merge(
        successesDelayedForUsersBenefit.map(function(id) { return { status: 'saved', id: id }; }),
        failures.map(_.constant({ status: 'failed' })),
        saveComplete.map(_.constant({ status: 'idle' })), // Ultimate time-shifted failure or success always causes us to revert to idle.
        Rx.Observable.never() // Make this sequence never complete, otherwise we'll cause publishTo to complete too.
      ).
      subscribe(publishTo);
    };

    $scope.savePage = function() {
      if ($scope.hasChanges) {
        writeSerializedPageJsonAndNotify(
          $.extend(
            page.serialize(),
            { pageId: page.id }
          ),
          currentPageSaveEvents);
      }
    };

    $scope.savePageAs = function(name, description) {
      var saveStatusSubject = new Rx.BehaviorSubject();

      var newPage = _.extend(page.serialize(), {
        name: name,
        description: description
      });
      // PageDataService looks at whether or not pageId is set on the blob.
      // If it's set, it will do a regular save. We want it to save a new page.
      delete newPage.pageId;

      writeSerializedPageJsonAndNotify(newPage, saveStatusSubject);

      // Redirect to a new page once Save As completed (plus a small delay).
      saveStatusSubject.filter(
          function(event) {
            return event.status === 'saved';
          }
        ).
        pluck('id').
        delay(150). // Extra delay so the user can visually register the 'saved' message.
        subscribe(function(newSavedPageId) {
          $window.location.href = '/view/{0}'.format(newSavedPageId);
        });

      return saveStatusSubject.filter(
          function(event) {
            // Never tell the client we're back to idle.
            // UX wants the page to remain stuck in "Saved"
            // until the redirect kicks in.
            return event.status !== 'idle';
          }
        );
    };


    //TODO consider extending register() to take a selector, too.
    FlyoutService.register('save-button', function() {
      if (currentPageSaveEvents.value.status === 'failed') {
        return '<div class="flyout-title">An error occurred</div><div>Please contact Socrata Support</div>';
      } else if (currentPageSaveEvents.value.status === 'idle') {
        return $scope.hasChanges ? '<div class="flyout-title">Click to save your changes</div>'
                                 : '<div class="flyout-title">No changes to be saved</div>';
      }
    });

    FlyoutService.register('save-as-button', function() {
      return $scope.hasChanges ? '<div class="flyout-title">Click to save your changes as a new view</div>'
                               : '<div class="flyout-title">No changes to be saved</div>';
    });
    //
    // Since we have a flyout handler whose output depends on currentPageSaveEvents and $scope.hasChanges,
    // we need to poke the FlyoutService. We want the flyout to update immediately.
    currentPageSaveEvents.merge($scope.observe('hasChanges')).subscribe(function() {
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

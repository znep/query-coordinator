(function() {
  'use strict';

  // Such higher-order!
  function alphaCompareOnProperty(property) {
    return function(a, b) {
      if (a[property] < b[property]) {
        return -1;
      }
      if (a[property] > b[property]) {
        return 1;
      }
      return 0;
    }
  }

  function initDownload($scope, page, WindowState, FlyoutService, ServerConfig) {
    // The CSV download url
    $scope.bindObservable('datasetCSVDownloadURL',
      page.observe('dataset').map(function(dataset) {
        if (dataset && dataset.hasOwnProperty('id')) {
          return '/api/views/{0}/rows.csv?accessType=DOWNLOAD'.format(dataset.id);
        } else {
          return '#';
        }
      }));

    // Download menu
    $scope.showDownloadButton = ServerConfig.get('enablePngDownloadUi');
    WindowState.closeDialogEventObservable.filter(function(e) {
      return $scope.downloadOpened &&
        // Don't double-handle toggling downloadOpened
        !$(e.target).closest('.download-menu').length;
    }).subscribe(function() {
      $scope.$apply(function(e) {
        $scope.downloadOpened = false;
      });
    });

    $scope.chooserMode = {show: false};

    $scope.onDownloadClick = function(event) {
      // Clicking the 'Cancel' button
      if ($(event.target).hasClass('download-menu') &&
          $scope.chooserMode.show && !$scope.editMode) {
        $scope.chooserMode.show = false;
      } else {
        // Otherwise, toggle the dialog
        $scope.downloadOpened = !$scope.downloadOpened;
      }
    };

    FlyoutService.register('download-menu-item-disabled', _.constant(
      '<div class="flyout-title">' +
      'Please save the page in order to export a visualization as image' +
      '</div>'
    ));
  }

  function CardsViewController($scope, $location, $log, $window, $q, AngularRxExtensions, SortedTileLayout, Filter, PageDataService, UserSession, CardTypeMapping, FlyoutService, page, Card, WindowState, ServerConfig) {

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
      if (!date) {
        return '';
      }
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

    initDownload($scope, page, WindowState, FlyoutService, ServerConfig);

    /*******************************
    * Filters and the where clause *
    *******************************/

    var allCardsFilters = page.observe('activeFilters');

    $scope.bindObservable('globalWhereClauseFragment', page.observe('computedWhereClauseFragment'));

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

    $scope.clearAllFilters = function() {
      _.each($scope.page.getCurrentValue('cards'), function(card) {
        if (!_.isEmpty(card.getCurrentValue('activeFilters'))) {
          card.set('activeFilters', []);
        }
      });
    };

    var flyoutContent = $("<div class='flyout-title'>Click to reset all filters</div>");
    FlyoutService.register('clear-all-filters-button',
                           _.constant(flyoutContent));


    /************************
    * Add new card behavior *
    ************************/

    var datasetColumns = Rx.Observable.combineLatest(
      page.observe('dataset').observeOnLatest('columns'),
      page.observe('cards'),
      function(columns, cards) {

        var datasetColumns = [];
        var hasAvailableCards = false;

        var sortedColumns = _.values(columns).
          filter(function(column) {
            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            return column.name.substring(0, 2).match(/\:[\_A-Za-z0-9]/) === null &&
                   column.physicalDatatype !== '*';
          }).
          sort(function(a, b) {
            return a.name > b.name;
          });

        var sortedCards = cards.
          filter(function(card) {
            return card.fieldName !== '*'; 
          }).
          sort(function(a, b) {
            return a.fieldName > b.fieldName
          });

        var i = 0;
        var j = 0;
        var available = false;
        var availableCardCount = sortedColumns.length;
        var availableColumns = [];
        var alreadyOnPageColumns = [];
        var visualizationUnsupportedColumns = [];

        for (i = 0; i < sortedColumns.length; i++) {

          available = true;

          for (j = 0; j < sortedCards.length; j++) {
            if (sortedColumns[i].name === sortedCards[j].fieldName) {
              available = false;
              availableCardCount--;
            }
          }

          sortedColumns[i].available = available;

          if (CardTypeMapping.visualizationSupportedForColumn(sortedColumns[i])) {
            if (available) {
              availableColumns.push(sortedColumns[i]);
            } else {
              alreadyOnPageColumns.push(sortedColumns[i]);
            }
          } else {
            visualizationUnsupportedColumns.push(sortedColumns[i]);
          }

        }

        return {
          available: availableColumns.sort(alphaCompareOnProperty('title')),
          alreadyOnPage: alreadyOnPageColumns.sort(alphaCompareOnProperty('title')),
          visualizationUnsupporetd: visualizationUnsupportedColumns.sort(alphaCompareOnProperty('title'))
        };

      });

    $scope.bindObservable('datasetColumns', datasetColumns);
    $scope.bindObservable('hasAllCards', datasetColumns.map(function(columns) {
      return columns.available.length === 0;
    }));


    /***************************
    * View/edit cards behavior *
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
    var hasChangesObservable = Rx.Observable.merge(
      page.observePropertyChangesRecursively().map(_.constant(true)),
      currentPageSaveEvents.filter(function(event) { return event.status === 'saved'; }).map(_.constant(false))
    );
    $scope.bindObservable(
      'hasChanges',
      hasChangesObservable
    );
    $scope.emitEventsFromObservable('page:dirtied', hasChangesObservable.filter(_.identity));

    function notifyUserOfSaveProgress(savePromise, publishTo) {
      var savedMessagePersistenceMsec = 3000;
      var failureMessagePersistenceMsec = 8000;
      var pretendSaveTakesAtLeastThisLongMsec = 300;

      publishTo.onNext({ status: 'saving' });

      // Desired behavior is to jump out of edit mode immediately upon hitting save.
      $scope.editMode = false;

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
        try {
          var serializedBlob = $.extend(
            page.serialize(),
            { pageId: page.id }
          );
          var savePromise = PageDataService.save(serializedBlob, page.id);
        } catch (exception) {
          // If the serialization failed, reject the promise.
          // Don't just error out immediately, because we still
          // want to notify the user below.
          $log.error('Serialization failed on save', exception);
          var savePromise = $q.reject(exception);
        }
        notifyUserOfSaveProgress(savePromise, currentPageSaveEvents);
      }
    };

    $scope.savePageAs = function(name, description) {
      var saveStatusSubject = new Rx.BehaviorSubject();

      try {
        var newPageSerializedBlob = _.extend(page.serialize(), {
          name: name,
          description: description
        });
        // PageDataService looks at whether or not pageId is set on the blob.
        // If it's set, it will do a regular save. We want it to save a new page.
        delete newPageSerializedBlob.pageId;
        var savePromise = PageDataService.save(newPageSerializedBlob);
      } catch (exception) {
        // If the serialization failed, reject the promise.
        // Don't just error out immediately, because we still
        // want to notify the user below.
        $log.error('Serialization failed on save as', exception);
        var savePromise = $q.reject(exception);
      }

      notifyUserOfSaveProgress(savePromise, saveStatusSubject);

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

      return saveStatusSubject.
        bufferWithCount(2, 1). // Buffers of 2 in length, but overlapping by 1.
        filter(
          function(lastTwoEvents) {
            var previousEvent = lastTwoEvents[0];
            var currentEvent = lastTwoEvents[1];
            // UX wants the page to remain stuck in "Saved"
            // until the redirect kicks in. However we also want the user
            // to be able to retry on failure. So, filter out only
            // idle states that were not immediately preceded by failed
            // states.
            if (currentEvent.status === 'idle') {
              return previousEvent.status === 'failed';
            } else {
              return true;
            }
          }
        ).
        pluck(1); // We're done with the buffer - only care about the current event.
    };


    //TODO consider extending register() to take a selector, too.
    //TODO The controller shouldn't know about this magical target inside save-button!
    //     There needs to be significant refactoring though to make this right:
    //     1- Make flyouts capable of registering on trees, not individual elements.
    //     2- Make refreshing the flyout on data changes more automatic.
    //BIG FAT NOTE: This handler deals with _all_ save buttons. This includes the Save button
    //in the toolbar, and also the Save button in the Save As dialog. We need to check that this
    //is _our_ save button.
    FlyoutService.register('save-button-flyout-target', function(element) {
      if ($(element).closest('.save-this-page').length == 0) { return undefined; }
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

    // Since we have a flyout handler whose output depends on currentPageSaveEvents and $scope.hasChanges,
    // we need to poke the FlyoutService. We want the flyout to update immediately.
    currentPageSaveEvents.merge($scope.observe('hasChanges')).subscribe(function() {
      FlyoutService.refreshFlyout();
    });


    // Flyout for the 'customize' button, for when it's disabled.
    FlyoutService.register('cards-edit-disabled', function() {
      return '<div class="flyout-title">' + [
        'Customizing while a card is expanding',
        'is coming soon. For now, collapse the',
        'expanded card to customize.'].join('<br/>') +
        '</div>';
    });

    FlyoutService.register('clear-all-filters-button', function() {
      return '<div class="flyout-title">Click to reset all filters</div>';
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

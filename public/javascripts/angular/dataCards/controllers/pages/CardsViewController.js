(function() {
  'use strict';

  // Endpoints for the link back to the dataset page for the source dataset
  var MIGRATION_ENDPOINT = '/api/migrations/{0}';
  var OBE_DATASET_PAGE = '/d/{0}';

  function initDownload($scope, page, obeIdObservable, WindowState, ServerConfig) {
    // The CSV download url
    $scope.bindObservable(
      'datasetCSVDownloadURL',
      Rx.Observable.combineLatest(
        obeIdObservable.startWith(null),
        page.observe('dataset').filter(_.isObject),
        function(obeId, dataset) {
          var url = $.baseUrl();
          url.searchParams.set('accessType', 'DOWNLOAD');

          if (obeId) {
            url.pathname = '/api/views/{0}/rows.csv'.format(obeId);
            url.searchParams.set('bom', true);
          } else if (dataset.hasOwnProperty('id')) {
            url.pathname = '/api/views/{0}/rows.csv'.format(dataset.id);
          } else {
            return '#';
          }
          return url.href;
        }
      )
    );

    // Download menu
    $scope.showDownloadButton = ServerConfig.get('enablePngDownloadUi');
    WindowState.closeDialogEventObservable.filter(function(e) {
      return $scope.downloadOpened &&
        // Don't double-handle toggling downloadOpened
        !$(e.target).closest('.download-menu').length;
    }).
    takeUntil($scope.eventToObservable('$destroy')).
    subscribe(function() {
      $scope.$apply(function() {
        $scope.downloadOpened = false;
      });
    });

    $scope.chooserMode = {show: false};

    $scope.$on('exit-export-card-visualization-mode', function() {
      $scope.chooserMode.show = false;
    });

    $scope.onDownloadClick = function(event) {
      if (!$scope.editMode) {
        // Clicking the 'Cancel' button
        if ($(event.target).hasClass('download-menu') && $scope.chooserMode.show) {
          $scope.chooserMode.show = false;
        } else {
          // Otherwise, toggle the dialog
          $scope.downloadOpened = !$scope.downloadOpened;
        }
      }
    };
  }

  function initManageLens($scope, page) {

    var pageIsPublicObservable = page.observe('permissions').
      filter(_.isObject).
      map(_.property('isPublic'));

    var datasetIsPublicObservable = page.observe('dataset.permissions').
      filter(_.isObject).
      map(_.property('isPublic')).
      // Default to true, so the warning icon doesn't appear before the actual metadata is fetched
      startWith(true);

    var pagePermissionsObservable = pageIsPublicObservable.
      map(
        function(isPublic) {
          return isPublic ? 'public' : 'private';
        }
      );

    $scope.bindObservable('pageIsPublic', pageIsPublicObservable);
    $scope.bindObservable('datasetIsPublic', datasetIsPublicObservable);
    $scope.bindObservable('pagePermissions', pagePermissionsObservable);

    $scope.manageLensState = {
      show: false
    };
  }

  var VALIDATION_ERROR_STRINGS = {
    name: {
      minLength: 'Please enter a title',
      maxLength: 'Your title is too long',
      required: 'Please enter a title'
    }
  };
  /**
   * Binds the writable properties of page to the scope, such that changes to the scope will
   * propagate to the page model.
   *
   * @param {angular.scope} $scope - the angular scope.
   * @param {Page} page - the page Model.
   */
  function bindWritableProperties($scope, page) {
    $scope.writablePage = {
      warnings: {}
    };
    page.observe('name').filter(_.isString).subscribe(function(name) {
      $scope.safeApply(function() {
        $scope.writablePage.name = $.trim(name);
        if (name.length > 255) {
          $scope.writablePage.warnings.name = [VALIDATION_ERROR_STRINGS.name.maxLength];
        } else if ($scope.writablePage.warnings.name) {
          delete $scope.writablePage.warnings.name;
        }
      });
    });
    $scope.observe('writablePage.name').filter(_.isString).subscribe(function(name) {
      page.set('name', $.trim(name));
    });
    page.observe('description').filter(_.isString).subscribe(function(description) {
      $scope.safeApply(function() {
        $scope.writablePage.description = $.trim(description);
      });
    });
    $scope.observe('writablePage.description').filter(_.isString).subscribe(function(description) {
      page.set('description', $.trim(description));
    });
  }

  function CardsViewController(
    $scope,
    $log,
    $q,
    AngularRxExtensions,
    Filter,
    PageDataService,
    UserSessionService,
    FlyoutService,
    WindowOperations,
    page,
    WindowState,
    ServerConfig,
    $http,
    Schemas,
    PageHelpersService,
    DeviceService
  ) {

    AngularRxExtensions.install($scope);

    bindWritableProperties($scope, page);

    /*************************
    * General metadata stuff *
    *************************/

    $scope.page = page;
    $scope.showOtherViewsButton = ServerConfig.get('enableDataLensOtherViews');

    var pageNameSequence = page.observe('name').filter(_.isPresent);
    $scope.bindObservable('pageName', pageNameSequence);
    $scope.bindObservable('pageDescription', page.observe('description'));

    $scope.bindObservable('dataset', page.observe('dataset'));
    $scope.bindObservable('datasetPages', page.observe('dataset.pages'));
    $scope.bindObservable('aggregation', page.observe('aggregation'));
    $scope.bindObservable('dynamicTitle', PageHelpersService.dynamicAggregationTitle(page));
    $scope.bindObservable('sourceDatasetName', page.observe('dataset.name'));
    $scope.bindObservable('cardModels', page.observe('cards'));

    pageNameSequence.subscribe(function(pageName) {
      WindowOperations.setTitle('{0} | Socrata'.format(pageName));
    });

    // Map the nbe id to the obe id
    var obeIdObservable = page.observe('datasetId').
      filter(_.isPresent).
      // send the nbe datasetId to the migrations endpoint, to translate it into an obe id
      map(encodeURIComponent).
      map(_.bind(MIGRATION_ENDPOINT.format, MIGRATION_ENDPOINT)).
      flatMap(function(url) {
        return Rx.Observable.fromPromise($http.get(url));
      }).map(function(response) {
        return response.data.obeId;
      }).
      // Error means this isn't a migrated dataset. Just don't surface any obeId.
      catchException(Rx.Observable.never());

    $scope.bindObservable('sourceDatasetURL', obeIdObservable.map(function(obeId) {
      // Now construct the source dataset url from the obe id
      return OBE_DATASET_PAGE.format(obeId);
    }));

    /***************
    * User session *
    ***************/

    // Bind the current user to the scope, or null if no user is logged in or there was an error
    // fetching the current user.
    var currentUserSequence = UserSessionService.getCurrentUserObservable();
    $scope.bindObservable('currentUser', currentUserSequence);

    var isCurrentUserAdminOrPublisher =
      currentUserSequence.
      map(function(user) {
        var roleName = user.roleName;
        return _.contains(user.flags, 'admin') || roleName === 'administrator' || roleName === 'publisher';
      });

    var isCurrentUserOwnerOfDataset =
      page.
      observe('dataset').
      observeOnLatest('ownerId').
      combineLatest(
        currentUserSequence.pluck('id'),
        function(ownerId, userId) {
          return ownerId === userId;
        });

    $scope.bindObservable(
      'currentUserHasSaveRight',
      isCurrentUserAdminOrPublisher.
      combineLatest(isCurrentUserOwnerOfDataset, function(a, b) { return a || b; }).
      catchException(Rx.Observable.returnValue(false))
    );


    initDownload($scope, page, obeIdObservable, WindowState, ServerConfig);

    $scope.shouldShowManageLens = false;

    currentUserSequence.subscribe(
      function(currentUser) {

        var currentUserCanEditOthersDatasets =
          _.isPresent(currentUser) &&
          currentUser.hasOwnProperty('rights') &&
          currentUser.rights.indexOf('edit_others_datasets') > -1;

        var shouldShowManageLens =
          ServerConfig.get('dataLensTransitionState') === 'post_beta' &&
          currentUserCanEditOthersDatasets;

        if (shouldShowManageLens) {

          $scope.safeApply(function() {
            $scope.shouldShowManageLens = true;
            initManageLens($scope, page);
          });
        }
      }
    );

    /*******************************
    * Filters and the where clause *
    *******************************/

    var allCardsFilters = page.observe('activeFilters');

    $scope.bindObservable('globalWhereClauseFragment', page.observe('computedWhereClauseFragment'));

    var datasetColumnsObservable = page.observe('dataset.columns');

    var appliedFiltersForDisplayObservable = allCardsFilters.
      combineLatest(datasetColumnsObservable, function(filters, columns) {

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
          if (_.isPresent(filter.operand.trim())) {
            return filter.humanReadableOperand || filter.operand;
          } else {
            return 'blank';
          }
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

    });
    $scope.bindObservable('appliedFiltersForDisplay', appliedFiltersForDisplayObservable);

    $scope.clearAllFilters = function() {
      _.each($scope.page.getCurrentValue('cards'), function(card) {
        if (!_.isEmpty(card.getCurrentValue('activeFilters'))) {
          card.set('activeFilters', []);
        }
      });
    };


    /************************
    * Add new card behavior *
    ************************/

    var datasetColumns = Rx.Observable.combineLatest(
      page.observe('dataset'),
      datasetColumnsObservable,
      page.observe('cards'),
      function(dataset, columns, cards) {

        var sortedColumns = _.pairs(columns).
          map(function(columnPair) {
            return { fieldName: columnPair[0], column: columnPair[1] };
          }).
          filter(function(columnPair) {
            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            return columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/) === null &&
                   columnPair.column.physicalDatatype !== '*';
          }).
          sort(function(a, b) {
            // TODO: Don't we want to sort by column human name?
            return a.fieldName > b.fieldName;
          });

        var sortedCards = cards.
          filter(function(card) {
            return card.fieldName !== '*';
          }).
          sort(function(a, b) {
            return a.fieldName > b.fieldName;
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
            if (sortedColumns[i].fieldName === sortedCards[j].fieldName) {
              available = false;
              availableCardCount--;
            }
          }

          sortedColumns[i].available = available;

          if (sortedColumns[i].defaultCardType !== 'invalid') {
            if (available) {
              availableColumns.push(sortedColumns[i].fieldName);
            } else {
              alreadyOnPageColumns.push(sortedColumns[i].fieldName);
            }
          } else {
            visualizationUnsupportedColumns.push(sortedColumns[i].fieldName);
          }

        }

        return {
          available: availableColumns.sort(),
          alreadyOnPage: alreadyOnPageColumns.sort(),
          visualizationUnsupported: visualizationUnsupportedColumns.sort()
        };

      });

    $scope.bindObservable('datasetColumns', datasetColumns);


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

    // Track whether there've been changes to the page.
    // If we save the page, reset the dirtiness of the model.
    currentPageSaveEvents.filter(function(event) { return event.status === 'saved'; }).
      subscribe(_.bind(page.resetDirtied, page));
    $scope.bindObservable('hasChanges', page.observeDirtied());

    $scope.emitEventsFromObservable('page:dirtied', page.observeDirtied().filter(_.identity));

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
    }

    $scope.savePage = function() {
      var savePromise;
      if ($scope.hasChanges) {
        try {
          var serializedBlob = $.extend(
            page.serialize(),
            { pageId: page.id }
          );
          savePromise = PageDataService.save(serializedBlob, page.id);
        } catch (exception) {
          if (exception.validation) {
            $log.error('Validation errors', exception.validation);
            // There were validation errors. Display them, and don't do any progress things.
            $scope.writablePage.warnings = Schemas.getStringsForErrors(
              exception.validation,
              VALIDATION_ERROR_STRINGS
            );
            return false;
          }

          // If the serialization failed, reject the promise.
          // Don't just error out immediately, because we still
          // want to notify the user below.
          $log.error('Serialization failed on save', exception);
          savePromise = $q.reject(exception);
        }
        notifyUserOfSaveProgress(savePromise, currentPageSaveEvents);
      }
    };

    $scope.savePageAs = function(name, description) {
      var saveStatusSubject = new Rx.BehaviorSubject();
      var savePromise;

      try {
        var newPageSerializedBlob = _.extend(page.serialize(), {
          name: name,
          description: description
        });
        // PageDataService looks at whether or not pageId is set on the blob.
        // If it's set, it will do a regular save. We want it to save a new page.
        delete newPageSerializedBlob.pageId;
        savePromise = PageDataService.save(newPageSerializedBlob);
      } catch (exception) {
        // If the serialization failed, reject the promise.
        // Don't just error out immediately, because we still
        // want to notify the user below.
        $log.error('Serialization failed on save as', exception);
        savePromise = $q.reject(exception);
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
          var url = $.baseUrl('/view/{0}'.format(newSavedPageId));
          WindowOperations.navigateTo(url.href);
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

    FlyoutService.register(
      'edit-page-warning',
      function() {
        if ($scope.writablePage.warnings && $scope.writablePage.warnings.name) {
          return $scope.writablePage.warnings.name.join('\n');
        } else {
          return '';
        }
      },
      $scope.eventToObservable('$destroy')
    );


    /**
     * Revert changes behavior.
     */
    $scope.revertInitiated = false;

    $scope.revertPage = function() {
      if ($scope.hasChanges) {
        $scope.revertInitiated = true;
        document.location.href = document.location.href;
      }
    };


    /**
     * Some modal dialogs.
     */

    $scope.allVisualizableColumnsVisualized = false;

    datasetColumns.subscribe(function(columns) {
      $scope.allVisualizableColumnsVisualized = (columns.available.length === 0);
    });

    // This is an object, so that we can pass it to child scopes, and they can control the
    // visibility of the customize modal.
    $scope.addCardState = {
      'cardSize': null,
      'show': false
    };
    $scope.$on('add-card-with-size', function(e, cardSize) {
      if (!$scope.allVisualizableColumnsVisualized) {
        $scope.addCardState.cardSize = cardSize;
        $scope.addCardState.show = true;
      }
    });

    $scope.customizeState = {
      'cardModel': null,
      'show': false
    };
    $scope.$on('customize-card-with-model', function(e, cardModel) {
      $scope.customizeState.cardModel = cardModel;
      $scope.customizeState.show = true;
    });

    $scope.$on('delete-card-with-model', function(e, cardModel) {
      $scope.page.set('cards', _.without($scope.cardModels, cardModel));
    });

    var mobileWarningClosed = (/(^|;)\s*mobileWarningClosed=/).test(document.cookie);
    var isMobile = DeviceService.isMobile();

    $scope.mobileWarningState = {
      'show': isMobile && !mobileWarningClosed
    };

    $scope.$watch('mobileWarningState.show', function(newValue) {
      if (newValue === false) {
        document.cookie = 'mobileWarningClosed=1';
      }
    });

    // Set up flyout handlers.

    FlyoutService.register(
      'download-menu-item-disabled-text',
      _.constant(
        '<div class="flyout-title">' +
          'Please save the page in order to download a visualization as an image' +
        '</div>'
      ),
      $scope.eventToObservable('$destroy')
    );

    //TODO consider extending register() to take a selector, too.
    //TODO The controller shouldn't know about this magical target inside save-button!
    //     There needs to be significant refactoring though to make this right:
    //     1- Make flyouts capable of registering on trees, not individual elements.
    //     2- Make refreshing the flyout on data changes more automatic.
    //BIG FAT NOTE: This handler deals with _all_ save buttons. This includes the Save button
    //in the toolbar, and also the Save button in the Save As dialog. We need to check that this
    //is _our_ save button.
    FlyoutService.register(
      'save-button-flyout-target',
      function(element) {

        if ($(element).closest('.save-this-page').length === 0) {
          return undefined;
        }

        if (currentPageSaveEvents.value.status === 'failed') {

          return '<div class="flyout-title">An error occurred</div><div>Please contact Socrata Support</div>';

        } else if (currentPageSaveEvents.value.status === 'idle') {

          return $scope.hasChanges ?
            '<div class="flyout-title">Click to save your changes</div>' :
            '<div class="flyout-title">No changes to be saved</div>';
        }
      },
      $scope.eventToObservable('$destroy')
    );

    FlyoutService.register(
      'save-as-button',
      function() {

        return $scope.hasChanges ?
          '<div class="flyout-title">Click to save your changes as a new page</div>' :
          '<div class="flyout-title">No changes to be saved</div>';
      },
      $scope.eventToObservable('$destroy')
    );

    FlyoutService.register(
      'clear-all-filters-button',
      function() {

        return '<div class="flyout-title">Click to reset all filters</div>';
      },
      $scope.eventToObservable('$destroy')
    );

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
      var $apiUrlDisplay = $('#api-url-display');
      $apiUrlDisplay.off('mousedown');
      $apiUrlDisplay.off('mousemove');
      $apiUrlDisplay.off('scroll');
      $apiUrlDisplay.off('mouseup');
      $apiUrlDisplay.off('blur');
    });

  }

  angular.
    module('dataCards.controllers').
      controller('CardsViewController', CardsViewController);

})();

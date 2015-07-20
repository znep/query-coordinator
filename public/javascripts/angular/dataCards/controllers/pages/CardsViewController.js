(function() {
  'use strict';

  // Endpoints for the link back to the dataset page for the source dataset
  var MIGRATION_ENDPOINT = '/api/migrations/{0}';
  var OBE_DATASET_PAGE = '/d/{0}';

  function initDownload($scope, page, obeIdObservable, WindowState, ServerConfig) {
    // The CSV download url
    $scope.$bindObservable(
      'datasetCSVDownloadURL',
      Rx.Observable.combineLatest(
        obeIdObservable.startWith(null),
        page.observe('dataset').filter(_.isObject),
        function(obeId, dataset) {
          var downloadOverride = dataset.getCurrentValue('downloadOverride');
          if (downloadOverride) {
            return downloadOverride;
          } else {
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
    takeUntil($scope.$destroyAsObservable()).
    subscribe(function() {
      $scope.$apply(function() {
        $scope.downloadOpened = false;
      });
    });

    // Close png export with escape
    WindowState.escapeKeyObservable.filter(function(e) {
      return $scope.chooserMode.show === true;
    }).
      takeUntil($scope.$destroyAsObservable()).
      subscribe(function() {
        $scope.$apply(function() {
          $scope.chooserMode.show = false;
        });
      });

    $scope.chooserMode = { show: false };

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

    $scope.$bindObservable('pageIsPublic', pageIsPublicObservable);
    $scope.$bindObservable('datasetIsPublic', datasetIsPublicObservable);
    $scope.$bindObservable('pagePermissions', pagePermissionsObservable);

    $scope.manageLensState = {
      show: false
    };
  }

  var VALIDATION_ERROR_STRINGS;

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
      $scope.$safeApply(function() {
        $scope.writablePage.name = name;

        // If the trimmed name is greater than 255, display a max length warning.
        if ($.trim(name).length > 255) {
          $scope.writablePage.warnings.name = [VALIDATION_ERROR_STRINGS.name.maxLength];

        // Else, if a warning exists and our name isn't empty, remove the warning.
        } else if ($scope.writablePage.warnings.name && !_.isEmpty(name)) {
          delete $scope.writablePage.warnings.name;
        }
      });
    });

    $scope.$observe('writablePage.name').filter(_.isString).subscribe(function(name) {
      page.set('name', name);
    });

    page.observe('description').filter(_.isString).subscribe(function(description) {
      $scope.$safeApply(function() {
        $scope.writablePage.description = $.trim(description);
      });
    });

    $scope.$observe('writablePage.description').filter(_.isString).subscribe(function(description) {
      page.set('description', $.trim(description));
    });
  }

  function CardsViewController(
    $scope,
    $log,
    $q,
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
    DeviceService,
    I18n,
    FormatService,
    Constants
  ) {

    VALIDATION_ERROR_STRINGS = {
      name: {
        minLength: I18n.metadata.validationErrorMinLength,
        maxLength: I18n.metadata.validationErrorMaxLength,
        required: I18n.metadata.validationErrorRequired
      }
    };

    bindWritableProperties($scope, page, I18n);

    /*************************
    * General metadata stuff *
    *************************/

    $scope.page = page;
    $scope.showOtherViewsButton = ServerConfig.get('enableDataLensOtherViews');
    $scope.pageHeaderEnabled = ServerConfig.get('showNewuxPageHeader');

    var pageNameSequence = page.observe('name').filter(_.isPresent);
    $scope.$bindObservable('pageName', pageNameSequence);
    $scope.$bindObservable('pageDescription', page.observe('description'));

    $scope.$bindObservable('dataset', page.observe('dataset'));
    $scope.$bindObservable('datasetPages', page.observe('dataset.pages'));
    $scope.$bindObservable('aggregation', page.observe('aggregation'));
    $scope.$bindObservable('dynamicTitle', PageHelpersService.dynamicAggregationTitle(page));
    $scope.$bindObservable('sourceDatasetName', page.observe('dataset.name'));
    $scope.$bindObservable('cardModels', page.observe('cards'));

    $scope.$bindObservable('isEphemeral', page.observe('id').map(_.isUndefined));

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

    $scope.$bindObservable('sourceDatasetURL', obeIdObservable.map(function(obeId) {
      // Now construct the source dataset url from the obe id
      return OBE_DATASET_PAGE.format(obeId);
    }));

    /***************
    * User session *
    ***************/

    // Bind the current user to the scope, or null if no user is logged in or there was an error
    // fetching the current user.
    var currentUserSequence = UserSessionService.getCurrentUserObservable();
    $scope.$bindObservable('currentUser', currentUserSequence);

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

    $scope.$bindObservable(
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

          $scope.$safeApply(function() {
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

    $scope.maxOperandLength = Constants.MAX_OPERAND_LENGTH;
    $scope.$bindObservable('globalWhereClauseFragment', page.observe('computedWhereClauseFragment'));

    var datasetColumnsObservable = page.observe('dataset.columns');

    var appliedFiltersForDisplayObservable = allCardsFilters.
      combineLatest(datasetColumnsObservable, function(pageFilters, columns) {

        function humanReadableOperator(filter) {
          if (filter instanceof Filter.BinaryOperatorFilter) {
            if (filter.operator === '=') {
              return I18n.filter.is;
            } else {
              throw new Error('Only the "=" filter is currently supported.');
            }
          } else if (filter instanceof Filter.TimeRangeFilter) {
            return I18n.filter.is;
          } else if (filter instanceof Filter.ValueRangeFilter) {
            return I18n.filter.is;
          } else if (filter instanceof Filter.IsNullFilter) {
            if (filter.isNull) {
              return I18n.filter.is;
            } else {
              return I18n.filter.isNot;
            }
          } else {
            throw new Error('Cannot apply filter of unsupported type "' + filter + '".');
          }
        }

        function humanReadableOperand(filter) {
          if (filter instanceof Filter.BinaryOperatorFilter) {
            if (_.isPresent(filter.operand.toString().trim())) {
              return filter.humanReadableOperand || filter.operand;
            } else {
              return I18n.filter.blank;
            }
          } else if (filter instanceof Filter.IsNullFilter) {
            return I18n.filter.blank;
          } else if (filter instanceof Filter.TimeRangeFilter) {
            var format = 'YYYY MMMM DD';
            return I18n.t('filter.dateRange',
              moment(filter.start).format(format),
              moment(filter.end).format(format)
            );
          } else if (filter instanceof Filter.ValueRangeFilter) {
            return I18n.t('filter.valueRange',
              FormatService.formatNumber(filter.start),
              FormatService.formatNumber(filter.end)
            );
          } else {
            throw new Error('Cannot apply filter of unsupported type "' + filter + '".');
          }
        }

        return _.reduce(pageFilters, function(accumulator, cardFilterInfo) {
          if ($.isPresent(cardFilterInfo.filters)) {
            if (cardFilterInfo.filters.length > 1) {
              $log.warn('Cannot apply multiple filters to a single card.');
            }
            var filter = _.first(cardFilterInfo.filters);
            accumulator.push({
              column: columns[cardFilterInfo.fieldName],
              operator: humanReadableOperator(filter),
              operand: humanReadableOperand(filter)
            });
          }
          return accumulator;
        }, []);

      });
    $scope.$bindObservable('appliedFiltersForDisplay', appliedFiltersForDisplayObservable);

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
            return {
              fieldName: columnPair[0],
              columnInfo: columnPair[1]
            };
          }).
          filter(function(columnPair) {

            // We need to ignore 'system' fieldNames that begin with ':' but
            // retain computed column fieldNames, which (somewhat inconveniently)
            // begin with ':@'.
            return _.isNull(columnPair.fieldName.substring(0, 2).match(/\:[\_A-Za-z0-9]/)) &&
                   columnPair.columnInfo.physicalDatatype !== '*';
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

        var available = false;
        var availableCardCount = sortedColumns.length;
        var availableColumns = [];
        var visualizationUnsupportedColumns = [];

        _.forEach(sortedColumns, function(column) {

          if (column.defaultCardType === 'invalid') {
            visualizationUnsupportedColumns.push(column.fieldName);

          // CORE-4645: Do not allow subColumns to be available as cards to add
          } else if (!column.columnInfo.isSubcolumn) {
            availableColumns.push(column.fieldName);
          }
        });

        return {
          available: availableColumns.sort(),
          visualizationUnsupported: visualizationUnsupportedColumns.sort()
        };

      });

    $scope.$bindObservable('datasetColumns', datasetColumns);


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
    $scope.$bindObservable('saveStatus', currentPageSaveEvents.pluck('status'));

    // Track whether there've been changes to the page.
    // If we save the page, reset the dirtiness of the model.
    currentPageSaveEvents.filter(function(event) { return event.status === 'saved'; }).
      subscribe(_.bind(page.resetDirtied, page));
    $scope.$bindObservable('hasChanges', page.observeDirtied());

    $scope.$emitEventsFromObservable('page:dirtied', page.observeDirtied().filter(_.identity));

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
      if ($scope.isEphemeral) {
        return $scope.savePageAs(
          $.trim(page.getCurrentValue('name')),
          $.trim(page.getCurrentValue('description'))
        );
      }

      var savePromise;
      if ($scope.hasChanges) {
        try {

          // Trim the name only on save.
          var trimmedPageName = $.trim(page.getCurrentValue('name'));
          page.set('name', trimmedPageName);

          var serializedBlob = $.extend(
            page.serialize(),
            {
              pageId: page.id
            }
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
          name: $.trim(name),
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

    var destroy$ = $scope.$destroyAsObservable();

    FlyoutService.register({
      selector: '.edit-page-warning',
      render: function() {
        if ($scope.writablePage.warnings && $scope.writablePage.warnings.name) {
          return $scope.writablePage.warnings.name.join('\n');
        } else {
          return '';
        }
      },
      destroySignal: destroy$
    });


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

    FlyoutService.register({
      selector: '.download-menu-item-disabled-text',
      render: _.constant(
        '<div class="flyout-title">{0}</div>'.
          format(I18n.metadata.visualizationAsImageDisabledFlyout)
      ),
      destroySignal: destroy$
    });

    FlyoutService.register({
      selector: '.save-this-page .save-button',
      render: function() {
        var buttonStatus = currentPageSaveEvents.value.status;

        var idleTitle;
        if ($scope.isEphemeral) {
          idleTitle = I18n.saveAs.flyoutIdle;
        } else if ($scope.hasChanges) {
          idleTitle = I18n.saveButton.flyoutIdle;
        } else {
          idleTitle = I18n.saveButton.flyoutNoChanges;
        }

        var flyoutContent = {
          title: {
            failed: I18n.saveButton.flyoutFailedTitle,
            idle: idleTitle,
            saving: I18n.saveButton.saving,
            saved: I18n.saveButton.saved
          },
          body: {
            failed: I18n.saveButton.flyoutFailedBody,
            idle: '',
            saving: '',
            saved: ''
          }
        };

        return '<div class="flyout-title">{0}</div><div>{1}</div>'.format(
          flyoutContent.title[buttonStatus],
          flyoutContent.body[buttonStatus]
        );
      },
      destroySignal: destroy$
    });

    FlyoutService.register({
      selector: '.customize-bar .save-as-button',
      render: function() {
        var flyoutTitle = $scope.hasChanges ?
          I18n.saveAs.flyoutIdle :
          I18n.saveAs.flyoutNoChanges;

        return '<div class="flyout-title">{0}</div>'.format(flyoutTitle);
      },
      destroySignal: destroy$
    });

    FlyoutService.register({
      selector: '.clear-all-filters-button',
      render: function() {

        return '<div class="flyout-title">{0}</div>'.
          format(I18n.quickFilterBar.clearAllFlyout);
      },
      destroySignal: destroy$
    });

    // Since we have a flyout handler whose output depends on currentPageSaveEvents and $scope.hasChanges,
    // we need to poke the FlyoutService. We want the flyout to update immediately.
    currentPageSaveEvents.merge($scope.$observe('hasChanges')).subscribe(function() {
      FlyoutService.refreshFlyout();
    });

    /******************************************
    * Clean up if/when the scope is destroyed *
    ******************************************/

    destroy$.subscribe(function() {
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

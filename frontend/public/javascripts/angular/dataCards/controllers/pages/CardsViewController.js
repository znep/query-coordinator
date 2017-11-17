function initDownload($scope, WindowState) {

  // Close png export with escape
  WindowState.escapeKey$.filter(function() {
    return $scope.chooserMode.show === true;
  }).
    takeUntil($scope.$destroyAsObservable()).
    subscribe(function() {
      $scope.$apply(function() {
        $scope.chooserMode.show = false;
      });
    });

  // Unsets chooser mode on init and whenever completion is signaled.
  var clearChooserMode = function() {
    $scope.chooserMode = { show: false };

    // NOTE: I don't really like having this event, but I feel like it's
    // preferable to plumbing the chooserMode object itself. Once the original
    // Download dropdown is gone, we should reevaluate the way that such
    // communication happens between components.
    $scope.$broadcast('exit-chooser-mode');
  };
  $scope.$on('exit-export-card-visualization-mode', clearChooserMode);
  clearChooserMode();

  // Activates chooser mode in an event-based manner, allowing this mode to be
  // triggered by child directives.
  $scope.$on('enter-export-card-visualization-mode', function() {
    $scope.chooserMode = { show: true };
  });
}

function initManageLens($scope, page) {

  var pageIsPublic$ = page.observe('permissions').
    filter(_.isObject).
    map(_.property('isPublic'));

  var datasetIsPublic$ = page.observe('dataset.permissions').
    filter(_.isObject).
    map(_.property('isPublic')).
    // Default to true, so the warning icon doesn't appear before the actual metadata is fetched
    startWith(true);

  var pagePermissions$ = pageIsPublic$.
    map(
      function(isPublic) {
        return isPublic ? 'public' : 'private';
      }
    );

  $scope.$bindObservable('pageIsPublic', pageIsPublic$);
  $scope.$bindObservable('datasetIsPublic', datasetIsPublic$);
  $scope.$bindObservable('pagePermissions', pagePermissions$);

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

module.exports = function CardsViewController(
  $log,
  $q,
  $scope,
  $rootScope,
  $window,
  Filter,
  PageDataService,
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
  PluralizeService,
  Constants,
  UserRights,
  ViewRights,
  rx) {
  const Rx = rx;

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
  $scope.siteChromeEnabled = ServerConfig.get('siteChromeEnabled');
  $scope.pageHeaderEnabled = !$scope.siteChromeEnabled;
  $scope.$bindObservable('hideFromCatalog', page.observe('hideFromCatalog'));
  $scope.$bindObservable('hideFromDataJson', page.observe('hideFromDataJson'));
  $scope.$bindObservable('isEphemeral', page.observe('id').map(_.negate(_.isPresent)));
  $scope.$bindObservable('dataset', page.observe('dataset'));

  var cardModelsObservable = page.observe('cards');
  var cardCountObservable = cardModelsObservable.map(function(models) {
    return _.reject(models, function(model) {
      return model.fieldName === '*';
    }).length;
  });
  $scope.$bindObservable('cardModels', cardModelsObservable);
  $scope.$bindObservable('cardCount', cardCountObservable);
  $scope.$bindObservable('expandedCard', page.observe('hasExpandedCard').map(function() {
    var cards = page.getCurrentValue('cards');
    return _.find(cards, function(card) {
      return card.getCurrentValue('expanded');
    });
  }));

  /***************
  * User session *
  ***************/

  var currentUser$ = Rx.Observable.returnValue($window.currentUser);

  var isCurrentUserDomainUser$ =
    currentUser$.
    map(function(user) {
      return _.get(user, 'rights.length', 0) > 0;
    });

  $scope.$bindObservable('currentUserHasRights', isCurrentUserDomainUser$);

  var currentUserCanEditOthersDatasets$ =
    currentUser$.
    map(function(user) {
      return _.includes(user.flags, 'admin') ||
             _.includes(user.rights, 'edit_others_datasets');
    });

  var userCanManageView$ = $scope.isEphemeral ?
    Rx.Observable.returnValue(false) :
    page.observe('rights').map(function(rights) {
      return _.some(rights, function(right) {
        return right === ViewRights.UPDATE_VIEW || right === ViewRights.GRANT;
      });
    });

  var isCurrentUserOwnerOfDataset$ =
    page.
    observe('dataset').
    observeOnLatest('ownerId').
    combineLatest(
      currentUser$.pluck('id'),
      function(ownerId, userId) {
        return ownerId === userId;
      });

  var currentUserHasSaveRight$ = userCanManageView$.
    combineLatest(
      isCurrentUserOwnerOfDataset$,
      currentUserCanEditOthersDatasets$,
      function(a, b, c) { return a || b || c; }).
    catchException(Rx.Observable.returnValue(false));

  $scope.$bindObservable('currentUserHasSaveRight', currentUserHasSaveRight$);

  var currentUserHasProvenanceRight$ =
    currentUser$.
    map(function(user) {
      return _.includes(_.get(user, 'rights', []), UserRights.MANAGE_PROVENANCE);
    });

  var shouldDisplayCustomizeBar$ = currentUser$.map(_.isPresent);

  $scope.$bindObservable('currentUserHasProvenanceRight', currentUserHasProvenanceRight$);
  $scope.$bindObservable('shouldDisplayCustomizeBar', shouldDisplayCustomizeBar$);

  initDownload($scope, WindowState);

  $scope.$bindObservable('shouldShowManageLens', userCanManageView$);
  initManageLens($scope, page);

  // CORE-7419: Hide provenance toggle if user doesn't have rights
  // or enable_data_lens_provenance feature flag is disabled
  $scope.showProvenanceSection = $scope.currentUserHasProvenanceRight &&
    ServerConfig.get('enable_data_lens_provenance');

  shouldDisplayCustomizeBar$.subscribe(function(hasCustomizeBar) {
    $('body').toggleClass('with-customize-bar', hasCustomizeBar);
  });

  /*******************************
  * Filters and the where clause *
  *******************************/

  $scope.$bindObservable('globalWhereClauseFragment', page.observe('computedWhereClauseFragment'));

  /***************************
  * View/edit cards behavior *
  ***************************/

  $scope.editMode = false;
  $scope.$watch('editMode', function() {
    // Ephemeral mode doesn't change, but it has an effect on certain
    // subsets of UI behavior in combination with edit mode.
    $scope.nonEphemeralEditMode = $scope.editMode && !$scope.isEphemeral;
  });

  // Global save events. Elements in this stream are objects
  // with a status key set to one of only:
  // * 'idle': Initial and resting state.
  // * 'saving': A save was started.
  // * 'saved': A save was successfully completed.
  // * 'failed': A save failed to complete.
  //
  // If the status is 'saved', there must be an additional
  // key of 'id' set to the saved page's ID.
  var currentPageSaveEvents$ = new Rx.BehaviorSubject({ status: 'idle' });

  // Bind save status related things so the UI reflects them.
  $scope.$bindObservable('saveStatus', currentPageSaveEvents$.pluck('status'));

  // Track whether there've been changes to the page.
  // If we save the page, reset the dirtiness of the model.
  currentPageSaveEvents$.filter(function(event) { return event.status === 'saved'; }).
    subscribe(_.bind(page.resetDirtied, page));
  $scope.$bindObservable('hasChanges', page.observeDirtied());

  var shouldEnableSave$ = Rx.Observable.combineLatest(
    userCanManageView$,
    page.observeDirtied(),
    function(hasRight, hasChanges) {
      return hasRight && hasChanges;
    });
  $scope.$bindObservable('shouldEnableSave', shouldEnableSave$);

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
      notifyUserOfSaveProgress(savePromise, currentPageSaveEvents$);
    }
  };

  $scope.savePageAs = function(name, description, hidden, provenance) {
    var saveStatus$ = new Rx.BehaviorSubject();
    var savePromise;

    try {
      var newPageSerializedBlob = _.extend(page.serialize(), {
        name: $.trim(name),
        description: description,
        provenance: provenance,
        hideFromCatalog: hidden,
        hideFromDataJson: hidden
      });

      newPageSerializedBlob.parentLensId = newPageSerializedBlob.pageId;

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

    notifyUserOfSaveProgress(savePromise, saveStatus$);

    // Redirect to a new page once Save As completed (plus a small delay).
    saveStatus$.filter(
        function(event) {
          return event.status === 'saved';
        }
      ).
      pluck('id').
      delay(150). // Extra delay so the user can visually register the 'saved' message.
      subscribe(function(newSavedPageId) {
        var url = $.baseUrl(`/view/${newSavedPageId}`);
        WindowOperations.navigateTo(url.href);
      });

    return saveStatus$.
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
      // reload the page (TODO: explore `location.reload()`)
      $window.document.location.href = $window.document.location.href;
    }
  };


  /**
   * Some modal dialogs.
   */

  // This is an object, so that we can pass it to child scopes, and they can control the
  // visibility of the customize modal.
  $scope.addCardState = {
    cardSize: null,
    show: false
  };

  $scope.$on('add-card-with-size', function(e, cardSize) {
    $scope.addCardState.cardSize = cardSize;
    $scope.addCardState.show = true;
  });

  $scope.customizeState = {
    cardModel: null,
    show: false
  };
  $scope.$on('customize-card-with-model', function(e, cardModel) {
    $scope.customizeState.cardModel = cardModel;
    $scope.customizeState.show = true;
  });

  // Handle the event emitted by the Remove All Cards button and delegate
  // to each card so that we exercise the existing card deletion path.
  $scope.$on('delete-all-cards', function() {
    $scope.$broadcast('delete-card-with-model-delegate');
  });

  $scope.$on('delete-card-with-model', function(e, cardModel) {
    $scope.page.set('cards', _.without($scope.page.getCurrentValue('cards'), cardModel));
  });

  var mobileWarningClosed = (/(^|;)\s*mobileWarningClosed=/).test($window.document.cookie);
  var isMobile = DeviceService.isMobile();

  $scope.mobileWarningState = {
    show: isMobile && !mobileWarningClosed
  };

  $scope.$watch('mobileWarningState.show', function(newValue) {
    if (newValue === false) {
      $window.document.cookie = 'mobileWarningClosed=1';
    }
  });

  // Set up flyout handlers.

  FlyoutService.register({
    selector: '.save-this-page .save-button',
    render: function() {
      var buttonStatus = currentPageSaveEvents$.value.status;

      var idleTitle;
      if ($scope.isEphemeral) {
        idleTitle = I18n.saveAs.flyoutIdle;
      } else if ($scope.hasChanges) {
        if (!$scope.shouldEnableSave) {
          idleTitle = I18n.saveButton.flyoutNoEditPermission;
        } else {
          idleTitle = I18n.saveButton.flyoutIdle;
        }
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

      return `<div class="flyout-title">${flyoutContent.title[buttonStatus]}</div><div>${flyoutContent.body[buttonStatus]}</div>`;
    },
    destroySignal: destroy$
  });

  FlyoutService.register({
    selector: '.customize-bar .save-as-button',
    render: function() {
      var flyoutTitle = $scope.isEphemeral ? I18n.saveAs.flyoutEphemeral : I18n.saveAs.flyoutIdle;
      return `<div class="flyout-title">${flyoutTitle}</div>`;
    },
    destroySignal: destroy$
  });

  // Since we have a flyout handler whose output depends on currentPageSaveEvents$ and $scope.hasChanges,
  // we need to poke the FlyoutService. We want the flyout to update immediately.
  currentPageSaveEvents$.merge($scope.$observe('hasChanges')).subscribe(function() {
    FlyoutService.refreshFlyout();
  });

  /**************************
  * Image preview capturing *
  **************************/
  if ($window._phantom) {
    $log.info('Running in phantomjs');
    if (_.isFunction($window.callPhantom)) {
      // Sequence of render:complete events.
      var renderComplete$ = $rootScope.$eventToObservable('render:complete');

      // Sequence of true/false representing whether or not all images on
      // the page are complete.
      var imagesComplete$ = Rx.Observable.timer(100, 100).map(function() {
        // NOTE! The complete property has bugs in Firefox. Fortunately,
        // this should only be running in PhantomJS, which has no problems
        // here.
        return _.every($('img'), 'complete');
      });

      // Sequence containing a count of all the cards to be rendered
      var cardCount$ = cardModelsObservable.map(_.size);

      cardCount$.subscribe(function(count) {
        // Sequence like imagesComplete$, but only begins after the correct number of renderComplete$ have been emitted.
        var imagesCompleteAfterRenderComplete$ = renderComplete$.
          take(count).
          ignoreElements().
          concat(imagesComplete$);

        // Tell Phantom we're ready, once we get a renderComplete$ AND all images are loaded.
        imagesCompleteAfterRenderComplete$.
          delay(10000).
          first(_.identity).
          subscribe(function() {
            $log.info('Render complete.');
            $window.callPhantom('snapshotReady');
          });
      });
    } else {
      $log.info('window.callPhantom not present, skipping image capture');
    }
  }

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
};

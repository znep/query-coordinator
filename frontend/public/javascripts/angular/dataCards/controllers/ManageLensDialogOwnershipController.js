function stringifySuggestionObject(suggestion) {
  return `${suggestion.displayName} (${suggestion.email})`;
}

module.exports = function ManageLensDialogOwnershipController(
  $scope,
  $document,
  UserSessionService,
  UserSearchService,
  UserRights,
  Constants,
  I18n,
  http,
  rx) {
  const Rx = rx;

  var self = this;
  var SUGGESTION_LIMIT = Constants.MAX_NUMBER_OF_SUGGESTIONS;

  // This function provides a description of the entity making the request to the http() service.
  // The requester object is expected present in the config options passed to http(), and it is expected
  // that the requester object expose a requesterLabel function that returns the descriptive string.
  self.requesterLabel = function() {
    return 'ManageLensDialogOwnershipController';
  };

  // determine whether the current user is allowed to access this control
  // and whether the necessary service for owner change is available
  $scope.isUserSearchAvailable = true;
  var callCoreForUser = true;
  var isUserPermitted$ = UserSessionService.hasRight$(UserRights.CHOWN_DATASETS, callCoreForUser);
  var isUserSearchAvailable$ = $scope.$observe('isUserSearchAvailable');
  var hasPermission$ = Rx.Observable.combineLatest(
    isUserPermitted$,
    isUserSearchAvailable$,
    function(isUserPermitted, isUserSearchAvailable) {
      return isUserPermitted && isUserSearchAvailable;
    }
  );
  $scope.$bindObservable('hasPermission', hasPermission$);

  // Observe non-error changes to the input text.
  var suggestionInput$ = $scope.$observe('ownerInput').filter(function(input) {
    return input !== I18n.manageLensDialog.ownership.ownerUnavailable;
  });

  // Map input text changes to UserSearchService requests.
  var suggestionsRequests$ = hasPermission$.
    filter(_.identity).
    flatMapLatest(suggestionInput$).
    filter(_.isPresent).
    debounce(300, Rx.Scheduler.timeout).
    map(function(inputValue) {
      if ($scope.hasPermission) {
        return UserSearchService.results$(inputValue);
      }
    }).
    merge(
      // Clear out any suggestions if the user clears the input box.
      // This prevents old suggestions from coming up when the user then
      // types things back into the box.
      suggestionInput$.
        filter(function(value) { return !_.isPresent(value); }).
        map(_.constant(Rx.Observable.returnValue([])))
    ).share();

  // Get the list of users from the latest UserSearchService results.
  var suggestionObjects$ = suggestionsRequests$.switchLatest().
    map(function(suggestions) {
      return _.filter(suggestions, function(suggestion) {
        return _.filter(suggestion.displayName, $scope.ownerInput);
      }).sort();
    });

  // Generate the list of user names and emails for autocomplete.
  var suggestions$ = suggestionObjects$.map(function(suggestions) {
    return _.map(suggestions, stringifySuggestionObject);
  });

  // Count the number of results returned.
  var numberOfSuggestions$ = suggestions$.map(function(suggestions) {
    return suggestions ? suggestions.length : 0;
  }).startWith(0);

  // Convert the number of results returned into textual feedback.
  var suggestionsStatus$ = numberOfSuggestions$.
    map(function(numberOfSuggestions) {
      if (numberOfSuggestions === 0) {
        return I18n.suggestionToolPanel.noSuggestions;
      }
      if (numberOfSuggestions <= SUGGESTION_LIMIT && numberOfSuggestions > 0) {
        if (numberOfSuggestions === 1) {
          return I18n.suggestionToolPanel.onlySuggestion;
        } else {
          return I18n.t('suggestionToolPanel.allSuggestions', numberOfSuggestions);
        }
      }
      if (numberOfSuggestions > SUGGESTION_LIMIT) {
        return I18n.t('suggestionToolPanel.maxSuggestions', SUGGESTION_LIMIT);
      }
    });

  // Gate the appearance of the loading spinner and text.
  var suggestionsLoading$ = suggestionInput$.
    filter(_.isPresent).
    map(_.constant(true)).
    merge(suggestionsRequests$.switchLatest().map(_.constant(false)));

  // Control whether the list of results should appear, based on
  // user activity and input field state.
  var hasInput$ = suggestionInput$.map(_.isPresent).startWith(false);

  var ENTER_KEYCODE = 13;
  var userTypedInInput$ = Rx.Observable.fromEvent($('.ownership-input')[0], 'keydown').
    filter(function(event) {
      return event.keyCode !== ENTER_KEYCODE;
    });

  var userClickedInInput$ = Rx.Observable.fromEvent($('.ownership-input')[0], 'click');

  var userMadeSelection$ = $scope.$eventToObservable('intractableList:selectedItem');

  var userClickedBeyondSuggestionUI$ = Rx.Observable.fromEvent($document, 'click').
    filter(function(event) {
      var target = $(event.target);
      var isWithinInputField = target.closest('.ownership .ownership-input').length;
      var isWithinSuggestions = target.closest('.ownership .results.suggestion-tool-panel').length;
      return !isWithinInputField && !isWithinSuggestions;
    });

  var suggestionShowActions$ = Rx.Observable.merge(
    hasInput$.risingEdge().filter(function() {
      return $('.ownership-input').is(':focus');
    }),
    userTypedInInput$,
    userClickedInInput$.filter(function() {
      return $scope.ownerInput.trim().length;
    })
  );

  var suggestionHideActions$ = Rx.Observable.merge(
    hasInput$.fallingEdge(),
    userMadeSelection$,
    userClickedBeyondSuggestionUI$
  );

  var shouldShowOwnershipSuggestions$ = Rx.Observable.merge(
    suggestionShowActions$.map(_.constant(true)),
    suggestionHideActions$.map(_.constant(false))
  ).distinctUntilChanged();

  // Bind necessary observables to scope.
  $scope.$bindObservable('suggestions', suggestions$);
  $scope.$bindObservable('suggestionsStatus', suggestionsStatus$);
  $scope.$bindObservable('suggestionsLoading', suggestionsLoading$);
  $scope.$bindObservable('shouldShowOwnershipSuggestions', shouldShowOwnershipSuggestions$);

  // Call preventDefault on up/down arrow keys to prevent cursor from
  // moving to start/end of input (must use keydown event for weird
  // browser reasons).
  var UP_KEYCODE = 38;
  var DOWN_KEYCODE = 40;
  Rx.Observable.fromEvent($document, 'keydown').
    filter(function(event) {
      var isScrollKey = event.keyCode === UP_KEYCODE || event.keyCode === DOWN_KEYCODE;
      return $scope.shouldShowOwnershipSuggestions && isScrollKey;
    }).
    forEach(function(event) {
      event.preventDefault();
    });

  // save user selection for ownership and update hasChanges
  userMadeSelection$.withLatestFrom(
    suggestionsRequests$.switchLatest(),
    Array.prototype.constructor
  ).subscribe(function(eventWithSuggestions) {
    var selectionEvent = eventWithSuggestions[0];
    var suggestions = eventWithSuggestions[1];

    if (suggestions.length) {
      var nextOwner = _.find(suggestions, function(suggestion) {
        return stringifySuggestionObject(suggestion) === selectionEvent.additionalArguments[0];
      });

      $scope.ownerInput = nextOwner.displayName;
      $scope.showWarning = false;
      nextOwnerId = nextOwner.id;
      $scope.components.ownership.hasErrors = false;
    } else {
      $scope.showWarning = true;
      nextOwnerId = currentOwnerId;
      $scope.components.ownership.hasErrors = true;
    }

    $scope.components.ownership.hasChanges = nextOwnerId !== currentOwnerId;
  });

  // ensure that warning indicators reset while autocomplete is active
  suggestionsRequests$.switchLatest().subscribe(function(suggestions) {
    if (_.isNull(suggestions)) {
      disableInput();
    } else {
      $scope.showWarning = suggestions.length === 0;
    }
  });

  // write ownership info via plagiarize endpoint
  var save = function() {
    if ($scope.components.ownership.hasChanges) {
      var url = $.baseUrl(`/views/${$scope.page.id}`);
      url.searchParams.set('method', 'plagiarize');
      url.searchParams.set('userId', nextOwnerId);
      url.searchParams.set('accessType', 'WEBSITE');

      return http.put(url, null, { requester: self });
    }
  };

  // update lens owner on success
  var postSave = function() {
    $scope.page.set('ownerId', nextOwnerId);
  };

  // capture the original owner and initialize input field
  var currentOwnerId = $scope.page.getCurrentValue('ownerId');
  var nextOwnerId = currentOwnerId;
  $scope.ownerInput = $scope.page.getCurrentValue('ownerDisplayName');

  // initialize component structure
  $scope.components.ownership = {
    save: save,
    postSave: postSave,
    hasChanges: false,
    hasErrors: false
  };

  function disableInput() {
    $scope.isUserSearchAvailable = false;
    $scope.ownerInput = I18n.manageLensDialog.ownership.ownerUnavailable;
  }
};

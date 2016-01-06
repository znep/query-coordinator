var templateUrl = require('angular_templates/dataCards/searchCard.html');
const angular = require('angular');
function searchCard(CardDataService, ServerConfig, SoqlHelpers, Constants, ellipsifyFilter, rx) {
  const Rx = rx;

  function pluckEventArg(val) {
    return _.get(val, 'additionalArguments[0]');
  }

  function handleSampleData($scope, model, dataset$) {
    var sampleData$ = Rx.Observable.combineLatest(
      model.pluck('fieldName'),
      dataset$.pluck('id'),
      model.observeOnLatest('column.physicalDatatype'),
      model.observeOnLatest('page.baseSoqlFilter'),
      model.observeOnLatest('page.aggregation'),
      function(fieldName, datasetId, physicalDatatype, pageBaseSoqlFilter, pageAggregation) {
        if (_.contains(Constants.SUGGESTION_DISABLED_DATA_TYPES, physicalDatatype)) {
          return Rx.Observable.returnValue([]);
        } else {
          return Rx.Observable.fromPromise(CardDataService.getSampleData(fieldName, datasetId, pageBaseSoqlFilter, pageAggregation));
        }
      }
    ).switchLatest();

    var samples$ = sampleData$.
      flatMap(function(data) {
        return Rx.Observable.fromArray(data);
      }).
      take(2).
      map(function(value) {
        return ellipsifyFilter(value, Constants.MAX_SUGGESTION_LENGTH);
      });

    $scope.$bindObservable('sampleOne', samples$.take(1));
    $scope.$bindObservable('sampleTwo', samples$.skip(1).take(1));
  }

  return {
    restrict: 'E',
    scope: true,
    templateUrl: templateUrl,
    link: function($scope, element) {
      var model = $scope.$observe('model');
      var dataset$ = model.observeOnLatest('page.dataset');
      var fieldName$ = model.pluck('fieldName');
      var physicalDatatype$ = model.observeOnLatest('column.physicalDatatype');

      var invalidSearchInputSubject = new Rx.BehaviorSubject(false);
      var invalidSearchInput$ = invalidSearchInputSubject.distinctUntilChanged();
      var searchValue$ = $scope.$observe('search');
      var expanded$ = model.observeOnLatest('expanded');
      var rowInfo$ = $scope.$eventToObservable('rows:info').map(pluckEventArg);
      var hasRows$ = rowInfo$.pluck('hasRows').distinctUntilChanged();
      var rowCount$ = rowInfo$.pluck('filteredRowCount');
      var rowsLoaded$ = $scope.$eventToObservable('rows:loaded').map(pluckEventArg);
      var whereClause$ = $scope.$observe('whereClause');

      var selectedItem$ = $scope.$eventToObservable('suggestionToolPanel:selectedItem').
        map(pluckEventArg);

      // Observable that emits the current search term on submit
      var submitValue$ = Rx.Observable.fromEvent(element.find('form'), 'submit').
        withLatestFrom(searchValue$, function(event, searchValue) {
          return searchValue;
        }).
        filter($.isPresent).
        merge(selectedItem$);

      // Whenever a new value is submitted, clear the invalidSearch flag
      submitValue$.
        subscribe(function() {
          invalidSearchInputSubject.onNext(false);
        });

      // Observable that emits the loaded rows, clamped to total rows
      var clampedRowsLoaded$ = submitValue$.
        flatMap(function() {
          var scannedRowsLoaded$ = rowsLoaded$.
            scan(function(acc, val) {
              return (val > acc) ? val : acc;
            });

          return Rx.Observable.
            combineLatest(
              scannedRowsLoaded$,
              rowCount$,
              function(rowsLoaded, rowCount) {
                return (rowsLoaded > rowCount) ? rowCount : rowsLoaded;
              });
        }).
        startWith(0);

      // Observable that tracks if there is input
      var hasInput$ = searchValue$.
        map($.isPresent).
        startWith(false);

      // Observable that tracks if there is NO input
      var hasNoInput$ = hasInput$.
        map(function(val) { return !val; });

      // Whenever there is no input, clear the invalidSearch flag
      hasNoInput$.
        filter(_.identity).
        subscribe(function() {
          invalidSearchInputSubject.onNext(false);
        });

      // Observable that tracks if a search is active
      // Defined by if we have not cleared the input since the last submit
      var searchActive$ = Rx.Observable.merge(
        hasNoInput$.filter(_.identity).map(function() { return false; }),  // map "empty input" to false
        submitValue$.map(function() { return true; }) // map submits with values (i.e. search start) to true
      ).distinctUntilChanged();

      // On submit, if not expanded, then expand
      submitValue$.
        withLatestFrom(expanded$, function(submitValue, expanded) {
          return expanded;
        }).
        filter(function(value) { return !value; }).
        subscribe(function() {
          $scope.model.page.toggleExpanded($scope.model);
        });

      // Observable that emits the 'WHERE' clause to be forwarded to the table card visualization
      // Given a submit event when there is a search term input, map the search value to an observable
      // that combines it with the field name, checking if the datatype is a number or not, and creating
      // the appropriate 'WHERE' clause
      var searchWhere$ = submitValue$.
        merge(whereClause$).
        withLatestFrom(
          submitValue$,
          fieldName$,
          physicalDatatype$,
          whereClause$,
          function(signal, searchValue, fieldName, physicalDatatype, externalWhereClause) {
            var whereClause;
            if (_.contains(Constants.SUGGESTION_DISABLED_DATA_TYPES, physicalDatatype)) {
              var numericSearchValue = parseFloat(searchValue);
              if (_.isNaN(numericSearchValue)) {
                invalidSearchInputSubject.onNext(true);
              } else {
                whereClause = `${SoqlHelpers.formatFieldName(fieldName)} = ${numericSearchValue}`;
              }
            } else {
              whereClause = `${SoqlHelpers.formatFieldName(fieldName)} = "${searchValue}"`;
            }
            return _.isPresent(externalWhereClause) ?
              `${externalWhereClause} AND ${whereClause}` :
              whereClause;
          }).
          filter(_.isDefined);

      // When the card contracts, clear the invalid search flag
      expanded$.subscribe(function(val) {
        if (!val) {
          invalidSearchInputSubject.onNext(false);
        }
      });

      // Observable that emits whether to show the search results area
      var showResults$ = Rx.Observable.
        combineLatest(
          expanded$,
          searchActive$,
          invalidSearchInput$,
          function(expanded, searchActive, isInvalidSearch) {
            return expanded && searchActive && !isInvalidSearch;
          });

      // Observable that emits when the table has been rendered during a search
      var tableRendered$ = Rx.Observable.
        combineLatest(
          searchActive$,
          hasRows$,
          function(searchActive, hasRows) {
            return searchActive && hasRows;
          }).
        startWith(false);

      $scope.$on('suggestionToolPanel:selectedItem', function(event, selectedItem) {
        $scope.$safeApply(function() {
          $scope.search = selectedItem;
        });
      });

      // preventDefault on up/down arrow keys to prevent cursor from moving
      // to start/end of input (must use keydown event for weird browser
      // reasons).
      var UP_KEYCODE = 38;
      var DOWN_KEYCODE = 40;
      $scope.$eventToObservable('clearableInput:keydown').
        filter(function(event) {
          var keyCode = event.additionalArguments[0].keyCode;
          return keyCode === UP_KEYCODE || keyCode === DOWN_KEYCODE;
        }).
        forEach(function(event) {
          event.additionalArguments[0].preventDefault();
        });

      var SPACE_BAR_KEYCODE = 32;
      var userActionKeypress$ = $scope.$eventToObservable('clearableInput:keypress').
        filter(function(event) {
          var which = _.get(event, 'additionalArguments[0].which');
          return which > SPACE_BAR_KEYCODE;
        });

      var userClickedInClearableInput$ = $scope.$eventToObservable('clearableInput:click');

      var userActionsWhichShouldShowSuggestionPanel$ = Rx.Observable.merge(
        hasInput$.risingEdge(),
        userActionKeypress$,
        userClickedInClearableInput$.filter(function() {
          return _.isPresent($scope.searchValue);
        })
      );

      var clicksOutsideOfSuggestionUI$ = Rx.Observable.fromEvent($(document), 'click').
        takeUntil($scope.$destroyAsObservable(element)).
        filter(function(event) {
          var isEventFromBeyondSuggestionToolPanel = element.find('suggestion-tool-panel').find(event.target).length === 0;
          var isEventFromOutsideTheSearchInputField = element.find('clearable-input').find(event.target).length === 0;
          return isEventFromBeyondSuggestionToolPanel && isEventFromOutsideTheSearchInputField;
        });

      var clearableInputBlurTargetNotSuggestion$ = $scope.$eventToObservable('clearableInput:blur').
        filter(function(event) {
          // Only hide the suggestion panel if the blur target is not a suggestion.
          var newFocusTarget = _.get(event, 'additionalArguments[0].relatedTarget');
          if (_.isPresent(newFocusTarget)) {
            return $(newFocusTarget).closest(element).length > 0;
          } else {
            return false;
          }
        });

      var userActionsWhichShouldHideSuggestionPanel$ = Rx.Observable.merge(
        submitValue$,
        hasInput$.fallingEdge(),
        clearableInputBlurTargetNotSuggestion$,
        clicksOutsideOfSuggestionUI$
      );

      var shouldShowSuggestionPanel$;

      if (ServerConfig.get('enableSearchSuggestions')) {
        shouldShowSuggestionPanel$ = Rx.Observable.combineLatest(
          // Time-based observable for user actions which can trigger suggestions
          Rx.Observable.merge(
            userActionsWhichShouldShowSuggestionPanel$.map(_.constant(true)),
            userActionsWhichShouldHideSuggestionPanel$.map(_.constant(false))
          ).distinctUntilChanged(),
          // Metadata-based observable for datatypes which can trigger suggestions
          physicalDatatype$.map(function(physicalDatatype) {
            return !_.contains(Constants.SUGGESTION_DISABLED_DATA_TYPES, physicalDatatype);
          }),
          function(isActionTriggerForSuggestionPanel, isDatatypeCompatibleWithSuggestionPanel) {
            return isActionTriggerForSuggestionPanel && isDatatypeCompatibleWithSuggestionPanel;
          }
        );
      } else {
        shouldShowSuggestionPanel$ = Rx.Observable.returnValue(false);
      }

      $scope.$bindObservable('rowCount', clampedRowsLoaded$);
      $scope.$bindObservable('totalRowCount', rowCount$);
      $scope.$bindObservable('isInvalidSearch', invalidSearchInput$);
      $scope.$bindObservable('showResults', showResults$);
      $scope.$bindObservable('tableRendered', tableRendered$);
      $scope.$bindObservable('noResults', hasRows$.startWith(true));
      $scope.$bindObservable('searchWhere', searchWhere$);
      $scope.$bindObservable('fieldName', fieldName$);
      $scope.$bindObservable('searchValue', searchValue$);
      $scope.$bindObservable('physicalDatatype', physicalDatatype$);
      $scope.$bindObservable('dataset', dataset$);
      $scope.$bindObservable('shouldShowSuggestionPanel', shouldShowSuggestionPanel$);

      handleSampleData($scope, model, dataset$);
    }
  };
}

angular.
  module('dataCards.directives').
  directive('searchCard', searchCard);

(function() {
  'use strict';

  function CardVisualizationSearch(AngularRxExtensions, CardDataService, ServerConfig, SoqlHelpers) {

    function pluckEventArg(val) {
      return val.args[0];
    }

    function handleSampleData($scope, model, dataset) {
      var sampleDataObservable = Rx.Observable.combineLatest(
        model.pluck('fieldName'),
        dataset.pluck('id'),
        model.observeOnLatest('column.physicalDatatype'),
        model.observeOnLatest('page.baseSoqlFilter'),
        model.observeOnLatest('page.aggregation'),
        function(fieldName, datasetId, physicalDatatype, pageBaseSoqlFilter, pageAggregation) {
          if (physicalDatatype === 'number') {
            // CORE-5083: no samples for numeric columns
            return Rx.Observable.empty();
          } else {
            return Rx.Observable.fromPromise(CardDataService.getSampleData(fieldName, datasetId, pageBaseSoqlFilter, pageAggregation));
          }
        }
      ).switchLatest();
      var samplesObservable = sampleDataObservable.flatMap(function(data) {
        return Rx.Observable.fromArray(data);
      }).take(2);

      $scope.bindObservable('sampleOne', samplesObservable.take(1));
      $scope.bindObservable('sampleTwo', samplesObservable.skip(1).take(1));
    }

    return {
      restrict: 'E',
      scope: { 'model': '=', 'whereClause': '=' },
      templateUrl: '/angular_templates/dataCards/cardVisualizationSearch.html',
      link: function($scope, element) {

        AngularRxExtensions.install($scope);

        var model = $scope.observe('model');
        var dataset = model.observeOnLatest('page.dataset');
        var fieldNameObservable = model.pluck('fieldName');

        var invalidSearchInputSubject = new Rx.BehaviorSubject(false);
        var invalidSearchInputObservable = invalidSearchInputSubject.distinctUntilChanged();
        var searchValueObservable = $scope.observe('search');
        var expandedObservable = model.observeOnLatest('expanded');
        var rowInfoObservable = $scope.eventToObservable('rows:info').map(pluckEventArg);
        var hasRowsObservable = rowInfoObservable.pluck('hasRows').distinctUntilChanged();
        var rowCountObservable = rowInfoObservable.pluck('filteredRowCount');
        var rowsLoadedObservable = $scope.eventToObservable('rows:loaded').map(pluckEventArg);

        var selectedItemObservable = $scope.eventToObservable('suggestionToolPanel:selectedItem').
          map(function(event) {
            return event.args[0];
          });

        // Observable that emits the current search term on submit
        var submitValueObservable = Rx.Observable.fromEvent(element.find('form'), 'submit').
          map(function() {
            return $scope.search;
          }).
          filter($.isPresent).
          merge(selectedItemObservable);

        // Whenever a new value is submitted, clear the invalidSearch flag
        submitValueObservable.
          subscribe(function() {
            invalidSearchInputSubject.onNext(false);
          });

        // Observable that emits the loaded rows, clamped to total rows
        var clampedRowsLoadedObservable = submitValueObservable.
          flatMap(function() {
            var scannedRowsLoadedObservable = rowsLoadedObservable.
              scan(function(acc, val) {
                return (val > acc) ? val : acc;
              });

            return Rx.Observable.
              combineLatest(
                scannedRowsLoadedObservable,
                rowCountObservable,
                function(rowsLoaded, rowCount) {
                  return (rowsLoaded > rowCount) ? rowCount : rowsLoaded;
                });
          }).
          startWith(0);

        // Observable that tracks if there is input
        var hasInputObservable = searchValueObservable.
          map($.isPresent).
          startWith(false);

        // Observable that tracks if there is NO input
        var hasNoInputObservable = hasInputObservable.
          map(function(val) { return !val; });

        // Whenever there is no input, clear the invalidSearch flag
        hasNoInputObservable.
          filter(_.identity).
          subscribe(function() {
            invalidSearchInputSubject.onNext(false);
          });

        // Observable that tracks if a search is active
        // Defined by if we have not cleared the input since the last submit
        var searchActiveObservable = Rx.Observable.merge(
          hasNoInputObservable.filter(_.identity).map(function() { return false; }),  // map "empty input" to false
          submitValueObservable.map(function() { return true; }) // map submits with values (i.e. search start) to true
        ).distinctUntilChanged();

        // On submit, if not expanded, then expand
        submitValueObservable.
          flatMap(function() { return expandedObservable.take(1); }).
          filter(function(value) { return !value; }).
          subscribe(function() {
            $scope.model.page.toggleExpanded($scope.model);
          });

        // Observable that emits the 'WHERE' clause to be forwarded to the table card visualization
        // Given a submit event when there is a search term input, map the search value to an observable
        // that combines it with the field name, checking if the datatype is a number or not, and creating
        // the appropriate 'WHERE' clause
        var searchWhereObservable = submitValueObservable.
          flatMapLatest(function(searchValue) {
            return Rx.Observable.
              combineLatest(
                fieldNameObservable,
                model.observeOnLatest('column.physicalDatatype'),
                $scope.observe('whereClause'),
                function(fieldName, physicalDatatype, externalWhereClause) {
                  var whereClause;
                  if (physicalDatatype === 'number') {
                    var numericSearchValue = parseInt(searchValue, 10);
                    if (_.isNaN(numericSearchValue)) {
                      invalidSearchInputSubject.onNext(true);
                    } else {
                      whereClause = '{0} = {1}'.format(SoqlHelpers.formatFieldName(fieldName), numericSearchValue);
                    }
                  } else {
                    whereClause = '{0} = "{1}"'.format(SoqlHelpers.formatFieldName(fieldName), searchValue);
                  }
                  return _.isPresent(externalWhereClause) ?
                    '{0} AND {1}'.format(externalWhereClause, whereClause) :
                    whereClause;
                }).
                filter(_.isDefined);
          });

        // When the card contracts, clear the invalid search flag
        expandedObservable.subscribe(function(val) {
          if (!val) {
            invalidSearchInputSubject.onNext(false);
          }
        });

        // Observable that emits whether to show the search results area
        var showResultsObservable = Rx.Observable.
          combineLatest(
            expandedObservable,
            searchActiveObservable,
            invalidSearchInputObservable,
            function(expanded, searchActive, isInvalidSearch) {
              return expanded && searchActive && !isInvalidSearch;
            });

        // Observable that emits when the table has been rendered during a search
        var tableRenderedObservable = Rx.Observable.
          combineLatest(
            searchActiveObservable,
            hasRowsObservable,
            function(searchActive, hasRows) {
              return searchActive && hasRows;
            }).
          startWith(false);

        $scope.$on('suggestionToolPanel:selectedItem', function(event, selectedItem) {
          $scope.safeApply(function() {
            $scope.search = selectedItem;
          });
        });

        var SPACE_BAR_KEYCODE = 32;
        var userActionKeypressObservable = $scope.eventToObservable('clearableInput:keypress').
          filter(function(event) {
            var which = event.args[0].which;
            return which > SPACE_BAR_KEYCODE;
          });

        var userClickedInClearableInputObservable = $scope.eventToObservable('clearableInput:click');

        var userActionsWhichShouldShowSuggestionPanelObservable = Rx.Observable.merge(
          hasInputObservable.risingEdge(),
          userActionKeypressObservable,
          userClickedInClearableInputObservable.filter(function() {
            return _.isPresent($scope.searchValue);
          })
        );

        var clicksOutsideOfSuggestionUIObservable = Rx.Observable.fromEvent($(document), 'click').
          takeUntil($scope.observeDestroy(element)).
          filter(function(event) {
            var isEventFromBeyondSuggestionToolPanel = element.find('suggestion-tool-panel').find(event.target).length === 0;
            var isEventFromOutsideTheSearchInputField = element.find('clearable-input').find(event.target).length === 0;
            return isEventFromBeyondSuggestionToolPanel && isEventFromOutsideTheSearchInputField;
          });

        var clearableInputBlurTargetNotSuggestionObservable = $scope.eventToObservable('clearableInput:blur')
          .filter(function(event) {
            // Only hide the suggestion panel if the blur target is not a suggestion.
            var newFocusTarget = event.args[0].relatedTarget;
            if (_.isPresent(newFocusTarget)) {
              return $(newFocusTarget).closest(element).length > 0;
            } else {
              return false;
            }
          });

        var userActionsWhichShouldHideSuggestionPanelObservable = Rx.Observable.merge(
          submitValueObservable,
          hasInputObservable.fallingEdge(),
          clearableInputBlurTargetNotSuggestionObservable,
          clicksOutsideOfSuggestionUIObservable
        );

        var shouldShowSuggestionPanelObservable;

        if (ServerConfig.get('enableSearchSuggestions')) {
          shouldShowSuggestionPanelObservable = Rx.Observable.merge(
            userActionsWhichShouldShowSuggestionPanelObservable.map(_.constant(true)),
            userActionsWhichShouldHideSuggestionPanelObservable.map(_.constant(false))
          ).distinctUntilChanged();
        } else {
          shouldShowSuggestionPanelObservable = Rx.Observable.returnValue(false);
        }

        $scope.bindObservable('rowCount', clampedRowsLoadedObservable);
        $scope.bindObservable('totalRowCount', rowCountObservable);
        $scope.bindObservable('isInvalidSearch', invalidSearchInputObservable);
        $scope.bindObservable('showResults', showResultsObservable);
        $scope.bindObservable('tableRendered', tableRenderedObservable);
        $scope.bindObservable('noResults', hasRowsObservable.startWith(true));
        $scope.bindObservable('searchWhere', searchWhereObservable);
        $scope.bindObservable('fieldName', fieldNameObservable);
        $scope.bindObservable('searchValue', searchValueObservable);
        $scope.bindObservable('dataset', dataset);
        $scope.bindObservable('shouldShowSuggestionPanel', shouldShowSuggestionPanelObservable);

        handleSampleData($scope, model, dataset);
      }
    };
  }

  angular.module('dataCards.directives').directive('cardVisualizationSearch', CardVisualizationSearch);

})();

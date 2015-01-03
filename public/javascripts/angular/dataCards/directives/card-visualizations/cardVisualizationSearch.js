(function() {
  'use strict';

  function CardVisualizationSearch($compile, $http, $q, AngularRxExtensions, CardDataService, Filter) {

    function pluckEventArg(val) {
      return val.args[0];
    }

    function handleSampleData($scope, model, dataset) {
      var sampleDataObservable = Rx.Observable.combineLatest(
        model.pluck('fieldName'),
        dataset.pluck('id'),
        function(fieldName, datasetId) {
          return Rx.Observable.fromPromise(CardDataService.getSampleData(fieldName, datasetId));
        }
      ).switchLatest();
      var samplesObservable = sampleDataObservable.flatMap(function(data) {
        return Rx.Observable.fromArray(_.pluck(data, 'name'));
      }).take(2);

      $scope.bindObservable('sampleOne', samplesObservable.take(1));
      $scope.bindObservable('sampleTwo', samplesObservable.skip(1).take(1));
    }

    return {
      restrict: 'E',
      scope: { 'model': '=', 'whereClause': '=' },
      templateUrl: '/angular_templates/dataCards/cardVisualizationSearch.html',
      link: function($scope, element, attrs) {

        AngularRxExtensions.install($scope);

        var model = $scope.observe('model');
        var dataset = model.pluck('page').observeOnLatest('dataset');
        var fieldNameObservable = model.pluck('fieldName');

        var physicalDatatypeObservable = Rx.Observable.combineLatest(
          fieldNameObservable,
          dataset.observeOnLatest('columns'),
          function(fieldName, columns) {
            var column = columns[fieldName];
            return column.physicalDatatype;
          });

        var invalidSearchInputSubject = new Rx.BehaviorSubject(false);
        var invalidSearchInputObservable = invalidSearchInputSubject.distinctUntilChanged();
        var searchValueObservable = $scope.observe('search');
        var submitEventObservable = Rx.Observable.fromEvent(element.find('form'), 'submit');
        var expandedObservable = model.observeOnLatest('expanded');
        var rowInfoObservable = $scope.eventToObservable('rows:info').map(pluckEventArg);
        var hasRowsObservable = rowInfoObservable.pluck('hasRows').distinctUntilChanged();
        var rowCountObservable = rowInfoObservable.pluck('filteredRowCount');
        var rowsLoadedObservable = $scope.eventToObservable('rows:loaded').map(pluckEventArg);

        // Observable that emits the current search term when the card is expanded
        var expandedSearchValueObservable = Rx.Observable.
          combineLatest(
            expandedObservable,
            searchValueObservable,
            function(expanded, searchValue) {
              if (expanded) {
                return searchValue;
              }
            }).
          filter($.isPresent).
          distinctUntilChanged();

        // Observable that emits the current search term on submit
        var submitValueObservable = submitEventObservable.
          map(function() {
            return $scope.search;
          }).
          filter($.isPresent);

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
        submitEventObservable.
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
                physicalDatatypeObservable,
                function(fieldName, physicalDatatype) {
                  var whereClause;
                  if (physicalDatatype === 'number') {
                    var numericSearchValue = parseInt(searchValue, 10);
                    if (_.isNaN(numericSearchValue)) {
                      invalidSearchInputSubject.onNext(true);
                    } else {
                      whereClause = '{0} = {1}'.format(fieldName, numericSearchValue);
                    }
                  } else {
                    whereClause = '{0} = "{1}"'.format(fieldName, searchValue);
                  }
                  return whereClause;
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

        // Bind observables to scope
        $scope.bindObservable('rowCount', clampedRowsLoadedObservable);
        $scope.bindObservable('totalRowCount', rowCountObservable);
        $scope.bindObservable('isInvalidSearch', invalidSearchInputObservable);
        $scope.bindObservable('showResults', showResultsObservable);
        $scope.bindObservable('tableRendered', tableRenderedObservable);
        $scope.bindObservable('noResults', hasRowsObservable.startWith(true));
        $scope.bindObservable('searchWhere', searchWhereObservable);
        $scope.bindObservable('fieldName', fieldNameObservable);

        handleSampleData($scope, model, dataset);
      }
    };
  }

  angular.module('dataCards.directives').directive('cardVisualizationSearch', CardVisualizationSearch);

})();

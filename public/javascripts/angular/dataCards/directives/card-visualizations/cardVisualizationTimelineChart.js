angular.module('dataCards.directives').directive('cardVisualizationTimelineChart', function(AngularRxExtensions, CardDataService, Filter) {
  'use strict';

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationTimelineChart.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');
      var baseSoqlFilter = model.pluck('page').observeOnLatest('baseSoqlFilter');
      var dataRequests = new Rx.Subject();
      var dataResponses = new Rx.Subject();
      var unfilteredDataSequence = new Rx.Subject();
      var filteredDataSequence = new Rx.Subject();

      // Keep track of the number of requests that have been made and the number of
      // responses that have come back.
      // .scan() is necessary because the usual aggregation suspect reduce actually
      // will not execute over a sequence until it has been completed; scan is happy
      // to operate on active sequences.
      var dataRequestCount = dataRequests.scan(0, function(acc, x) { return acc + 1; });
      var dataResponseCount = dataResponses.scan(0, function(acc, x) { return acc + 1; });

      // If the number of requests is greater than the number of responses, we have
      // a request in progress and we should display the spinner.
      $scope.bindObservable('busy',
        Rx.Observable.combineLatest(
          dataRequestCount,
          dataResponseCount,
          function(requests, responses) {
            return requests === 0 || (requests > responses);
          }));

      // Remove the current timeline cards filter from the whereClause
      function stripWhereClause(whereClause) {
        var filter = $scope.model.getCurrentValue('activeFilters')[0];
        if (filter) {
          var whereFragment = filter.generateSoqlWhereFragment($scope.model.fieldName);
          return whereClause.
            replace(new RegExp('AND ' + whereFragment, 'gi'), '').
            replace(new RegExp(whereFragment + '( AND|)', 'gi'), '');
        } else {
          return whereClause;
        }
      }

      var precision = Rx.Observable.combineLatest(
        model.pluck('fieldName'),
        dataset,
        function(fieldName, dataset) {
          return Rx.Observable.fromPromise(CardDataService.
            getTimelineDomain(fieldName, dataset.id));
        }).switchLatest().map(function(domain) {
          var interval;
          if (moment(domain.start).add('years', 1).isAfter(domain.end)) {
            interval = 'DAY';
          } else if (moment(domain.start).add('years', 20).isAfter(domain.end)) {
            interval = 'MONTH';
          } else {
            interval = 'YEAR';
          }
          return interval;
        });

      var unfilteredData = Rx.Observable.subscribeLatest(
        model.pluck('fieldName'),
        dataset,
        baseSoqlFilter,
        precision,
        function(fieldName, dataset, whereClauseFragment, precision) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getTimelineData(fieldName, dataset.id, whereClauseFragment, precision);
          dataPromise.then(
            function(res) {
              // Ok
              unfilteredDataSequence.onNext(dataPromise);
              dataResponses.onNext(1);
            },
            function(err) {
              // Do nothing
            });
          return Rx.Observable.fromPromise(dataPromise);
        });

      var filteredData = Rx.Observable.subscribeLatest(
        model.pluck('fieldName'),
        dataset,
        $scope.observe('whereClause'),
        precision,
        function(fieldName, dataset, whereClauseFragment, precision) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getTimelineData(fieldName, dataset.id, stripWhereClause(whereClauseFragment), precision);
          dataPromise.then(
            function(res) {
              // Ok
              filteredDataSequence.onNext(dataPromise);
              dataResponses.onNext(1);
            },
            function(err) {
              // Do nothing
            });
          return Rx.Observable.fromPromise(dataPromise);
        });

      $scope.bindObservable('chartData', Rx.Observable.combineLatest(
        unfilteredDataSequence.switchLatest(),
        filteredDataSequence.switchLatest(),
        model.observeOnLatest('activeFilters'),
        function(unfilteredData, filteredData, filters) {
          // Joins filtered data and unfiltered data into an array of objects:
          // [
          //  { name: 'some_group_name', total: 1234, filtered: 192 },
          //  ...
          // ]
          // If we're unfiltered or the filtered data isn't defined for a particular name, the filtered field is undefined.
          var unfilteredAsHash = _.reduce(unfilteredData, function(acc, datum) {
            acc[datum.date] = datum.value;
            return acc;
          }, {});
          var filteredAsHash = _.reduce(filteredData, function(acc, datum) {
            acc[datum.date] = datum.value;
            return acc;
          }, {});

          return _.map(_.pluck(unfilteredData, 'date'), function(date) {
            return {
              date: date,
              total: unfilteredAsHash[date],
              filtered: filteredAsHash[date] || 0
            };
          });
        }));

      $scope.bindObservable('filterApplied', filteredDataSequence.map(function(filtered) {
        return filtered !== null;
      }));

      $scope.bindObservable('expanded', model.observeOnLatest('expanded'));

      $scope.bindObservable('precision', precision);

      $scope.bindObservable('filters', model.observeOnLatest('activeFilters'));
      $scope.bindObservable('rowDisplayUnit', dataset.observeOnLatest('rowDisplayUnit'));

      $scope.$on('timeline-chart:filter-cleared', function(event) {
        $scope.model.set('activeFilters', []);
      });

      $scope.$on('timeline-chart:filter-changed', function(event, range) {
        var filter = new Filter.TimeRangeFilter(range[0], range[1]);
        $scope.model.set('activeFilters', [filter]);
      });
    }
  };

});

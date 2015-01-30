(function() {
  'use strict';

  function cardVisualizationTimelineChart(AngularRxExtensions, CardDataService, Filter, TimelineChartVisualizationHelpers, $log) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationTimelineChart.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        var model = scope.observe('model');
        var dataset = model.observeOnLatest('page.dataset');
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
        var aggregationObservable = model.observeOnLatest('page.aggregation');
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

        var nonBaseFilterApplied;


        /*************************************
        * FIRST set up the 'busy' indicator. *
        *************************************/

        // If the number of requests is greater than the number of responses, we have
        // a request in progress and we should display the spinner.
        // SUPER IMPORTANT NOTE: Because of the way that RxJS works, we need to bind
        // this one here and not below with the other bound observables... so unfortunately
        // this code is location-dependent within the file.
        scope.bindObservable('busy',
          Rx.Observable.combineLatest(
            dataRequestCount,
            dataResponseCount,
            function(requests, responses) {
              return requests === 0 || (requests > responses);
            }
          )
        );


        /******************************************
        * THEN set up other observable sequences. *
        ******************************************/

        nonBaseFilterApplied = Rx.Observable.combineLatest(
          scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          }
        );

        // Since we need to be able to render the unfiltered values outside
        // of a timeline chart's current selection area, we need to 'filter'
        // those data outside the selection manually rather than using SoQL.
        // As a result, we need to make sure we never exclude any data that
        // belongs to the card making the request; this function will look
        // through a SoQL query string that is about to be used in a data
        // request and remove any where clauses that reference the fieldName
        // that corresponds to this instance of the visualization.
        function stripOwnVisualizationWhereClause(fieldName, whereClause) {

          var whereClauseComponents = whereClause.split(' ');
          var indexOfFieldName = whereClauseComponents.indexOf(fieldName);
          var i;
          var filteredWhereClause = [];

          for (i = 0; i < whereClauseComponents.length; i++) {
            if (i === indexOfFieldName) {
              if (i > 0 && whereClauseComponents[i - 1].toLowerCase() === 'and') {
                filteredWhereClause.pop();
              }
              // This is the number of 'words' in a timeline chart-generated
              // where clause:
              // "largechronometerreading_10 BETWEEN '1950-01-01T00:00:00' AND '1961-01-01T00:00:00'"
              i += 5;
              continue;
            }
            filteredWhereClause.push(whereClauseComponents[i]);
          }

          return filteredWhereClause.join(' ');

        }

        var reportInvalidTimelineDomain = _.once(
          function() {
            $log.error(
              [
                'Cannot render timeline chart with invalid domain (',
                'column fieldName: "',
                scope.model.fieldName,
                '").'
              ].join('')
            );
          }
        );

        var datasetPrecision = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(
              CardDataService.getTimelineDomain(fieldName, dataset.id)
            );
          }
        ).switchLatest().map(
          function(domain) {

            var precision;

            if (_.isUndefined(domain)) {
              reportInvalidTimelineDomain();
              return;
            }

            if (moment(domain.start).add('years', 1).isAfter(domain.end)) {
              precision = 'DAY';
            } else if (moment(domain.start).add('years', 20).isAfter(domain.end)) {
              precision = 'MONTH';
            } else {
              precision = 'YEAR';
            }

            return precision;

          }
        );

        var unfilteredData = Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          baseSoqlFilter,
          datasetPrecision,
          aggregationObservable,
          function(fieldName, dataset, whereClauseFragment, datasetPrecision, aggregationData) {

            if (_.isDefined(datasetPrecision)) {

              dataRequests.onNext(1);

              var dataPromise = CardDataService.getTimelineData(
                fieldName,
                dataset.id,
                whereClauseFragment,
                datasetPrecision,
                aggregationData
              );

              dataPromise.then(
                function(res) {
                  // Ok
                  unfilteredDataSequence.onNext(dataPromise);
                  dataResponses.onNext(1);
                },
                function(err) {
                  // Do nothing
                }
              );

              return Rx.Observable.fromPromise(dataPromise);

            }
          }
        );

        var filteredData = Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          scope.observe('whereClause'),
          nonBaseFilterApplied,
          datasetPrecision,
          aggregationObservable,
          function(fieldName, dataset, whereClauseFragment, nonBaseFilterApplied, datasetPrecision, aggregationData) {

            if (_.isDefined(datasetPrecision)) {

              dataRequests.onNext(1);

              var dataPromise = CardDataService.getTimelineData(
                fieldName,
                dataset.id,
                stripOwnVisualizationWhereClause(fieldName, whereClauseFragment),
                datasetPrecision,
                aggregationData
              );

              dataPromise.then(
                function(res) {
                  // Ok
                  filteredDataSequence.onNext(dataPromise);
                  dataResponses.onNext(1);
                },
                function(err) {
                  // Do nothing
                }
              );

              return Rx.Observable.fromPromise(dataPromise);
            }
          }

        );

        var chartDataSequence = Rx.Observable.combineLatest(
          unfilteredDataSequence.switchLatest(),
          filteredDataSequence.switchLatest(),
          model.observeOnLatest('activeFilters'),
          aggregationObservable,
          datasetPrecision,
          function(unfilteredData, filteredData, filters, aggregation, datasetPrecision) {
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

            return TimelineChartVisualizationHelpers.transformChartDataForRendering(
              _.map(_.pluck(unfilteredData, 'date'), function(date) {
                return {
                  date: date,
                  total: unfilteredAsHash[date],
                  filtered: filteredAsHash[date] || 0
                };
              }),
              aggregation,
              datasetPrecision
            );
          }
        );

        scope.bindObservable('chartData', chartDataSequence);

        scope.bindObservable('expanded', model.observeOnLatest('expanded'));

        scope.bindObservable('precision', datasetPrecision);

        scope.bindObservable('activeFilters', model.observeOnLatest('activeFilters'));

        scope.bindObservable('rowDisplayUnit', model.observeOnLatest('page.aggregation.unit'));


        // Handle filtering
        scope.$on('filter-timeline-chart',
          function(event, data) {
            if (data !== null) {
              var filter = new Filter.TimeRangeFilter(data.start, data.end);
              scope.model.set('activeFilters', [filter]);
            } else {
              scope.model.set('activeFilters', []);  
            }
          }
        );

      }

    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationTimelineChart', cardVisualizationTimelineChart);

})();

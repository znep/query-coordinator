(function() {
  'use strict';

  function cardVisualizationTimelineChart(AngularRxExtensions, CardDataService, Filter, TimelineChartVisualizationHelpers, $log, SoqlHelpers) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationTimelineChart.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        var modelSequence = scope.observe('model');
        var dataset = modelSequence.observeOnLatest('page.dataset').filter(_.isPresent);
        var baseSoqlFilter = modelSequence.observeOnLatest('page.baseSoqlFilter');
        var aggregationObservable = modelSequence.observeOnLatest('page.aggregation');
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


        /**
         * This used to take ~175ms because of the multiple maps and reduces.
         * It now takes ~7ms (and a little bit more memory than before).
         *
         * @param {Array} unfilteredData - The array of unfiltered data.
         * @param {Array} filteredData - The array of filtered data.
         *
         * @return {Array} An array containing the date, unfiltered and filtered
         *                 value for each datum.
         */
        function aggregateData(unfilteredData, filteredData) {

          var length = unfilteredData.length;
          var aggregatedData = [];
          var filteredValue = 0;
          var startAt = 0;

          for (var i = 0; i < length; i++) {

            if (unfilteredData[i].value === null) {

              filteredValue = null;

            } else {

              filteredValue = 0;

              // The 'filteredData' array may be smaller in size than 'unfilteredData'
              // so we need to match on dates.
              for (var j = startAt; j < filteredData.length; j++) {
                if (unfilteredData[i].date.isSame(filteredData[j].date)) {
                  filteredValue = filteredData[j].value;
                  startAt = j + 1;
                  break;
                }
              }

              filteredValue = (filteredValue === null) ? 0 : filteredValue;

            }

            aggregatedData.push({
              date: unfilteredData[i].date,
              total: unfilteredData[i].value,
              filtered: filteredValue
            });
          }

          return aggregatedData;

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
          modelSequence.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(
              CardDataService.getTimelineDomain(fieldName, dataset.id)
            );
          }
        ).switchLatest().map(
          function(domain) {
            var precision;

            if (_.isUndefined(domain) || domain.start === null || domain.end === null) {
              reportInvalidTimelineDomain();
              return;
            }

            // Moment objects are inherently mutable. Therefore, the .add()
            // call in the first condition will need to be accounted for in
            // the second condition. We're doing this instead of just cloning
            // the objects because moment.clone is surprisingly slow (something
            // like 40ms).
            if (domain.start.add('years', 1).isAfter(domain.end)) {
              precision = 'DAY';
            // We're actually checking for 20 years but have already added one
            // to the original domain start date in the if block above.
            } else if (domain.start.add('years', 19).isAfter(domain.end)) {
              precision = 'MONTH';
            } else {
              precision = 'YEAR';
            }

            return precision;

          }
        );

        var unfilteredData = Rx.Observable.subscribeLatest(
          modelSequence.pluck('fieldName'),
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
          modelSequence.pluck('fieldName'),
          dataset,
          scope.observe('whereClause'),
          nonBaseFilterApplied,
          datasetPrecision,
          aggregationObservable,
          modelSequence.observeOnLatest('activeFilters'),
          function(fieldName, dataset, whereClause, nonBaseFilterApplied, datasetPrecision, aggregationData, activeFilters) {

            if (_.isDefined(datasetPrecision)) {

              dataRequests.onNext(1);

              var dataPromise = CardDataService.getTimelineData(
                fieldName,
                dataset.id,
                SoqlHelpers.stripWhereClauseFragmentForFieldName(fieldName, whereClause, activeFilters),
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
          function(unfilteredData, filteredData) {
            return TimelineChartVisualizationHelpers.transformChartDataForRendering(
              aggregateData(unfilteredData, filteredData)
            );
          }
        );

        // We're deriving whether or not we can render the timeline chart based upon:
        // * whether precision is defined or not. The precision (i.e.
        //   'DAY', 'MONTH', etc.) is derived from the start/end date and BAD DATES
        //   cause us to be unable to render the timeline chart.
        // * whether the timespan of the data is more than zero (buckets don't make
        //   sense when they're zero in duration).
        var cannotRenderTimelineChart = Rx.Observable.combineLatest(
          datasetPrecision.map(_.isUndefined),
          chartDataSequence.startWith(undefined), // Because we never request data w/o datasetPrecision.
          function(badDates, chartData) {
            var durationIsZero = _.isPresent(chartData) &&
              moment.duration(chartData.maxDate - chartData.minDate) <= 0;

            if (badDates) {
              return { reason: 'badDates' };
            } else if (durationIsZero){
              return { reason: 'zeroTimeSpan' };
            } else {
              return false;
            }
          }
        );

        scope.bindObservable('chartData', chartDataSequence);
        scope.bindObservable('expanded', modelSequence.observeOnLatest('expanded'));
        scope.bindObservable('precision', datasetPrecision);
        scope.bindObservable('activeFilters', modelSequence.observeOnLatest('activeFilters'));
        scope.bindObservable('rowDisplayUnit', modelSequence.observeOnLatest('page.aggregation.unit'));
        scope.bindObservable('cannotRenderTimelineChart', cannotRenderTimelineChart);

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

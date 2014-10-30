angular.module('dataCards.directives').directive('cardVisualizationTimelineChart', function(AngularRxExtensions, CardDataService, Filter) {
  'use strict';

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
          }));


      /******************************************
      * THEN set up other observable sequences. *
      ******************************************/

      nonBaseFilterApplied = Rx.Observable.combineLatest(
          scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          });

      // Remove the current timeline cards filter from the whereClause
      function stripWhereClause(whereClause) {
        var filter = scope.model.getCurrentValue('activeFilters')[0];
        if (filter) {
          var whereFragment = filter.generateSoqlWhereFragment(scope.model.fieldName);
          return whereClause.
            replace(new RegExp('AND ' + whereFragment, 'gi'), '').
            replace(new RegExp(whereFragment + '( AND|)', 'gi'), '');
        } else {
          return whereClause;
        }
      }

      function transformChartDataForRendering(chartData) {

        var minDate = null;
        var maxDate = null;
        var minValue = Number.POSITIVE_INFINITY;
        var maxValue = Number.NEGATIVE_INFINITY;
        var meanValue;
        var offsets;
        var duration;
        var labelUnit;
        var breakCount;
        var breakSize;
        var i;
        var breaks;
        var offsets;

        var allValues = chartData.map(function(datum) {

          if (minDate === null) {
            minDate = datum.date;
          } else if (datum.date < minDate) {
            minDate = datum.date;
          }

          if (maxDate === null) {
            maxDate = datum.date;
          } else if (datum.date > maxDate) {
            maxDate = datum.date;
          }

          if (datum.total < minValue) {
            minValue = datum.total;
          }

          if (datum.total > maxValue) {
            maxValue = datum.total;
          }

          return {
            date: datum.date.toDate(),
            filtered: datum.filtered,
            unfiltered: datum.total
          }
        });

        minValue = Math.min(0, minValue);

        meanValue = (maxValue - minValue) / 2;

        // We receive individual rows from the back-end
        // but we want to display intelligent aggregates
        // on the chart. We do this by bucketing each
        // datum; in order to accomplish that we must first
        // derive the number of buckets and the  temporal
        // span of each one.
        duration = moment.duration(maxDate - minDate);

        if (duration <= 0) {
          throw new Error('Cannot transform timeline chart data for rendering: the time interval of the data is less than or equal to zero.');
        }

        // Note that we are intentionally wrapping minDate in
        // a new moment object in the tests below because
        // the .add() method is destructive... the actual
        // value of a non-wrapped minDate object after these
        // tests are made is more 22 years, 2 months after
        // the actual intended minDate.
        if (moment(minDate).add('months', 2).isAfter(maxDate)) {
          labelUnit = 'day';
          breakCount = Math.round(duration.asDays());
        } else if (moment(minDate).add('years', 2).isAfter(maxDate)) {
          labelUnit = 'month';
          breakCount = Math.round(duration.asMonths());
        } else if (moment(minDate).add('years', 20).isAfter(maxDate)) {
          labelUnit = 'year';
          breakCount = Math.round(duration.asYears());
        } else {
          labelUnit = 'decade';
          breakCount = Math.round(duration.asYears() / 10);
        }

        breakSize = duration.asMilliseconds() / breakCount;

        breaks = [minDate.toDate()];

        for (i = 1; i <= breakCount; i++) {
          breaks.push(moment(minDate).add((i * breakSize), 'milliseconds').toDate());
        }

        // Map each datum to the range [0 .. 1] so we can easily
        // determine which data to highlight when the mouse moves
        // across the chart.
        //_.each(allValues, function(value) {
        //  value.offset = moment.duration(value.date - minDate).asMilliseconds() /
        //                 duration.asMilliseconds();
        //});

        offsets = allValues.map(function(value) {
          return moment(value.date).diff(minDate) / duration.asMilliseconds();
        });

        return {
          minDate: minDate.toDate(),
          maxDate: maxDate.toDate(),
          offsets: offsets,
          minValue: minValue,
          meanValue: meanValue,
          maxValue: maxValue,
          values: allValues,
          labelUnit: labelUnit,
          breaks: breaks
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
        scope.observe('whereClause'),
        nonBaseFilterApplied,
        precision,
        function(fieldName, dataset, whereClauseFragment, nonBaseFilterApplied, precision) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getTimelineData(fieldName, dataset.id, whereClauseFragment, precision);
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

      scope.bindObservable('chartData', Rx.Observable.combineLatest(
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

          return transformChartDataForRendering(
            _.map(_.pluck(unfilteredData, 'date'), function(date) {
              return {
                date: date,
                total: unfilteredAsHash[date],
                filtered: filteredAsHash[date] || 0
              };
            })
          );
        }));



      scope.bindObservable('expanded', model.observeOnLatest('expanded'));

      scope.bindObservable('precision', precision);

      scope.bindObservable('activeFilters', model.observeOnLatest('activeFilters'));

      scope.bindObservable('pageIsFiltered', scope.observe('whereClause').
          map(function(whereClause) {
            return _.isPresent(stripWhereClause(whereClause));
          }));

      scope.bindObservable('rowDisplayUnit', dataset.observeOnLatest('rowDisplayUnit'));

      // Handle filtering
      scope.$on('filter-timeline-chart', function(event, data) {
        if (_.isEmpty(scope.model.getCurrentValue('activeFilters'))) {
          var filter = new Filter.TimeRangeFilter(moment(data.start), moment(data.end));
          console.log(filter);
          scope.model.set('activeFilters', [filter]);
        } else {
          scope.model.set('activeFilters', []);  
        }
      });


    }
  };

});

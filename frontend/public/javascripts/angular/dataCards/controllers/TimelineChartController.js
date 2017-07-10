module.exports = function TimelineChartController(
  $scope,
  CardDataService,
  ServerConfig,
  Filter,
  TimelineChartService,
  $log,
  DateHelpers,
  SoqlHelpers,
  rx) {
  const Rx = rx;

  var cardModel$ = $scope.$observe('model').filter(_.isPresent);
  var dataset$ = cardModel$.observeOnLatest('page.dataset').filter(_.isPresent);
  var baseSoqlFilter$ = cardModel$.observeOnLatest('page.baseSoqlFilter');
  var rescaleAxis$ = cardModel$.observeOnLatest('page.enableAxisRescaling').
    map(function(enabled) {
      // Don't rescale for `false` or `"hidden"`.
      return enabled === true;
    });
  var aggregation$ = cardModel$.observeOnLatest('aggregation');
  var dataRequests$ = new Rx.Subject();
  var dataResponses$ = new Rx.Subject();
  var unfilteredData$ = new Rx.Subject();
  var filteredData$ = new Rx.Subject();
  var whereClause$ = $scope.$observe('whereClause');

  // Keep track of the number of requests that have been made and the number of
  // responses that have come back.
  // .scan() is necessary because the usual aggregation suspect reduce actually
  // will not execute over a sequence until it has been completed; scan is happy
  // to operate on active sequences.
  var dataRequestCount$ = dataRequests$.scan(0, function(acc) { return acc + 1; });
  var dataResponseCount$ = dataResponses$.scan(0, function(acc) { return acc + 1; });

  /*************************************
  * FIRST set up the 'busy' indicator. *
  *************************************/

  // If the number of requests is greater than the number of responses, we have
  // a request in progress and we should display the spinner.
  // SUPER IMPORTANT NOTE: Because of the way that RxJS works, we need to bind
  // this one here and not below with the other bound observables... so unfortunately
  // this code is location-dependent within the file.
  $scope.$bindObservable('busy',
    Rx.Observable.combineLatest(
      dataRequestCount$,
      dataResponseCount$,
      function(requests, responses) {
        return requests === 0 || (requests > responses);
      }
    )
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

  var reportInvalidTimelineDomain = _.once(function() {
    $log.error(
      [
        'Cannot render timeline chart with invalid domain',
        '(column fieldName: "{0}").'
      ].join('').format($scope.model.fieldName)
    );
  });

  var datasetPrecision$ = Rx.Observable.combineLatest(
    cardModel$.pluck('fieldName'),
    dataset$,
    function(fieldName, dataset) {
      return Rx.Observable.fromPromise(
        CardDataService.getTimelineDomain(fieldName, dataset.id)
      );
    }
  ).switchLatest().map(
    function(domain) {
      var precision;

      // Return undefined if the domain is undefined, null, or malformed
      // in some way.  Later on, we will test if datasetPrecision is
      // undefined and display the proper error message.
      // By examining the return of getTimelineDomain, these are the
      // only checks we need.
      if (_.isUndefined(domain) || _.isNull(domain.start) || _.isNull(domain.end)) {
        reportInvalidTimelineDomain();
        return undefined;
      }

      // Otherwise, return the precision as a string.
      // Moment objects are inherently mutable. Therefore, the .add()
      // call in the first condition will need to be accounted for in
      // the second condition. We're doing this instead of just cloning
      // the objects because moment.clone is surprisingly slow (something
      // like 40ms).
      if (domain.start.add(1, 'years').isAfter(domain.end)) {
        precision = 'DAY';
      // We're actually checking for 20 years but have already added one
      // to the original domain start date in the if block above.
      } else if (domain.start.add(19, 'years').isAfter(domain.end)) {
        precision = 'MONTH';
      } else {
        precision = 'YEAR';
      }

      return precision;
    }
  );

  // TODO we should look to see if we can remove this wrapper
  Rx.Observable.subscribeLatest(
    cardModel$.pluck('fieldName'),
    dataset$,
    baseSoqlFilter$,
    datasetPrecision$,
    aggregation$,
    function(
      fieldName,
      dataset,
      whereClauseFragment,
      datasetPrecision,
      aggregationData
    ) {

      if (_.isDefined(datasetPrecision)) {

        dataRequests$.onNext(1);

        var dataPromise = CardDataService.getTimelineData(
          fieldName,
          dataset.id,
          whereClauseFragment,
          datasetPrecision,
          aggregationData
        );

        dataPromise.then(
          function(result) {

            // Ok
            unfilteredData$.onNext(dataPromise);
            dataResponses$.onNext(1);
            $scope.$emit('unfiltered_query:complete', result.headers);
          },
          function() {
            // Error, do nothing
          }
        );
      }
    }
  );

  Rx.Observable.subscribeLatest(
    cardModel$.pluck('fieldName'),
    dataset$,
    whereClause$,
    datasetPrecision$,
    aggregation$,
    cardModel$,
    function(
      fieldName,
      dataset,
      whereClause,
      datasetPrecision,
      aggregationData,
      cardModel
    ) {

      if (_.isDefined(datasetPrecision)) {

        dataRequests$.onNext(1);

        var currentActiveFilters = cardModel.getCurrentValue('activeFilters');

        // Since we need to be able to render the unfiltered values outside
        // of the timeline chart's current selection area, we need to 'filter'
        // those data outside the selection manually rather than using SoQL.
        // As a result, we need to make sure we never exclude any data that
        // belongs to the card making the request. Here we call the
        // stripWhereClauseFragmentForFieldName function to remove our own
        // activeFilter from the whereClause.
        var dataPromise = CardDataService.getTimelineData(
          fieldName,
          dataset.id,
          SoqlHelpers.stripWhereClauseFragmentForFieldName(fieldName, whereClause, currentActiveFilters),
          datasetPrecision,
          aggregationData
        );

        dataPromise.then(
          function(result) {
            // Ok
            filteredData$.onNext(dataPromise);
            dataResponses$.onNext(1);
            $scope.$emit('filtered_query:complete', result.headers);
          },
          function() {
            // Error, do nothing
          }
        );
      }
    }
  );

  var chartData$ = Rx.Observable.combineLatest(
    unfilteredData$.switchLatest().pluck('data'),
    filteredData$.switchLatest().pluck('data'),
    rescaleAxis$,
    function(unfilteredData, filteredData, rescaleAxis) {
      if (_.isEmpty(unfilteredData) || _.isEmpty(filteredData)) {
        return null;
      } else {
        return TimelineChartService.transformChartDataForRendering(
          aggregateData(unfilteredData, filteredData),
          rescaleAxis
        );
      }
    }
  ).shareReplay();

  // We're deriving whether or not we can render the timeline chart based upon:
  // * whether precision is defined or not. The precision (i.e.
  //   'DAY', 'MONTH', etc.) is derived from the start/end date and BAD DATES
  //   cause us to be unable to render the timeline chart.
  // * whether the timespan of the data is more than zero (buckets don't make
  //   sense when they're zero in duration).
  var cannotRenderTimelineChart = Rx.Observable.combineLatest(
    datasetPrecision$.map(_.isUndefined),
    chartData$.startWith(undefined),
    function(badDates, chartData) {
      var cannotRender = false;

      if (_.isNull(chartData)) {
        cannotRender = {
          reason: 'noData'
        };
      } else if (badDates) {
        cannotRender = {
          reason: 'badDates'
        };
      }

      return cannotRender;
    }
  );

  $scope.$bindObservable('chartData', chartData$);
  $scope.$bindObservable('expanded', cardModel$.observeOnLatest('expanded'));
  $scope.$bindObservable('precision', datasetPrecision$);
  $scope.$bindObservable('activeFilters', cardModel$.observeOnLatest('activeFilters'));
  $scope.$bindObservable('rowDisplayUnit', cardModel$.observeOnLatest('aggregation.unit'));
  $scope.$bindObservable('rescaleAxis', rescaleAxis$);
  $scope.$bindObservable('cannotRenderTimelineChart', cannotRenderTimelineChart);

  // Handle filtering
  $scope.$on('filter-timeline-chart',
    function(event, data) {
      if (data !== null) {
        var filter = new Filter.TimeRangeFilter(
          DateHelpers.serializeFloatingTimestamp(data.start),
          DateHelpers.serializeFloatingTimestamp(data.end)
        );
        $scope.model.set('activeFilters', [filter]);
      } else {
        $scope.model.set('activeFilters', []);
      }
    }
  );
};

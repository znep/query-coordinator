module.exports = function ColumnChartController($scope, CardDataService, rx) {
  const Rx = rx;
  if ($scope.model.getCurrentValue('cardType') === 'histogram') {
    return;
  }

  var model = $scope.$observe('model').filter(_.isPresent);
  var dataset = model.observeOnLatest('page.dataset');
  var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
  var rescaleAxis$ = model.observeOnLatest('page.enableAxisRescaling').
    map(function(enabled) {
      // Don't rescale for `false` or `"hidden"`.
      return enabled === true;
    });
  var aggregation$ = model.observeOnLatest('aggregation');
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

  // If the number of requests is greater than the number of responses, we have
  // a request in progress and we should display the spinner.
  $scope.$bindObservable('busy',
    Rx.Observable.combineLatest(
      dataRequestCount$,
      dataResponseCount$,
      function(requests, responses) {
        return requests === 0 || (requests > responses);
      }));

  var nonBaseFilterApplied = Rx.Observable.combineLatest(
    whereClause$,
      baseSoqlFilter,
      function(whereClause, baseFilter) {
        return !_.isEmpty(whereClause) && whereClause !== baseFilter;
      });

  // Unfiltered data
  Rx.Observable.subscribeLatest(
    model.pluck('fieldName'),
    dataset,
    baseSoqlFilter,
    aggregation$,
    function(fieldName, currentDataset, whereClauseFragment, aggregationData) {
      dataRequests$.onNext(1);
      var columnData = _.defaults({}, currentDataset.getCurrentValue('columns')[fieldName]);
      var dataPromise = CardDataService.getData(
        fieldName,
        currentDataset.id,
        whereClauseFragment,
        aggregationData,
        { namePhysicalDatatype: columnData.physicalDatatype, nullLast: true }
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
        });
      return Rx.Observable.fromPromise(dataPromise);
    });

  // Filtered data
  Rx.Observable.subscribeLatest(
    model.pluck('fieldName'),
    dataset,
    whereClause$,
    nonBaseFilterApplied,
    aggregation$,
    function(fieldName, currentDataset, whereClauseFragment, curNonBaseFilterApplied, aggregationData) {
      dataRequests$.onNext(1);
      var columnData = _.defaults({}, currentDataset.getCurrentValue('columns')[fieldName]);
      var dataPromise = CardDataService.getData(
        fieldName,
        currentDataset.id,
        whereClauseFragment,
        aggregationData,
        { namePhysicalDatatype: columnData.physicalDatatype, nullLast: true }
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
        });
      return Rx.Observable.fromPromise(dataPromise);
    });

  $scope.$bindObservable('rowDisplayUnit', model.observeOnLatest('aggregation.unit'));

  $scope.$bindObservable('cardData', Rx.Observable.combineLatest(
      unfilteredData$.switchLatest().pluck('data'),
      filteredData$.switchLatest().pluck('data'),
      model.observeOnLatest('activeFilters'),
      function(unfilteredData, filteredData, filters) {

        // Joins filtered data and unfiltered data into an array of objects:
        // [
        //  { name: 'some_group_name', total: 1234, filtered: 192 },
        //  ...
        // ]
        // If we're unfiltered or the filtered data isn't defined for a particular name, the filtered field is undefined.
        var unfilteredAsHash = _.reduce(unfilteredData, function(acc, datum) {
          acc[datum.name] = datum.value;
          return acc;
        }, {});

        var filteredAsHash = _.reduce(filteredData, function(acc, datum) {
          acc[datum.name] = datum.value;
          return acc;
        }, {});

        var activeFilterNames = _.map(filters, function(filter) {
          if (_.get(filter, 'isNull', false) === true) {
            return null;
          } else {
            return filter.operand;
          }
        });

        var results = [];

        _.map(unfilteredData, 'name').forEach(function(name) {

          var datumIsSpecial = false;

          if (_.includes(activeFilterNames, null)) {
            datumIsSpecial = _.isNaN(name) || _.isNull(name) || _.isUndefined(name);
          } else {
            datumIsSpecial = _.includes(activeFilterNames, name);
          }

          results.push([
            (_.isNull(name) || _.isUndefined(name)) ? '' : name,
            unfilteredAsHash[name],
            filteredAsHash[name] || 0,
            datumIsSpecial
          ]);
        });

        return results;
      }
    ));

  $scope.$bindObservable('isFiltered', whereClause$.
    map(function(whereClause) {
      return _.isPresent(whereClause);
    })
  );

  $scope.$bindObservable('expanded', model.observeOnLatest('expanded'));
  $scope.$bindObservable('rescaleAxis', rescaleAxis$);
};

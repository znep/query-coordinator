angular.module('dataCards.directives').directive('cardVisualizationColumnChart', function(AngularRxExtensions, CardDataService, Filter) {

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationColumnChart.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');
      var baseSoqlFilter = model.pluck('page').observeOnLatest('baseSoqlFilter');
      var aggregationObservable = model.pluck('page').observeOnLatest('aggregation');
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

      var nonBaseFilterApplied = Rx.Observable.combineLatest(
          $scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          });

      var unfilteredData = Rx.Observable.subscribeLatest(
        model.pluck('fieldName'),
        dataset,
        baseSoqlFilter,
        aggregationObservable,
        function(fieldName, dataset, whereClauseFragment, aggregationData) {
          dataRequests.onNext(1);
          var columnData = _.defaults({}, dataset.getCurrentValue('columns')[fieldName]);
          var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment, aggregationData, { namePhysicalDatatype: columnData.physicalDatatype });
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
        nonBaseFilterApplied,
        aggregationObservable,
        function(fieldName, dataset, whereClauseFragment, nonBaseFilterApplied, aggregationData) {
          dataRequests.onNext(1);
          var columnData = _.defaults({}, dataset.getCurrentValue('columns')[fieldName]);
          var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment, aggregationData, { namePhysicalDatatype: columnData.physicalDatatype });
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

      $scope.bindObservable('rowDisplayUnit', dataset.observeOnLatest('rowDisplayUnit'));

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
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            var filteredAsHash = _.reduce(filteredData, function(acc, datum) {
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            var activeFilterNames = _.pluck(filters, 'operand');

            return _.map(_.pluck(unfilteredData, 'name'), function(name) {
              return {
                name: name,
                total: unfilteredAsHash[name],
                filtered: filteredAsHash[name] || 0,
                special: _.contains(activeFilterNames, name)
              };
            });

        }));

      $scope.bindObservable('filterApplied', $scope.observe('whereClause').
          map(function(whereClause) {
        return _.isPresent(whereClause);
      }));

      $scope.bindObservable('expanded', model.observeOnLatest('expanded'));

      $scope.$on('column-chart:truncation-marker-clicked', function(event, datum) {
        $scope.model.page.toggleExpanded($scope.model);
      });

      $scope.$on('column-chart:datum-clicked', function(event, datum) {
        var wantsFilterToNull = !_.isString(datum.name) && !_.isNumber(datum.name);

        var isFilteringOnClickedDatum = _.any($scope.model.getCurrentValue('activeFilters'), function(filter) {
          if (filter instanceof Filter.BinaryOperatorFilter) {
            return filter.operand === datum.name;
          } else if (filter instanceof Filter.IsNullFilter) {
            return wantsFilterToNull;
          } else {
            throw new Error('CardVisualizationColumnChart does not understand the filter on its column: ' + filter);
          }
        });

        // If we're already filtering on the datum that was clicked, we should toggle the filter off.
        // Otherwise, set up a new filter for the datum.
        if (isFilteringOnClickedDatum) {
          $scope.model.set('activeFilters', []);
        } else {
          var filter = wantsFilterToNull ?
            new Filter.IsNullFilter(true) :
            new Filter.BinaryOperatorFilter('=', datum.name);
          $scope.model.set('activeFilters', [filter]);
        }
      });
    }
  };

});

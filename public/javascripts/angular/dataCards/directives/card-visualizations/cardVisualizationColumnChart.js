angular.module('dataCards.directives').directive('cardVisualizationColumnChart', function(AngularRxExtensions, CardDataService, Filter) {

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationColumnChart.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');

      var unFilteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getUnFilteredData(fieldName, dataset.id));
          }).switchLatest();

      var filteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          $scope.observe('whereClause'),
          dataset,
          function(fieldName, whereClause, dataset) {
            if (_.isEmpty(whereClause)) {
              return Rx.Observable.returnValue(null);
            } else {
              return Rx.Observable.fromPromise(CardDataService.getFilteredData(fieldName, dataset.id, whereClause));
            }
          }).switchLatest();

      $scope.bindObservable('chartData', Rx.Observable.combineLatest(filteredData, unFilteredData, model.observeOnLatest('activeFilters'), function(filtered, unFiltered, filters) {
        // Joins filtered data and unfiltered data into an array of objects:
        // [
        //  { name: 'some_group_name', total: 1234, filtered: 192 },
        //  ...
        // ]
        // If we're unfiltered or the filtered data isn't defined for a particular name, the filtered field is undefined.
        var unFilteredAsHash = _.reduce(unFiltered, function(acc, datum) {
          acc[datum.name] = datum.value;
          return acc;
        }, {});
        var filteredAsHash = _.reduce(filtered, function(acc, datum) {
          acc[datum.name] = datum.value;
          return acc;
        }, {});

        var activeFilterNames = _.pluck(filters, 'operand');

        return _.map(_.pluck(unFiltered, 'name'), function(name) {
          return {
            name: name,
            total: unFilteredAsHash[name],
            filtered: filteredAsHash[name],
            special: _.contains(activeFilterNames, name)
          }
        });
      }));

      $scope.bindObservable('filterApplied', filteredData.map(function(filtered) {
        return filtered !== null;
      }));

      $scope.bindObservable('expanded', model.observeOnLatest('expanded'));

      $scope.$on('column-chart:datum-clicked', function(event, datum) {
        var hasFiltersOnCard = _.any($scope.model.getCurrentValue('activeFilters'), function(filter) {
          return filter.operand === datum.name;
        });
        if (hasFiltersOnCard) {
          $scope.model.set('activeFilters', []);
        } else {
          var filter = _.isString(datum.name) ?
            new Filter.BinaryOperatorFilter('=', datum.name) :
            new Filter.IsNullFilter(true);
          $scope.model.set('activeFilters', [filter]);
        }
      });
    }
  };

});

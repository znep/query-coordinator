angular.module('dataCards.directives').directive('cardVisualizationTimelineChart', function(AngularRxExtensions, CardDataService, Filter) {

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationTimelineChart.html',
    link: function($scope, element, attrs) {
      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');
      var baseSoqlFilter = model.pluck('page').observeOnLatest('baseSoqlFilter');

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

      var nonBaseFilterApplied = Rx.Observable.combineLatest(
          $scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          });

      var unFilteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          baseSoqlFilter,
          dataset,
          precision,
          function(fieldName, baseWhere, dataset, precision) {
            return Rx.Observable.fromPromise(CardDataService.getTimelineData(fieldName, dataset.id, baseWhere, precision));
          }).switchLatest();

      var filteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          $scope.observe('whereClause'),
          nonBaseFilterApplied,
          dataset,
          precision,
          function(fieldName, whereClause, nonBaseFilterApplied, dataset, precision) {
            if (nonBaseFilterApplied) {
              return Rx.Observable.fromPromise(CardDataService.getTimelineData(fieldName, dataset.id, whereClause, precision));
            } else {
              return Rx.Observable.returnValue(null);
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
          acc[datum.date] = datum.value;
          return acc;
        }, {});
        var filteredAsHash = _.reduce(filtered, function(acc, datum) {
          acc[datum.date] = datum.value;
          return acc;
        }, {});

        var activeFilterDates = _.map(_.pluck(filters, 'operand'), function(date) {
          return moment(date).isValid() ? moment(date) : date;
        });

        return _.map(_.pluck(unFiltered, 'date'), function(date) {
          return {
            date: date,
            total: unFilteredAsHash[date],
            filtered: filteredAsHash[date] || 0,
            special: _.contains(activeFilterDates, date)
          }
        });
      }));

      $scope.bindObservable('filterApplied', filteredData.map(function(filtered) {
        return filtered !== null;
      }));

      $scope.bindObservable('expanded', model.observeOnLatest('expanded'));

      $scope.bindObservable('precision', precision);

      $scope.$on('timeline-chart:datum-clicked', function(event, datum) {
        // TODO: Implement range time filters

        // Slice off the timezone.
        var isoDate = datum.date.format().slice(0, -6);
        var hasFiltersOnCard = _.any($scope.model.getCurrentValue('activeFilters'), function(filter) {
          return filter.operand === isoDate;
        });
        if (hasFiltersOnCard) {
          $scope.model.set('activeFilters', []);
        } else {
          var filter = moment(datum.date).isValid() ?
            new Filter.TimeOperatorFilter($scope.precision, isoDate) :
            new Filter.IsNullFilter(true);
          $scope.model.set('activeFilters', [filter]);
        }
      });
    }
  };

});

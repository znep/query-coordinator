angular.module('dataCards.directives').directive('cardVisualizationChoropleth', function(AngularRxExtensions, CardDataService, $http) {

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').pluckSwitch('dataset');

      var geojsonRegions = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getChoroplethRegions(fieldName, dataset.id));
          }).switchLatest();

      var unfilteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          function(fieldName, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getUnfilteredChoroplethAggregates(fieldName, dataset.id));
          }).switchLatest();

      var filteredData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          $scope.observe('whereClause'),
          dataset,
          function(fieldName, whereClause, dataset) {
            if (_.isEmpty(whereClause)) {
              return Rx.Observable.returnValue(null);
            } else {
              return Rx.Observable.fromPromise(CardDataService.getFilteredChoroplethAggregates(fieldName, dataset.id, whereClause));
            }
          }).switchLatest();

      // TODO: Update this function to return what we need, not all the other crap.
      // Probably just want to construct a new geojson object from scratch.
      // Need: aggregate value, related feature id, human name, primary aggregate display unit (i.e. 'crimes')
      var mergeRegionAndAggregateData = function(fieldName, geojsonRegions, unfilteredAsHash, filteredAsHash, whereClause) {
        var newFeatures = geojsonRegions.features.map(function(geojsonFeature) {
          var featureId = geojsonFeature.properties[fieldName];
          var feature = {
            geometry: geojsonFeature.geometry,
            properties: geojsonFeature.properties,
            type: geojsonFeature.type
          };
          console.log(whereClause);
          // The check for an empty where clause is to ascertain whether we should provide
          // filtered rather than unfiltered data to the choropleth directive.
          // We're using the property name '__MERGED_SOCRATA_VALUE__' in order to avoid
          // overwriting existing properties on the geojson object (properties are user-
          // defined according to the spec).
          if (_.isEmpty(whereClause)) {
            console.log('using unfiltered');
            feature.properties['__MERGED_SOCRATA_VALUE__'] = unfilteredAsHash[featureId];
          } else {
            console.log('using filtered');
            feature.properties['__MERGED_SOCRATA_VALUE__'] = filteredAsHash[featureId];
          }
          return feature;
        });

        return {
          crs: geojsonRegions.crs,
          features: newFeatures,
          type: geojsonRegions.type
        };
      };

      $scope.bindObservable('primaryAggregation', model.pluck('page').pluck('primaryAggregation'));
      $scope.bindObservable('fieldName', model.pluck('fieldName'));
      $scope.bindObservable(
        'geojsonAggregateData',
        Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          geojsonRegions,
          unfilteredData,
          filteredData,
          model.pluckSwitch('activeFilters'),
          $scope.observe('whereClause'),
          function(fieldName, geojsonRegions, unfiltered, filtered, activeFilters, whereClause) {

            var activeFilterNames = _.pluck(activeFilters, 'operand');

            // Fail early if all required data sets have not been loaded.
            if (!unfiltered || (!_.isEmpty(whereClause) && !filtered)) {
              return null;
            }

            // Fail early if the active filter names do not match the names
            // of the actual filtered items.
            if (!_.isEmpty(whereClause) && filtered.filter(function(item){
                  return activeFilterNames.indexOf(item.name) > -1;
                }).length !== activeFilterNames.length) {
              return null;
            }

            var unfilteredAsHash = _.reduce(unfiltered, function(acc, datum) {
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            var filteredAsHash = _.reduce(filtered, function(acc, datum) {
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            return mergeRegionAndAggregateData(fieldName, geojsonRegions, unfilteredAsHash, filteredAsHash, whereClause);

      }));
      $scope.bindObservable('filterApplied', filteredData.map(function(filtered) {
        return filtered !== null;
      }));

    }
  };

});

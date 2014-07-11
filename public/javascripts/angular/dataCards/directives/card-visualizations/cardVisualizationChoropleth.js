angular.module('dataCards.directives').directive('cardVisualizationChoropleth', function(AngularRxExtensions, CardDataService, Filter, $http) {

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');

      var geojsonRegions = model.observeOnLatest('shapeFile').map(
        function(shapeFile) {
          return Rx.Observable.fromPromise(CardDataService.getChoroplethRegions(shapeFile));
        }).switchLatest();


      var aggregatedDataObservable = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          $scope.observe('whereClause'),
          dataset,
          function(fieldName, whereClause, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getChoroplethAggregates(fieldName, dataset.id, whereClause));
          }).switchLatest();

      // TODO: Update this function to return what we need, not all the other crap.
      // Probably just want to construct a new geojson object from scratch.
      // Need: aggregate value, related feature id, human name, primary aggregate display unit (i.e. 'crimes')
      var mergeRegionAndAggregateData = function(
        activeFilterNames,
        fieldName,
        geojsonRegions,
        aggregatedDataAsHash) {

        // Check to make sure that we have features to merge and fail early if not.
        if (!geojsonRegions.hasOwnProperty('features') ||
            !geojsonRegions.features.hasOwnProperty('length') ||
            geojsonRegions.features.length <= 0) {
          return null;
        }

        var newFeatures = geojsonRegions.features.map(function(geojsonFeature) {
          var featureId = geojsonFeature.properties[fieldName];
          var feature = {
            geometry: geojsonFeature.geometry,
            properties: geojsonFeature.properties,
            type: geojsonFeature.type
          };
          // We're using the property name '__MERGED_SOCRATA_VALUE__' in order to avoid
          // overwriting existing properties on the geojson object (properties are user-
          // defined according to the spec).
          feature.properties['__SOCRATA_MERGED_VALUE__'] = aggregatedDataAsHash[featureId];
          feature.properties['__SOCRATA_FEATURE_HIGHLIGHTED__'] = _.contains(activeFilterNames, featureId);
          return feature;
        });

        return {
          crs: geojsonRegions.crs,
          features: newFeatures,
          type: geojsonRegions.type
        };
      };

      $scope.bindObservable('fieldName', model.pluck('fieldName'));
      $scope.bindObservable(
        'geojsonAggregateData',
        Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          geojsonRegions,
          aggregatedDataObservable,
          model.observeOnLatest('activeFilters'),
          function(fieldName, geojsonRegions, aggregatedData, activeFilters) {

            var activeFilterNames = _.pluck(activeFilters, 'operand');

            var aggregatedDataAsHash = _.reduce(aggregatedData, function(acc, datum) {
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            return mergeRegionAndAggregateData(
              activeFilterNames,
              fieldName,
              geojsonRegions,
              aggregatedDataAsHash
            );

      }));

      // Handle filter toggle events sent from the choropleth directive.
      $scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {

        var featureId = feature.properties[$scope.model.fieldName];

        var hasFiltersOnCard = _.any($scope.model.getCurrentValue('activeFilters'), function(filter) {
          return filter.operand === featureId;
        });
        if (hasFiltersOnCard) {
          $scope.model.set('activeFilters', []);
        } else {
          var filter = _.isString(featureId) ?
            new Filter.BinaryOperatorFilter('=', featureId) :
            new Filter.IsNullFilter(true);
          $scope.model.set('activeFilters', [filter]);
        }
      });

    }
  };

});

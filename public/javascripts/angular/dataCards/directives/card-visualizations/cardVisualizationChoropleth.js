angular.module('dataCards.directives').directive('cardVisualizationChoropleth', function(AngularRxExtensions, CardDataService, Filter, $http) {

  var INTERNAL_DATASET_FEATURE_ID = '_feature_id';

  return {
    restrict: 'E',
    scope: { 'model': '=', 'whereClause': '=' },
    templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
    link: function($scope, element, attrs) {

      AngularRxExtensions.install($scope);

      var model = $scope.observe('model');
      var dataset = model.pluck('page').observeOnLatest('dataset');
      var baseSoqlFilter = model.pluck('page').observeOnLatest('baseSoqlFilter');

      var geojsonRegions = model.observeOnLatest('shapeFile').map(
        function(shapeFile) {
          return Rx.Observable.fromPromise(CardDataService.getChoroplethRegions(shapeFile));
        }).switchLatest();

      var nonBaseFilterApplied = Rx.Observable.combineLatest(
          $scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          });

      var unfilteredDataObservable = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          baseSoqlFilter,
          dataset,
          function(fieldName, baseWhere, dataset) {
            return Rx.Observable.fromPromise(CardDataService.getData(fieldName, dataset.id, baseWhere));
          }).switchLatest();

      var filteredDataObservable = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          $scope.observe('whereClause'),
          nonBaseFilterApplied,
          dataset,
          function(fieldName, whereClause, nonBaseFilterApplied, dataset) {
            if (nonBaseFilterApplied) {
              return Rx.Observable.fromPromise(CardDataService.getData(fieldName, dataset.id, whereClause));
            } else {
              return Rx.Observable.returnValue(null);
            }
          }).switchLatest();

      // TODO: Update this function to return what we need, not all the other crap.
      // Probably just want to construct a new geojson object from scratch.
      // Need: aggregate value, related feature id, human name, primary aggregate display unit (i.e. 'crimes')
      var mergeRegionAndAggregateData = function(
        activeFilterNames,
        geojsonRegions,
        unfilteredDataAsHash,
        filteredDataAsHash,
        shapefileHumanReadableColumnName) {

        var newFeatures = geojsonRegions.features.filter(function(geojsonFeature) {
          return geojsonFeature.properties.hasOwnProperty(INTERNAL_DATASET_FEATURE_ID) &&
                 geojsonFeature.properties[INTERNAL_DATASET_FEATURE_ID];
        }).map(function(geojsonFeature) {

          var name = geojsonFeature.properties[INTERNAL_DATASET_FEATURE_ID];
          var humanReadableName = geojsonFeature.properties[shapefileHumanReadableColumnName];

          if ($.isPresent(filteredDataAsHash)) {
            var mergedValue = filteredDataAsHash[name];
          } else {
            var mergedValue = unfilteredDataAsHash[name];
          }

          var feature = {
            geometry: geojsonFeature.geometry,
            properties: geojsonFeature.properties,
            type: geojsonFeature.type
          };
          // We're using the property name '__MERGED_SOCRATA_VALUE__' in order to avoid
          // overwriting existing properties on the geojson object (properties are user-
          // defined according to the spec).
          feature.properties['__SOCRATA_MERGED_VALUE__'] = mergedValue;
          feature.properties['__SOCRATA_UNFILTERED_VALUE__'] = unfilteredDataAsHash[name];
          feature.properties['__SOCRATA_FEATURE_HIGHLIGHTED__'] = _.contains(activeFilterNames, name);
          feature.properties['__SOCRATA_HUMAN_READABLE_NAME__'] = humanReadableName;
          return feature;
        });

        return {
          crs: geojsonRegions.crs,
          features: newFeatures,
          type: geojsonRegions.type
        };
      };

      $scope.bindObservable(
        'geojsonAggregateData',
        Rx.Observable.combineLatest(
          geojsonRegions,
          unfilteredDataObservable,
          filteredDataObservable,
          model.observeOnLatest('activeFilters'),
          model.pluck('fieldName'),
          dataset.observeOnLatest('columns'),
          function(geojsonRegions, unfilteredData, filteredData, activeFilters, fieldName, columns) {

            var activeFilterNames = _.pluck(activeFilters, 'operand');

            var unfilteredDataAsHash = _.reduce(unfilteredData, function(acc, datum) {
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            var filteredDataAsHash = _.reduce(filteredData, function(acc, datum) {
              acc[datum.name] = datum.value;
              return acc;
            }, {});

            // Extract the active column from the columns array by matching against
            // the card's "fieldName".
            var column = _.find(
              columns,
              function(column) { return column.name === fieldName; });

            if (!column) {
              throw new Error('Could not match "_feature_id" to human-readable column name.');
            }

            // Geospatial columns are required to have a "shapefileColumn" property,
            // which acts as a foreign key into the column's shapefile and allows us
            // to access a human-readable name in a data-driven manner rather than
            // relying on a hard-coded value.
            var shapefileFeatureHumanReadablePropertyName = column.shapefileFeatureHumanReadablePropertyName;

            return mergeRegionAndAggregateData(
              activeFilterNames,
              geojsonRegions,
              unfilteredDataAsHash,
              filteredDataAsHash,
              shapefileFeatureHumanReadablePropertyName
            );

      }));

      // Handle filter toggle events sent from the choropleth directive.
      $scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {

        var featureId = feature.properties[INTERNAL_DATASET_FEATURE_ID];
        var humanReadableName = feature.properties['__SOCRATA_HUMAN_READABLE_NAME__'];

        var hasFiltersOnCard = _.any($scope.model.getCurrentValue('activeFilters'), function(filter) {
          return filter.operand === featureId;
        });
        if (hasFiltersOnCard) {
          $scope.model.set('activeFilters', []);
        } else {
          var filter = _.isString(featureId) ?
            new Filter.BinaryOperatorFilter('=', featureId, humanReadableName) :
            new Filter.IsNullFilter(true);
          $scope.model.set('activeFilters', [filter]);
        }
      });

    }
  };

});

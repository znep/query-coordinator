angular.module('dataCards.directives').directive('cardVisualizationChoropleth', function(AngularRxExtensions, CardDataService, Filter) {

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
      var shapeFile = model.observeOnLatest('shapeFile');
      var dataRequests = new Rx.Subject();
      var dataResponses = new Rx.Subject();
      var geojsonRegionsSequence = new Rx.Subject();
      var unfilteredDataSequence = new Rx.Subject();
      var filteredDataSequence = new Rx.Subject();

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

          var feature = {
            geometry: geojsonFeature.geometry,
            properties: geojsonFeature.properties,
            type: geojsonFeature.type
          };
          // Create a new object to get rid of superfluous shapefile-specific
          // fields coming out of the backend.
          return {
            geometry: feature.geometry,
            properties: {
              '_feature_id': geojsonFeature.properties['_feature_id'],
              '__SOCRATA_FILTERED_VALUE__': filteredDataAsHash[name],
              '__SOCRATA_UNFILTERED_VALUE__': unfilteredDataAsHash[name],
              '__SOCRATA_FEATURE_HIGHLIGHTED__': _.contains(activeFilterNames, name),
              '__SOCRATA_HUMAN_READABLE_NAME__': humanReadableName
            },
            type: feature.type
          };
        });

        return {
          crs: geojsonRegions.crs,
          features: newFeatures,
          type: geojsonRegions.type
        };
      };

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

      var geojsonRegionsData = shapeFile.map(
        function(shapeFile) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getChoroplethRegions(shapeFile);
          dataPromise.then(
            function(res) {
              // Ok
              geojsonRegionsSequence.onNext(dataPromise);
              dataResponses.onNext(1);
            },
            function(err) {
              // Do nothing
            });
          return Rx.Observable.fromPromise(dataPromise);
        });

      var unfilteredData = Rx.Observable.subscribeLatest(
        model.pluck('fieldName'),
        dataset,
        baseSoqlFilter,
        function(fieldName, dataset, whereClauseFragment) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment);
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
        function(fieldName, dataset, whereClauseFragment, nonBaseFilterApplied) {
          dataRequests.onNext(1);
          var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment);
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

      $scope.bindObservable('fieldName', model.pluck('fieldName'));
      $scope.bindObservable('rowDisplayUnit', dataset.observeOnLatest('rowDisplayUnit'));

      $scope.bindObservable(
        'geojsonAggregateData',
        Rx.Observable.combineLatest(
          geojsonRegionsData.switchLatest(),
          unfilteredDataSequence.switchLatest(),
          filteredDataSequence.switchLatest(),
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

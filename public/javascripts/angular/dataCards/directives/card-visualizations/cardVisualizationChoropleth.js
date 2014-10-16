(function() {
  'use strict';

  function cardVisualizationChoropleth(Constants, AngularRxExtensions, CardDataService, Filter) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        function mergeRegionAndAggregateData(
          activeFilterNames,
          geojsonRegions,
          unfilteredDataAsHash,
          filteredDataAsHash,
          shapefileHumanReadableColumnName) {

            var newFeatures = geojsonRegions.features.filter(function(geojsonFeature) {
              return geojsonFeature.properties.hasOwnProperty(Constants['INTERNAL_DATASET_FEATURE_ID']) &&
                     geojsonFeature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
            }).map(function(geojsonFeature) {

              var name = geojsonFeature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
              var humanReadableName = geojsonFeature.properties[shapefileHumanReadableColumnName];
              /*var feature = {
                geometry: geojsonFeature.geometry,
                properties: geojsonFeature.properties,
                type: geojsonFeature.type
              };*/

              var properties = {};
              properties[Constants['INTERNAL_DATASET_FEATURE_ID']] = geojsonFeature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
              properties[Constants['FILTERED_VALUE_PROPERTY_NAME']] = filteredDataAsHash[name];
              properties[Constants['UNFILTERED_VALUE_PROPERTY_NAME']] = unfilteredDataAsHash[name];
              properties[Constants['SELECTED_PROPERTY_NAME']] = _.contains(activeFilterNames, name);
              properties[Constants['HUMAN_READABLE_PROPERTY_NAME']] = humanReadableName;

              // Create a new object to get rid of superfluous shapefile-specific
              // fields coming out of the backend.
              return {
                geometry: geojsonFeature.geometry,
                properties: properties,
                type: geojsonFeature.type
              };
            });

            return {
              crs: geojsonRegions.crs,
              features: newFeatures,
              type: geojsonRegions.type
            };
        };

        var model = scope.observe('model');
        var dataset = model.pluck('page').observeOnLatest('dataset');
        var baseSoqlFilter = model.pluck('page').observeOnLatest('baseSoqlFilter');
        var dataRequests = new Rx.Subject();
        var dataResponses = new Rx.Subject();
        var geojsonRegionsSequence = new Rx.Subject();
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
        var geojsonRegionsData;
        var unfilteredData;
        var filteredData;


        function getShapefileFeatureHumanReadablePropertyName(regions) {
          var p = regions.features[0].properties;
          // Chicago
          if (p.hasOwnProperty('community') && p.hasOwnProperty('area_numbe')) {
            return 'community';
          }
          // Chicago, SF or Philly (zillow?)
          if (p.hasOwnProperty('name') && p.hasOwnProperty('city') && p.hasOwnProperty('county') && p.hasOwnProperty('state')) {
            return 'name';
          }
          // Chicago
          if (p.hasOwnProperty('alderman') && p.hasOwnProperty('hall_offic') && p.hasOwnProperty('ward')) {
            return 'ward';
          }
          // Chicago
          if (p.hasOwnProperty('zip')) {
            return 'zip';
          }
          // NYC
          if (p.hasOwnProperty('borocd')) {
            return 'borocd';
          }
          // SF
          if (p.hasOwnProperty('numbertext') && p.hasOwnProperty('supdist') && p.hasOwnProperty('supervisor') && p.hasOwnProperty('supname')) {
            return 'supdist';
          }
          // SF
          if (p.hasOwnProperty('city') && p.hasOwnProperty('district') && p.hasOwnProperty('secondary')) {
            return 'district';
          }
          // NYS
          if (p.hasOwnProperty('countyns') && p.hasOwnProperty('funcstat') && p.hasOwnProperty('namelsad') && p.hasOwnProperty('statefp')) {
            return 'namelsad';
          }
          // NYS
          if (p.hasOwnProperty('abbrev') && p.hasOwnProperty('businessph') && p.hasOwnProperty('city') && p.hasOwnProperty('name')) {
            return 'name';
          }
          // Philly
          if (p.hasOwnProperty('dist_num') && p.hasOwnProperty('dist_numc') && p.hasOwnProperty('div_code')) {
            return 'dist_numc';
          }

        }


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

        geojsonRegionsData = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset.observeOnLatest('columns'),
          function(fieldName, columns) {
            dataRequests.onNext(1);
            if (!columns[fieldName].hasOwnProperty('shapefile')) {
              throw new Error('Dataset metadata column for computed georegion column does not include shapfile.');
            }
            var dataPromise = CardDataService.getChoroplethRegions(columns[fieldName].shapefile);
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

        unfilteredData = Rx.Observable.subscribeLatest(
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

        filteredData = Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          scope.observe('whereClause'),
          nonBaseFilterApplied,
          function(fieldName, dataset, whereClauseFragment, nonBaseFilterApplied) {
          console.log('GETTING SHOROPLETH FILTERED DATA');
          console.log(fieldName, dataset, whereClauseFragment, nonBaseFilterApplied);
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


        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.bindObservable('fieldName', model.pluck('fieldName'));
        scope.bindObservable('baseLayerUrl', model.observeOnLatest('baseLayerUrl'));
        scope.bindObservable('rowDisplayUnit', dataset.observeOnLatest('rowDisplayUnit'));

        scope.bindObservable(
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

              if (_.isEmpty(column)) {
                throw new Error('Could not match fieldName to human-readable column name.');
              }

              var shapefileFeatureHumanReadablePropertyName = getShapefileFeatureHumanReadablePropertyName(geojsonRegions);

              return mergeRegionAndAggregateData(
                activeFilterNames,
                geojsonRegions,
                unfilteredDataAsHash,
                filteredDataAsHash,
                shapefileFeatureHumanReadablePropertyName
              );

        }));


        /*********************************************************
        * Respond to events in the child 'choropleth' directive. *
        *********************************************************/

        // Handle filter toggle events sent from the choropleth directive.
        scope.$on('toggle-dataset-filter:choropleth', function(event, feature, callback) {
          var featureId = feature.properties[Constants['INTERNAL_DATASET_FEATURE_ID']];
          var humanReadableName = feature.properties[Constants['HUMAN_READABLE_PROPERTY_NAME']];

          var hasFiltersOnCard = _.any(scope.model.getCurrentValue('activeFilters'), function(filter) {
            return filter.operand === featureId;
          });
          if (hasFiltersOnCard) {
            scope.model.set('activeFilters', []);
          } else {
            var filter = _.isString(featureId) ?
              new Filter.BinaryOperatorFilter('=', featureId, humanReadableName) :
              new Filter.IsNullFilter(true);
            scope.model.set('activeFilters', [filter]);
          }
        });

      }
    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationChoropleth', cardVisualizationChoropleth);

})();

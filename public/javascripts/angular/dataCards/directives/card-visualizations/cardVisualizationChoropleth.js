(function() {
  'use strict';

  function cardVisualizationChoropleth(Constants, AngularRxExtensions, CardDataService, Filter,
                                       ServerConfig, CardVisualizationChoroplethHelpers) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        var model = scope.observe('model').filter(_.isPresent);
        var dataset = model.observeOnLatest('page.dataset');
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
        var aggregationObservable = model.observeOnLatest('page.aggregation');
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
        var geojsonRegionsData;

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

        Rx.Observable.combineLatest(
          scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          }
        );

        if (ServerConfig.get('enableBoundingBoxes')) {

          geojsonRegionsData = Rx.Observable.combineLatest(
            dataset,
            model.pluck('fieldName'),
            dataset.observeOnLatest('columns'),
            function(dataset, fieldName, columns) {

              var shapeFile = null;

              if (_.isEmpty(columns)) {
                return Rx.Observable.never();
              }

              dataRequests.onNext(1);

              if (ServerConfig.metadataMigration.shouldConsumeComputationStrategy()) {
                shapeFile = CardVisualizationChoroplethHelpers.extractShapeFileFromColumn(columns[fieldName]);
              } else {
                if (columns[fieldName].hasOwnProperty('shapefile')) {
                  shapeFile = columns[fieldName].shapefile;
                }
              }

              if (shapeFile === null) {
                throw new Error('Dataset metadata column for computed georegion does not include shapeFile.');
              }

              var sourceColumn = null;
              _.each(columns, function(column, fieldName) {
                if (column.physicalDatatype === 'point' && column.logicalDatatype === 'location') {
                  sourceColumn = fieldName;
                }
              });

              if (sourceColumn === null) {
                throw new Error('No column with geometry found.');
              }

              var dataPromise = CardDataService.getChoroplethRegions(dataset.id, sourceColumn, shapeFile);
              dataPromise.then(
                function(res) {
                  // Ok
                  geojsonRegionsSequence.onNext(dataPromise);
                  dataResponses.onNext(1);
                },
                function(err) {
                  // Do nothing
                }
              );

              return Rx.Observable.fromPromise(dataPromise);
            }
          );

        } else {

          geojsonRegionsData = Rx.Observable.combineLatest(
            model.pluck('fieldName'),
            dataset.observeOnLatest('columns'),
            function(fieldName, columns) {

              var shapeFile = null;

              if (_.isEmpty(columns)) {
                return Rx.Observable.never();
              }

              dataRequests.onNext(1);

              if (ServerConfig.metadataMigration.shouldConsumeComputationStrategy()) {
                shapeFile = CardVisualizationChoroplethHelpers.extractShapeFileFromColumn(columns[fieldName]);
              } else {
                if (columns[fieldName].hasOwnProperty('shapefile')) {
                  shapeFile = columns[fieldName].shapefile;
                }
              }

              if (shapeFile === null) {
                throw new Error('Dataset metadata column for computed georegion does not include shapeFile.');
              }

              var dataPromise = CardDataService.getChoroplethRegions(shapeFile);
              dataPromise.then(
                function(res) {
                  // Ok
                  geojsonRegionsSequence.onNext(dataPromise);
                  dataResponses.onNext(1);
                },
                function(err) {
                  // Do nothing
                }
              );

              return Rx.Observable.fromPromise(dataPromise);
            }
          );

        }

        Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          baseSoqlFilter,
          aggregationObservable,
          function(fieldName, dataset, whereClauseFragment, aggregationData) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment, aggregationData);
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

        Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          scope.observe('whereClause'),
          aggregationObservable,
          function(fieldName, dataset, whereClauseFragment, aggregationData) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment, aggregationData);
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
        scope.bindObservable('rowDisplayUnit', model.observeOnLatest('page.aggregation.unit'));

        scope.bindObservable(
          'geojsonAggregateData',
          Rx.Observable.combineLatest(
            geojsonRegionsData.switchLatest(),
            unfilteredDataSequence.switchLatest(),
            filteredDataSequence.switchLatest(),
            model.observeOnLatest('activeFilters'),
            model.pluck('fieldName'),
            dataset.observeOnLatest('columns'),
            CardVisualizationChoroplethHelpers.aggregateGeoJsonData));


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

  angular.module('dataCards.directives').
    directive('cardVisualizationChoropleth', cardVisualizationChoropleth);

})();

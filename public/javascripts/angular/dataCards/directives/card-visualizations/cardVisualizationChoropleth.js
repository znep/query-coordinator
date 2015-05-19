(function() {
  'use strict';

  function cardVisualizationChoropleth(Constants, AngularRxExtensions, CardDataService, Filter,
                                       ServerConfig, CardVisualizationChoroplethHelpers, $log) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        var model = scope.$observe('model').filter(_.isPresent);
        var dataset = model.observeOnLatest('page.dataset');
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
        var aggregationObservable = model.observeOnLatest('page.aggregation');
        var dataRequests = new Rx.Subject();
        var dataResponses = new Rx.Subject();
        var unfilteredDataSequence = new Rx.Subject();
        var filteredDataSequence = new Rx.Subject();
        var whereClauseObservable = scope.$observe('whereClause');

        // Keep track of the number of requests that have been made and the number of
        // responses that have come back.
        // .scan() is necessary because the usual aggregation suspect reduce actually
        // will not execute over a sequence until it has been completed; scan is happy
        // to operate on active sequences.
        var dataRequestCount = dataRequests.scan(0, function(acc, x) { return acc + 1; });
        var dataResponseCount = dataResponses.scan(0, function(acc, x) { return acc + 1; });

        var shapeFileObservable;
        var geometryLabelObservable;
        var geojsonRegionsObservable;

        /*************************************
        * FIRST set up the 'busy' indicator. *
        *************************************/

        // If the number of requests is greater than the number of responses, we have
        // a request in progress and we should display the spinner.
        // SUPER IMPORTANT NOTE: Because of the way that RxJS works, we need to bind
        // this one here and not below with the other bound observables... so unfortunately
        // this code is location-dependent within the file.
        scope.$bindObservable('busy',
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
          whereClauseObservable,
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          }
        );

        shapeFileObservable = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset.observeOnLatest('columns'),
          function(fieldName, columns) {
            var shapeFile = null;

            if (_.isEmpty(columns)) {
              return Rx.Observable.never();
            }

            // The shapeFile and the sourceColumn are both found in the
            // computationStrategy blob that is attached to computed columns.
            shapeFile = CardVisualizationChoroplethHelpers.extractShapeFileFromColumn(
              columns[fieldName]
            );

            if (shapeFile === null) {
              scope.$safeApply(function() {
                scope.choroplethRenderError = true;
              });
            }

            return shapeFile;
          }
        );

        geometryLabelObservable = shapeFileObservable.map(
          function(shapeFile) {
            var dataPromise;

            dataRequests.onNext(1);

            dataPromise = CardDataService.getChoroplethGeometryLabel(shapeFile);

            dataPromise.then(
              function(res) {
                // Ok
                dataResponses.onNext(1);
              },
              function(err) {
                // Still increment the counter to stop the spinner
                dataResponses.onNext(1);

                scope.$safeApply(function() {
                  scope.choroplethRenderError = true;
                });
              }
            );

            return Rx.Observable.fromPromise(dataPromise);
          }
        );

        geojsonRegionsObservable = Rx.Observable.combineLatest(
          dataset,
          dataset.observeOnLatest('columns'),
          model.pluck('fieldName'),
          shapeFileObservable,
          function(dataset, columns, fieldName, shapeFile) {
            var sourceColumn = null;
            var dataPromise;
            var computationStrategy = _.get(columns[fieldName], 'computationStrategy.strategy_type');

            dataRequests.onNext(1);

            sourceColumn = CardVisualizationChoroplethHelpers.extractSourceColumnFromColumn(
              columns[fieldName]
            );

            // If we were unable to extract the source column from the
            // computationStrategy, attempt to find a location/point column
            // that could potentially be the source column. This will not
            // always be correct if there is more than one location/point
            // column in the dataset.
            if (sourceColumn === null) {
              _.each(columns, function(column, fieldName) {
                if (column.physicalDatatype === 'point' &&
                  column.fred === 'location') {

                  sourceColumn = fieldName;
                }
              });

              // If we still could not determine the source column, issue a warning.
              if (sourceColumn === null) {
                $log.warn('Unable to get source column of computed ' +
                  'column "{0}"'.format(fieldName));
              }
            }

            // If we have successfully found a source column and it uses the
            // georegion_match_on_point strategy, make the more specific bounding
            // box query utilizing the source column's extents.
            if (sourceColumn !== null && computationStrategy === 'georegion_match_on_point') {

              dataPromise = CardDataService.getChoroplethRegionsUsingSourceColumn(
                dataset.id,
                sourceColumn,
                shapeFile
              );

            // Otherwise, use the less efficient but more robust request.
            } else {
              dataPromise = CardDataService.getChoroplethRegions(shapeFile);
            }

            dataPromise.then(
              function(res) {
                // Ok
                dataResponses.onNext(1);
              },
              function(err) {
                // Show geojson regions request error message.
                dataResponses.onNext(1);

                scope.$safeApply(function() {
                  scope.choroplethRenderError = true;
                });
              }
            );

            return Rx.Observable.fromPromise(dataPromise);
          }
        );

        Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          baseSoqlFilter,
          aggregationObservable,
          function(fieldName, dataset, whereClauseFragment, aggregationData) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment, aggregationData, { limit: 5000 });
            dataPromise.then(
              function(res) {
                // Ok
                unfilteredDataSequence.onNext(dataPromise);
                dataResponses.onNext(1);
              },
              function(err) {
                // Still increment the counter to stop the spinner
                dataResponses.onNext(1);
              });
            return Rx.Observable.fromPromise(dataPromise);
          });

        Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          whereClauseObservable,
          aggregationObservable,
          function(fieldName, dataset, whereClauseFragment, aggregationData) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment, aggregationData, { limit: 5000 });
            dataPromise.then(
              function(res) {
                // Ok
                filteredDataSequence.onNext(dataPromise);
                dataResponses.onNext(1);
              },
              function(err) {
                // Still increment the counter to stop the spinner
                dataResponses.onNext(1);
              });
            return Rx.Observable.fromPromise(dataPromise);
          });

        // NOTE: This needs to be defined on the scope BEFORE
        // the 'geojsonAggregateData' observable is bound, or
        // else it sometimes fails to set the value to true
        // when it encounters an error. WTF.
        scope.choroplethRenderError = false;

        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.$bindObservable('fieldName', model.pluck('fieldName'));
        scope.$bindObservable('baseLayerUrl', model.observeOnLatest('baseLayerUrl'));
        scope.$bindObservable('rowDisplayUnit', model.observeOnLatest('page.aggregation.unit'));

        scope.$bindObservable(
          'geojsonAggregateData',
          Rx.Observable.combineLatest(
            geometryLabelObservable.switchLatest(),
            geojsonRegionsObservable.switchLatest(),
            unfilteredDataSequence.switchLatest(),
            filteredDataSequence.switchLatest(),
            model.observeOnLatest('activeFilters'),
            model.pluck('fieldName'),
            dataset.observeOnLatest('columns'),
            CardVisualizationChoroplethHelpers.aggregateGeoJsonData),
          // The second function argument to bindObservable is called when
          // there is an error in one of the argument sequences. This can
          // happen when we reject the regions promise because the extent
          // query that it depends on fails.
          function(e) {
            $log.error(e);
          }
        );


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

        scope.$bindObservable('cardSize', model.observeOnLatest('cardSize'));

      }
    };

  }

  angular.module('dataCards.directives').
    directive('cardVisualizationChoropleth', cardVisualizationChoropleth);

})();

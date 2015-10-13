(function() {
  'use strict';

  function cardVisualizationChoropleth(
    Constants,
    CardDataService,
    CardVisualizationChoroplethHelpers,
    DatasetColumnsService,
    Filter,
    LeafletVisualizationHelpersService,
    ServerConfig,
    $log
  ) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'allowFilterChange': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationChoropleth.html',
      link: function cardVisualizationChoroplethLink(scope, element) {
        var model = scope.$observe('model').filter(_.isPresent);
        var dataset = model.observeOnLatest('page.dataset');
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
        var aggregation$ = model.observeOnLatest('page.aggregation');
        var dataRequests$ = new Rx.Subject();
        var dataResponses$ = new Rx.Subject();
        var unfilteredData$;
        var filteredData$;
        var whereClause$ = scope.$observe('whereClause');
        var computedColumnName$ = model.observeOnLatest('computedColumn').distinctUntilChanged();
        var waiting$ = new Rx.BehaviorSubject(true);

        // computedColumnBase contains the computed column blob on the dataset,
        // or undefined if it does not exist.
        var computedColumnBase$ = Rx.Observable.combineLatest(
          dataset.observeOnLatest('columns'),
          computedColumnName$,
          function(columns, computedColumnName) {
            return _.get(columns, computedColumnName);
          }
        );

        // The computed column is partitioned into the following 2 observables,
        // because we have separate behavior depending on whether or not the
        // computed column exists.
        var computedColumn$ = computedColumnBase$.filter(_.isPresent);
        var computedColumnMissing$ = computedColumnBase$.filter(_.negate(_.isPresent)).first();

        // In the add card dialog and the customize dialog, we do not do region
        // coding.
        var regionCodingDisabled = element.closest('.cards-content').length === 0;
        if (regionCodingDisabled) {
          computedColumnMissing$.subscribe(function() {
            scope.$safeApply(function() {
              scope.isPendingColumnAddition = true;
            });
          });
        } else {

          // If the computed column is missing
          computedColumnMissing$.
            tap(function() {

              // Set up the busy indicator
              scope.isPendingComputation = true;
            }).
            withLatestFrom(
              dataset.pluck('id'),
              computedColumnName$,
              model.pluck('fieldName'),
              function(computedColumnIsMissing, datasetId, computedColumnName, sourceColumn) {
                var matches = /(\w{4})_(\w{4})$/.exec(computedColumnName);
                var shapefileId = _.slice(matches, 1, 3).join('-');

                // Request rails to initiate region coding (add the computed column).
                return CardDataService.initiateRegionCoding(datasetId, shapefileId, sourceColumn);
              }
            ).
            switchLatest(). // Wait for a response from the server
            pluck('data', 'success').
            tap(function(success) {

              // If initiating region coding failed, show an error.
              if (!success) {
                scope.$safeApply(function() {
                  scope.choroplethRenderError = true;
                });
              }
            }).
            filter(_.isPresent). // Only continue if region coding initiation succeeded.
            flatMapLatest(dataset.pluck('id')).
            combineLatest(
              computedColumnName$,
              function(datasetId, computedColumnName) {
                var matches = /(\w{4})_(\w{4})$/.exec(computedColumnName);
                var shapefileId = _.slice(matches, 1, 3).join('-');

                // Gather necessary information to poll for region coding completion.
                return {
                  datasetId: datasetId,
                  shapefileId: shapefileId
                };
              }
            ).
            flatMapLatest(function(datasetAndShapefile) {
              var poll = _.bind(CardDataService.getRegionCodingStatus, CardDataService, datasetAndShapefile.datasetId, datasetAndShapefile.shapefileId);

              // Setup a timer that polls for completion of the region coding.
              // This is an observable of observables.
              return Rx.Observable.
                interval(5000).
                map(poll).
                takeUntil(computedColumn$); // Stop polling if the computed column gets added.
            }).
            switchLatest(). // Grab out the result of the most recent status check.
            pluck('data').
            combineLatest(
              dataset,
              function(responseData, datasetModel) {
                return {
                  responseData: responseData,
                  dataset: datasetModel
                };
              }
            ).
            subscribe(function(responseDataAndDataset) {
              var responseData = responseDataAndDataset.responseData;
              var datasetModel = responseDataAndDataset.dataset;

              // If the response from rails says region coding is complete
              if (responseData.success) {
                var newColumns = _.get(responseData, 'datasetMetadata.columns');
                if (newColumns) {

                  // Perform transformations on the datasetMetadata
                  newColumns = _.mapValues(newColumns, function(column, fieldName) {
                    var extendedData = _.extend({
                      fieldName: fieldName,
                      isSystemColumn: DatasetColumnsService.isSystemColumn(column)
                    }, column);
                    return extendedData;
                  });

                  // Set the dataset columns, which retriggers the computedColumn$
                  // observable (except it will exist this time), which will
                  // trigger a render of the choropleth.
                  datasetModel.set('columns', newColumns);
                }
              }
            }, function() {
              scope.$safeApply(function() {
                scope.isPendingComputation = false;
                scope.choroplethRenderError = true;
              });
            });
        }

        // Keep track of the number of requests that have been made and the number of
        // responses that have come back.
        // .scan() is necessary because the usual aggregation suspect reduce actually
        // will not execute over a sequence until it has been completed; scan is happy
        // to operate on active sequences.
        var dataRequestCount$ = dataRequests$.scan(0, function(acc) { return acc + 1; });
        var dataResponseCount$ = dataResponses$.scan(0, function(acc) { return acc + 1; });

        var shapefile$;
        var geometryLabel$;
        var geojsonRegions$;

        var shapefileRegionQueryLimit = ServerConfig.getScalarValue(
          'shapefileRegionQueryLimit',
          Constants.DEFAULT_SHAPE_FILE_REGION_QUERY_LIMIT
        );

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
            dataRequestCount$,
            dataResponseCount$,
            scope.$observe('choroplethRenderError').startWith(null),
            waiting$,
            function(requests, responses, error, waiting) {
              if (!_.isEmpty(error)) {
                return false;
              }

              if (waiting) {
                return true;
              }

              return requests === 0 || (requests > responses);
            }).startWith(true));


        /******************************************
        * THEN set up other observable sequences. *
        ******************************************/

        // Set a custom card title corresponding to the computed column.
        Rx.Observable.subscribeLatest(
          model,
          dataset.observeOnLatest('columns'),
          computedColumn$,
          function(currentModel, columns, computedColumn) {
            var columnName = _.get(columns, '{0}.name'.format(currentModel.fieldName), '');
            var regionName = computedColumn.name;
            if (_.isEmpty(columnName) || _.isEmpty(regionName)) {
              return;
            }
            var customTitle = '{0} &mdash; {1}'.format(columnName, regionName);
            currentModel.set('customTitle', customTitle);
          });

        // If the card type switches, clear the current title.
        model.
          filter(function(currentModel) {
            return currentModel.getCurrentValue('cardType') !== 'choropleth';
          }).
          subscribe(function(currentModel) {
            currentModel.set('customTitle', undefined);
          });

        shapefile$ = computedColumn$.map(
          function(computedColumn) {

            // The shapefile and the sourceColumn are both found in the
            // computationStrategy blob that is attached to computed columns.
            var shapefile = CardVisualizationChoroplethHelpers.extractShapeFileFromColumn(computedColumn);

            if (shapefile === null) {
              scope.$safeApply(function() {
                scope.choroplethRenderError = true;
              });
            }

            return shapefile;
          });

        geometryLabel$ = shapefile$.map(
          function(shapefile) {
            var dataPromise;

            dataRequests$.onNext(1);

            dataPromise = CardDataService.getChoroplethGeometryLabel(shapefile);

            dataPromise.then(
              function() {
                dataResponses$.onNext(1);
              },
              function() {

                // Still increment the counter to stop the spinner
                dataResponses$.onNext(1);

                scope.$safeApply(function() {
                  scope.choroplethRenderError = true;
                });
              }
            );

            return Rx.Observable.fromPromise(dataPromise);
          }
        );

        geojsonRegions$ = Rx.Observable.combineLatest(
          dataset,
          model.pluck('fieldName'),
          shapefile$,
          computedColumn$,
          function(currentDataset, fieldName, shapefile, computedColumn) {
            var sourceColumn = fieldName;
            var dataPromise;
            var computationStrategy = _.get(computedColumn, 'computationStrategy.strategy_type');

            dataRequests$.onNext(1);

            // If we have successfully found a source column and it uses the
            // georegion_match_on_point strategy, make the more specific bounding
            // box query utilizing the source column's extents.
            if (computationStrategy === 'georegion_match_on_point') {

              dataPromise = CardDataService.getChoroplethRegionsUsingSourceColumn(
                currentDataset.id,
                sourceColumn,
                shapefile
              );

            // Otherwise, use the less efficient but more robust request.
            } else {
              dataPromise = CardDataService.getChoroplethRegions(shapefile);
            }

            dataPromise.then(
              function() {
                // Ok
                dataResponses$.onNext(1);
              },
              function() {
                // Show geojson regions request error message.
                dataResponses$.onNext(1);

                scope.$safeApply(function() {
                  scope.choroplethRenderError = true;
                });
              }
            );

            return Rx.Observable.fromPromise(dataPromise);
          }
        );

        function trackPromiseFlightStatus(eventLabel, dataPromise) {
          dataRequests$.onNext(1);
          dataPromise.then(
            function(result) {
              // Ok
              dataResponses$.onNext(1);
              waiting$.onNext(false);
              scope.$emit(eventLabel, result.headers);
            },
            function() {
              // Still increment the counter to stop the spinner
              dataResponses$.onNext(1);
            });
        }

        function requestDataWithWhereClauseSequence(where$, eventLabel) {
          return Rx.Observable.combineLatest(
            computedColumn$,
            computedColumnName$,
            dataset,
            where$,
            aggregation$,
            function(computedColumn, computedColumnName, currentDataset, whereClauseFragment, aggregationData) {
              return CardDataService.getData(
                computedColumnName,
                currentDataset.id,
                whereClauseFragment,
                aggregationData,
                { limit: shapefileRegionQueryLimit }
              );
            }).
            tap(_.partial(trackPromiseFlightStatus, eventLabel)).
            switchLatest().
            retryWhen(function(errors) {
              waiting$.onNext(true);
              return errors.delay(5000);
            }).
            take(6).
            tap(function() {
              scope.$safeApply(function() {
                scope.isPendingComputation = false;
              });
            });
        }

        unfilteredData$ = requestDataWithWhereClauseSequence(baseSoqlFilter, 'unfiltered_query:complete');
        filteredData$ = requestDataWithWhereClauseSequence(whereClause$, 'filtered_query:complete');

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
        scope.$bindObservable('isFiltered', whereClause$.map(_.isPresent));

        scope.$bindObservable(
          'geojsonAggregateData',
          Rx.Observable.combineLatest(
            geometryLabel$.switchLatest(),
            geojsonRegions$.switchLatest(),
            unfilteredData$.pluck('data'),
            filteredData$.pluck('data'),
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
        scope.$on('toggle-dataset-filter:choropleth', function(event, feature) {
          var featureId = feature.properties[Constants.INTERNAL_DATASET_FEATURE_ID];
          var humanReadableName = feature.properties[Constants.HUMAN_READABLE_PROPERTY_NAME];

          var hasFiltersOnCard = _.any(
            scope.model.getCurrentValue('activeFilters'),
            function(currentFilter) {
              return currentFilter.operand === featureId;
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

        LeafletVisualizationHelpersService.setObservedExtentOnModel(scope, scope.model);

        var savedExtent$ = model.observeOnLatest('cardOptions.mapExtent');
        var defaultExtent$ = Rx.Observable.
          returnValue(CardDataService.getDefaultFeatureExtent());

        var extent$ = Rx.Observable.combineLatest(
          savedExtent$,
          defaultExtent$,
          function(savedExtent, defaultExtent) {
            if (_.isPresent(savedExtent)) {
              return { savedExtent: savedExtent };
            } else {
              return { defaultExtent: defaultExtent };
            }
          }).
          take(1);

        scope.$bindObservable('savedExtent', extent$.pluck('savedExtent'));
        scope.$bindObservable('defaultExtent', extent$.pluck('defaultExtent'));
        scope.$bindObservable('cardSize', model.observeOnLatest('cardSize'));

      }
    };

  }

  angular.module('dataCards.directives').
    directive('cardVisualizationChoropleth', cardVisualizationChoropleth);

})();

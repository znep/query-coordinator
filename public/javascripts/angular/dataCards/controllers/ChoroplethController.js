const angular = require('angular');
function ChoroplethController(
  $scope,
  $element,
  Constants,
  CardDataService,
  CardVisualizationChoroplethHelpers,
  DatasetColumnsService,
  Filter,
  LeafletVisualizationHelpersService,
  ServerConfig,
  SpatialLensService,
  $log,
  rx) {
  const Rx = rx;
  var model = $scope.$observe('model').filter(_.isPresent);
  var dataset = model.observeOnLatest('page.dataset');
  var datasetId$ = dataset.pluck('id');
  var fieldName$ = model.pluck('fieldName');
  var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
  var aggregation$ = model.observeOnLatest('aggregation');
  var unfilteredData$;
  var filteredData$;
  var whereClause$ = $scope.$observe('whereClause');
  var computedColumnName$ = model.observeOnLatest('computedColumn').distinctUntilChanged();
  var waiting$ = new Rx.BehaviorSubject(true);

  var inFlightRequestsTracker$ = new Rx.Subject();

  $scope.stops = 'continuous';

  // Keep track of the number of requests that have been made and the number of
  // responses that have come back.
  // We use `.scan()` because `.reduce()` only emits a value when the source
  // stream completes.
  var inFlightRequestsCount$ = inFlightRequestsTracker$.
    scan(0, function(acc, value) { return acc + value; });
  var hasInFlightRequests$ = inFlightRequestsCount$.
    map(function(count) { return count > 0; }).
    distinctUntilChanged().
    startWith(false);

  // computedColumnBase contains the computed column blob on the dataset,
  // or undefined if it does not exist.
  var computedColumnBase$ = Rx.Observable.combineLatest(
    dataset.observeOnLatest('columns'),
    computedColumnName$,
    _.get);

  // The computed column is partitioned into the following 2 observables,
  // because we have separate behavior depending on whether or not the
  // computed column exists.
  var computedColumn$ = computedColumnBase$.filter(_.isPresent);
  var computedColumnMissing$ = computedColumnBase$.filter(_.negate(_.isPresent)).first();

  // In the add card dialog and the customize dialog, we do not do region
  // coding.
  var regionCodingDisabled = $element.closest('.cards-content').length === 0;

  var shapefileId$ = computedColumnName$.map(CardVisualizationChoroplethHelpers.computedColumnNameToShapefileId);

  function transformNewColumns(newColumns) {
    return _.mapValues(newColumns, function(column, fieldName) {
      return _.extend({
        fieldName: fieldName,
        isSystemColumn: DatasetColumnsService.isSystemColumn(column)
      }, column);
    });
  }

  if (regionCodingDisabled) {
    computedColumnBase$.
      map(_.isPresent).
      safeApplySubscribe($scope, function(computedColumnPresent) {
        $scope.isPendingColumnAddition = !computedColumnPresent;
        if (!computedColumnPresent) {
          $scope.geojsonAggregateData = undefined;
        }
      });
  } else {

    // If the computed column is missing, enqueue an adhoc region coding job and poll for status.
    computedColumnMissing$.
      safeApply($scope, function() { $scope.isPendingComputation = true; }).
      combineLatest(
        datasetId$,
        shapefileId$,
        fieldName$,
        function(_, datasetId, shapefileId, fieldName) {
          return SpatialLensService.executeRegionCodingJob(datasetId, shapefileId, fieldName);
        }
      ).
      switchLatest().
      safeApplyOnError($scope, function() {
        $scope.isPendingColumnAddition = false;
        $scope.isPendingComputation = false;
        $scope.choroplethRenderError = true;
      }).
      map(_.property('data.datasetMetadata.columns')).
      filter(_.isObject).
      map(transformNewColumns).
      subscribeLatest(
        dataset,
        function(newColumns, datasetModel) {
          // Set the dataset columns, which retriggers the computedColumn$
          // observable (except it will exist this time), which will
          // trigger a render of the choropleth.
          datasetModel.set('columns', newColumns);
        });
  }

  var shapefile$;
  var regionMetadata$;
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
  $scope.$bindObservable('busy',
    Rx.Observable.combineLatest(
      hasInFlightRequests$,
      $scope.$observe('choroplethRenderError').startWith(null),
      waiting$,
      function(hasInFlightRequests, error, waiting) {
        if (!_.isEmpty(error)) {
          return false;
        }

        if (waiting) {
          return true;
        }

        return hasInFlightRequests; // requests === 0 || (requests > responses);
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
      var columnName = _.get(columns, `${currentModel.fieldName}.name`, '');
      var regionName = computedColumn.name;
      if (_.isEmpty(columnName) || _.isEmpty(regionName)) {
        return;
      }
      var customTitle = `${columnName} &mdash; ${regionName}`;
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
        $scope.$safeApply(function() {
          $scope.choroplethRenderError = true;
        });
      }

      return shapefile;
    });

  function trackPromiseFlightStatus(dataPromise) {
    inFlightRequestsTracker$.onNext(1);
    dataPromise['finally'](function() { inFlightRequestsTracker$.onNext(-1); });
  }

  regionMetadata$ = shapefile$.
    map(CardDataService.getChoroplethRegionMetadata).
    tap(trackPromiseFlightStatus).
    switchLatest().
    share().
    safeApplyOnError($scope, function() { $scope.choroplethRenderError = true; })
    ['catch'](Rx.Observable.returnValue({
      geometryLabel: null,
      featurePk: Constants.INTERNAL_DATASET_FEATURE_ID
    }));

  var primaryKey$ = regionMetadata$.pluck('featurePk');

  geojsonRegions$ = Rx.Observable.combineLatest(
    dataset,
    fieldName$,
    shapefile$,
    computedColumn$,
    function(currentDataset, fieldName, shapefile, computedColumn) {
      var sourceColumn = fieldName;
      var computationStrategy = _.get(computedColumn, 'computationStrategy.strategy_type');

      // If we have successfully found a source column and it uses the
      // georegion_match_on_point strategy, make the more specific bounding
      // box query utilizing the source column's extents.
      if (computationStrategy === 'georegion_match_on_point') {

        return CardDataService.getChoroplethRegionsUsingSourceColumn(
          currentDataset.id,
          sourceColumn,
          shapefile
        );

      // Otherwise, use the less efficient but more robust request.
      } else {
        return CardDataService.getChoroplethRegions(shapefile);
      }
    }).
    tap(trackPromiseFlightStatus).
    switchLatest().
    safeApplyOnError($scope, function() { $scope.choroplethRenderError = true; });

  function requestDataWithWhereClauseSequence(where$, eventLabel) {

    // For every change in the where clause, we kick off a new observable
    // with incremental back-off, and flatten
    return where$.flatMapLatest(function(whereClauseFragment) {

      var getDataWithWhereClauseAndLimit = _.partial(
        CardDataService.getData,
        _, _, whereClauseFragment, _, { limit: shapefileRegionQueryLimit });

      return Rx.Observable.combineLatest(
          computedColumnName$,
          datasetId$,
          aggregation$,
          computedColumn$,
          getDataWithWhereClauseAndLimit
      ).
        tap(trackPromiseFlightStatus).
        switchLatest().
        tap(function(result) {
          waiting$.onNext(false);
          $scope.$emit(eventLabel, result.headers);
        }).
        incrementalFallbackRetry(6, function() { waiting$.onNext(true); }).
        safeApply($scope, function() { $scope.isPendingComputation = false; }).
        safeApplyOnError($scope, function() { $scope.choroplethRenderError = true; }).
        pluck('data');
    });
  }

  unfilteredData$ = requestDataWithWhereClauseSequence(baseSoqlFilter, 'unfiltered_query:complete');
  filteredData$ = requestDataWithWhereClauseSequence(whereClause$, 'filtered_query:complete');

  // NOTE: This needs to be defined on the scope BEFORE
  // the 'geojsonAggregateData' observable is bound, or
  // else it sometimes fails to set the value to true
  // when it encounters an error. WTF.
  $scope.choroplethRenderError = false;

  /****************************************
  * Bind non-busy-indicating observables. *
  ****************************************/

  $scope.$bindObservable('fieldName', fieldName$);
  $scope.$bindObservable('baseLayerUrl', model.observeOnLatest('baseLayerUrl'));
  $scope.$bindObservable('rowDisplayUnit', model.observeOnLatest('aggregation.unit'));
  $scope.$bindObservable('isFiltered', whereClause$.map(_.isPresent));
  $scope.$bindObservable('primaryKey', primaryKey$);

  var geojsonAggregateData$ = Rx.Observable.combineLatest(
    regionMetadata$,
    geojsonRegions$,
    unfilteredData$,
    filteredData$,
    model.observeOnLatest('activeFilters'),
    fieldName$,
    dataset.observeOnLatest('columns'),
    CardVisualizationChoroplethHelpers.aggregateGeoJsonData);

  $scope.$bindObservable(
    'geojsonAggregateData',
    geojsonAggregateData$,
    // The second function argument to bindObservable is called when
    // there is an error in one of the argument sequences. This can
    // happen when we reject the regions promise because the extent
    // query that it depends on fails.
    function(e) {
      $log.error(e);
    }
  );

  var allCuratedRegions$ = dataset.flatMapLatest(SpatialLensService.getAvailableGeoregions$);
  $scope.$bindObservable('noAvailableBoundaries', allCuratedRegions$.map(_.isEmpty));

  /*********************************************************
  * Respond to events in the child 'choropleth' directive. *
  *********************************************************/

  // Handle filter toggle events sent from the choropleth directive.
  var datasetFilterToggleFeature$ = $scope.$eventToObservable('toggle-dataset-filter:choropleth').
    map(_.property('additionalArguments[0]'));

  Rx.Observable.subscribeLatest(
    datasetFilterToggleFeature$,
    primaryKey$,
    computedColumnName$.filter(_.isDefined),
    function(feature, primaryKey, computedColumnName) {
      var featureId = feature.properties[primaryKey];
      var humanReadableName = feature.properties[Constants.HUMAN_READABLE_PROPERTY_NAME];
      var filters = [];

      var hasFiltersOnCard = _.any(
        $scope.model.getCurrentValue('activeFilters'),
        'operand',
        featureId
      );

      if (!hasFiltersOnCard) {
        var filter = _.isString(featureId) ?
          new Filter.BinaryComputedGeoregionOperatorFilter('=', featureId, computedColumnName, humanReadableName) :
          new Filter.IsNullFilter(true);
        filters = [filter];
      }

      $scope.$safeApply(function() {
        $scope.model.set('activeFilters', filters);
      });
    });

  LeafletVisualizationHelpersService.setObservedExtentOnModel($scope, $scope.model);

  $scope.defaultExtent = CardDataService.getDefaultFeatureExtent();
  $scope.savedExtent = $scope.model.getCurrentValue('cardOptions').getCurrentValue('mapExtent');

  $scope.$bindObservable('cardSize', model.observeOnLatest('cardSize'));
}

angular.
  module('dataCards.controllers').
  controller('ChoroplethController', ChoroplethController);

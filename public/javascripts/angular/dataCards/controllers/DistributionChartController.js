const angular = require('angular');
function DistributionChartController(
  $scope,
  CardDataService,
  HistogramService,
  ColumnChartService,
  Filter,
  $log,
  Constants,
  SoqlHelpers,
  rx) {
  const Rx = rx;

  var whereClause$ = $scope.$observe('whereClause');
  var isFiltered$ = whereClause$.map(_.isPresent);
  var cardModel$ = $scope.$observe('model').filter(_.isPresent);
  var dataset$ = cardModel$.observeOnLatest('page.dataset');
  var aggregation$ = cardModel$.observeOnLatest('aggregation');
  var activeFilters$ = cardModel$.observeOnLatest('activeFilters');
  var fieldName$ = cardModel$.pluck('fieldName');
  var expanded$ = cardModel$.observeOnLatest('expanded');
  var rowDisplayUnit$ = cardModel$.observeOnLatest('aggregation.unit');

  /** This function returns an observable that produces the data required to render the histogram
   * as a column chart. If the decision is made to render as a column chart, then we can reuse the
   * value produced by groupBySample$ as the unfiltered data for the chart. If the page has no
   * filter then we have everything we need and can render the chart.  Otherwise we have to make
   * another request for the filtered data.
   */
  function cardDataColumnChart$() {

    /** Don't be afraid. This is just used to clean up the annoyances of combining the arguments
     * of combineLatest and withLatestFrom. We first use Array.prototype.constructor as the
     * selector for combineLatest which gives us an array of 3 elements. We then withLatestFrom
     * that observable with 3 more observables. The resulting selector gets passed the original
     * array from the combineLatest and three more arguments. We call Array.concat to concatenate
     * them all into a single array, and then use zipObject to assign them keys so we can access
     * them with semantic names.  Please note that if you add an Observable that produces an array
     * of values, you will get unexpected results due to concat.
     */
    var keys = ['groupBySample', 'activeFilter', 'whereClause', 'fieldName', 'dataset', 'aggregation'];
    var aggregateSequenceValues = _.flow(Array.prototype.concat, _.partial(_.zipObject, keys)).bind([]);

    return groupBySample$.combineLatest(
      activeFilters$.pluck(0),
      whereClause$,
      Array.prototype.constructor
    ).withLatestFrom(
      fieldName$,
      dataset$.pluck('id'),
      aggregation$,
      _.flow(aggregateSequenceValues, function(values) {
        var unfilteredData = values.groupBySample;

        // If we aren't filtering the page, no need to request filtered data, just render the
        // unfiltered data.
        if (_.isEmpty(values.whereClause)) {
          var result = HistogramService.transformDataForColumnChart(unfilteredData);
          return Rx.Observable.returnValue(result);
        } else {
          var requestOptions = { orderBy: SoqlHelpers.formatFieldName(values.fieldName) };
          var requestArguments = _.at(values, 'fieldName', 'dataset', 'whereClause', 'aggregation').concat(requestOptions);
          var filteredDataPromise = CardDataService.getData.apply(CardDataService, requestArguments).
            then(function(response) {
              var filteredData = response.data;
              var selectedValue = _.get(values.activeFilter, 'operand');
              return HistogramService.transformDataForColumnChart(unfilteredData, filteredData, selectedValue, true);
            });

          return Rx.Observable.fromPromise(filteredDataPromise);
        }
      })
    ).switchLatest();
  }

  var groupBySample$ = fieldName$.combineLatest(
    dataset$,
    aggregation$,
    _.identity
  ).withLatestFrom(
    dataset$,
    aggregation$,
    function(fieldName, dataset, aggregation) {

      /** To decide if we should render as a column chart, make a request for (n + 1) unique
       * elements, then ensure that there are n or less elements and that they are all integers,
       * where n is HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD. The where clause excludes blank
       * values because we don't render them and don't want them to skew our decision making
       * process. We don't actually use the aggregation for anything but it's required for
       * CardDataService.getData, so it's included in the withLatestFrom.  If we do end up
       * deciding to render as a columnChart (see visualizationType), we use this groupBySample as
       * the unfiltered data.
       */
      var whereClause = `\`${fieldName}\` IS NOT NULL`;
      var options = { limit: Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD + 1, orderBy: fieldName};
      var cardDataPromise = CardDataService.getData(fieldName, dataset.id, whereClause, aggregation, options).
        then(function(response) {
          return _.map(response.data, function(bucket) {
            return {
              name: parseFloat(bucket.name),
              value: bucket.value
            };
          });
        });
      return Rx.Observable.fromPromise(cardDataPromise);
    }).
    switchLatest().
    shareReplay(1);

  // Fires either 'column' or 'histogram'.
  var visualizationType$ = groupBySample$.map(function(groupBySample) {
    return HistogramService.getVisualizationTypeForData(_.pluck(groupBySample, 'name'));
  }).shareReplay(1);

  // Use a different observable to fetch data depending on the chart type.
  var cardData$ = visualizationType$.flatMapLatest(function(visualizationType) {
    return visualizationType === 'histogram' ? Rx.Observable.returnValue(undefined) : cardDataColumnChart$();
  }).share();

  // Override the visualizationType on the model so other components can see which chart we
  // decided to render as.
  visualizationType$.subscribe(_.bind($scope.model.set, $scope.model, 'visualizationType'));

  $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
  $scope.$bindObservable('cardData', cardData$);
  $scope.$bindObservable('isFiltered', isFiltered$);
  $scope.$bindObservable('expanded', expanded$);
  $scope.$bindObservable('visualizationType', visualizationType$);
}

angular.
  module('dataCards.controllers').
  controller('DistributionChartController', DistributionChartController);

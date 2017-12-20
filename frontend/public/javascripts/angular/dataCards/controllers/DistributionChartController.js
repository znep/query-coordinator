module.exports = function DistributionChartController(
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

  var model = $scope.$observe('model').filter(_.isPresent);
  var whereClause$ = $scope.$observe('whereClause');
  var isFiltered$ = whereClause$.map(_.isPresent);
  var cardModel$ = $scope.$observe('model').filter(_.isPresent);
  var dataset$ = cardModel$.observeOnLatest('page.dataset');
  var aggregation$ = cardModel$.observeOnLatest('aggregation');
  var activeFilters$ = cardModel$.observeOnLatest('activeFilters');
  var fieldName$ = cardModel$.pluck('fieldName');
  var expanded$ = cardModel$.observeOnLatest('expanded');
  var rowDisplayUnit$ = cardModel$.observeOnLatest('aggregation.unit');
  var rescaleAxis$ = model.observeOnLatest('page.enableAxisRescaling').
    map(function(enabled) {
      // Don't rescale for `false` or `"hidden"`.
      return enabled === true;
    });

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
    var keys = ['activeFilter', 'whereClause', 'fieldName', 'dataset', 'aggregation'];
    var aggregateSequenceValues = _.flow(Array.prototype.concat, _.partial(_.zipObject, keys)).bind([]);

    return Rx.Observable.combineLatest(
      activeFilters$.pluck(0),
      whereClause$,
      Array.prototype.constructor
    ).withLatestFrom(
      fieldName$,
      dataset$.pluck('id'),
      aggregation$,
      _.flow(aggregateSequenceValues, function(values) {
        const requestOptions = { orderBy: SoqlHelpers.formatFieldName(values.fieldName) };
        const { fieldName, dataset, aggregation } = values;

        var unfilteredDataPromise = CardDataService.getData(fieldName, dataset, '', aggregation, requestOptions);

        // If we aren't filtering the page, no need to request filtered data, just render the
        // unfiltered data.
        if (_.isEmpty(values.whereClause)) {
          return Rx.Observable.fromPromise(unfilteredDataPromise).map(function(response) {
            return HistogramService.transformDataForColumnChart(response.data);
          });
        } else {
          var requestArguments = _.at(values, 'fieldName', 'dataset', 'whereClause', 'aggregation').concat(requestOptions);
          var filteredDataPromise = CardDataService.getData.apply(CardDataService, requestArguments);

          return Rx.Observable.fromPromise(Promise.all([unfilteredDataPromise, filteredDataPromise])).
            map(function(responses) {
              var unfilteredData = responses[0].data;
              var filteredData = responses[1].data;
              var selectedValue = _.get(values.activeFilter, 'operand');
              return HistogramService.transformDataForColumnChart(unfilteredData, filteredData, selectedValue, true);
            });
        }
      })
    ).switchLatest();
  }

  var groupBySample$ = fieldName$.combineLatest(
    dataset$,
    _.identity
  ).withLatestFrom(
    dataset$,
    function(fieldName, dataset, aggregation) { // eslint-disable-line no-unused-vars

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
      var options = { limit: Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD + 1 };
      var cardDataPromise = CardDataService.getColumnValues(fieldName, dataset.id, whereClause, options);
      return Rx.Observable.fromPromise(cardDataPromise).
        pluck('data').
        map(function(data) {
          return _.map(data, function(bucket) {
            return {
              name: parseFloat(bucket.COLUMN_ALIAS_GUARD__NAME)
            };
          });
        });
    }).
    switchLatest().
    shareReplay(1);

  // Fires either 'column' or 'histogram'.
  var visualizationType$ = groupBySample$.map(function(groupBySample) {
    return HistogramService.getVisualizationTypeForData(_.map(groupBySample, 'name'));
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
  $scope.$bindObservable('rescaleAxis', rescaleAxis$);
};

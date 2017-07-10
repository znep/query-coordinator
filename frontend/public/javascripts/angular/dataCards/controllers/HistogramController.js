module.exports = function HistogramController(
  $scope,
  CardDataService,
  HistogramService,
  ColumnChartService,
  Filter,
  $log,
  rx) {
  const Rx = rx;

  /**
   * Fetches both unfiltered and filtered data.  Requests the data bucketed
   * either logarithmically (CardDataService.getMagnitudeData) or linearly
   * (CardDataService.getBucketedData), depending on contents of
   * columnDataSummary.
   */
  function fetchHistogramData(fieldName, dataset, whereClauseFragment, aggregationData, columnDataSummary) {
    var dataPromise;

    // Fetch data differently depending on how it should be bucketed.
    if (columnDataSummary.bucketType === 'linear') {

      dataPromise = CardDataService.getBucketedData(
        fieldName,
        dataset.id,
        whereClauseFragment,
        aggregationData,
        _.pick(columnDataSummary, 'bucketSize')
      );

    } else if (columnDataSummary.bucketType === 'logarithmic') {

      dataPromise = CardDataService.getMagnitudeData(
        fieldName,
        dataset.id,
        whereClauseFragment,
        aggregationData
      );

    } else {
      $log.error(`Invalid bucket type "${columnDataSummary.bucketType}"`);
    }

    return Rx.Observable.fromPromise(dataPromise).map(function(result) {
      return {
        headers: result.headers,
        data: result.data,
        columnDataSummary: columnDataSummary
      };
    });
  }

  var cardModel$ = $scope.$observe('model').filter(_.isPresent);
  var whereClause$ = $scope.$observe('whereClause');
  var isFiltered$ = whereClause$.map(_.isPresent);
  var rescaleAxis$ = cardModel$.observeOnLatest('page.enableAxisRescaling').
    map(function(enabled) {
      // Don't rescale for `false` or `"hidden"`.
      return enabled === true;
    });
  var dataset$ = cardModel$.observeOnLatest('page.dataset');
  var baseSoqlFilter$ = cardModel$.observeOnLatest('page.baseSoqlFilter');
  var aggregation$ = cardModel$.observeOnLatest('aggregation');
  var activeFilters$ = cardModel$.observeOnLatest('activeFilters');
  var fieldName$ = cardModel$.pluck('fieldName');
  var cardId$ = cardModel$.pluck('uniqueId');
  var bucketType$ = cardModel$.observeOnLatest('bucketType');
  var expanded$ = cardModel$.observeOnLatest('expanded');
  var rowDisplayUnit$ = cardModel$.observeOnLatest('aggregation.unit');
  var filterSelected$ = $scope.$eventToObservable('toggle-dataset-filter:histogram').
    map(_.property('additionalArguments[0]'));

  var currentRangeFilterValues$ = activeFilters$.map(function(filters) {
    var valueRangeFilter = _.find(filters, function(filter) {
      return filter instanceof Filter.ValueRangeFilter;
    });

    if (_.isDefined(valueRangeFilter)) {
      return [valueRangeFilter.start, valueRangeFilter.end];
    }

    return null;
  });

  function convertFiltersToWhereClauseFragments(cardFilter) {
    return _.invokeMap(cardFilter.filters, 'generateSoqlWhereFragment', cardFilter.filteredColumn);
  }

  var whereClauseExcludingOwn$ = cardModel$.observeOnLatest('page.activeFilters').
    withLatestFrom(
      cardId$,
      function(activeFilters, cardId) {
        return _.chain(activeFilters).
          reject(_.matchesProperty('uniqueId', cardId)).
          omitBy(_.isEmpty).
          map(convertFiltersToWhereClauseFragments).
          flatten().
          value().
          join(' AND ');
      }
    ).distinctUntilChanged();

  filterSelected$.subscribe(function(filterValues) {
    if (_.isPresent(filterValues)) {
      var filter = new Filter.ValueRangeFilter(filterValues[0], filterValues[1]);
      $scope.model.set('activeFilters', [filter]);
    } else {
      $scope.model.set('activeFilters', []);
    }
  });

  /**
   * This function returns an observable that produces the data required
   * to render the histogram as a curvy histogram thing. First, a request
   * is made to get the min and max of the column. This is used to decide
   * how the data should be bucketed and what size the buckets should be.
   * From there we make a request for the unfiltered data and a request
   * for the filtered data, which are combined and returned.
   */
  function cardDataHistogram$() {
    var columnDataSummary$ = Rx.Observable.combineLatest(
      fieldName$,
      dataset$,
      bucketType$,
      function(fieldName, dataset, bucketType) {

        // This promise will ultimately return an object in the form:
        // {min:, max:, bucketType:, bucketSize:}
        // See HistogramService.getBucketingOptions
        var columnDomainPromise = CardDataService.getColumnDomain(fieldName, dataset.id, null).
          then(function(domain) {
            if (_.has(domain, 'min') && _.has(domain, 'max')) {
              return HistogramService.getBucketingOptions(domain, bucketType);
            } else {
              $scope.histogramRenderError = 'noData';
              return undefined;
            }
          }
        );

        return Rx.Observable.fromPromise(columnDomainPromise);
      }).
      switchLatest().
      share().
      filter(_.isDefined);

    columnDataSummary$.
      ignoreErrors().
      combineLatest(
        cardModel$,
        function(columnDataSummary, cardModel) {
          return {
            columnDataSummary: columnDataSummary,
            cardModel: cardModel
          };
        }).
        subscribe(function(values) {
          var bucketSize = _.get(values, 'columnDataSummary.bucketSize', null);

          if (values.columnDataSummary.bucketType === 'logarithmic') {
            bucketSize = 'logarithmic';
          }

          values.cardModel.setOption('bucketSize', bucketSize);
        });

    var unfilteredData$ = Rx.Observable.combineLatest(
      fieldName$,
      dataset$,
      baseSoqlFilter$,
      aggregation$,
      columnDataSummary$,
      fetchHistogramData
    ).switchLatest();

    var filteredData$ = Rx.Observable.combineLatest(
      fieldName$,
      dataset$,
      whereClauseExcludingOwn$,
      aggregation$,
      columnDataSummary$,
      fetchHistogramData
    ).switchLatest();

    return Rx.Observable.combineLatest(
      unfilteredData$,
      filteredData$,
      function(unfiltered, filtered) {

        var bucketingOptions =
            _.pick(unfiltered.columnDataSummary, 'bucketType', 'bucketSize');

        var unfilteredData =
            HistogramService.bucketData(unfiltered.data, bucketingOptions);
        var filteredData =
            HistogramService.bucketData(filtered.data, bucketingOptions);

        $scope.$emit('unfiltered_query:complete', unfiltered.headers);
        $scope.$emit('filtered_query:complete', filtered.headers);

        $scope.histogramRenderError = false;

        if (!_.isArray(unfilteredData) || !_.isArray(filteredData)) {
          throw new Error('badData');
        }

        if (_.isEmpty(unfilteredData)) {
          throw new Error('noData');
        }

        // While the filtered data doesn't have the same number of buckets as the unfiltered,
        // we need to create the missing buckets and give them values of zero.
        var i = 0;
        var noDatum = function(index) {
          return $.grep(filteredData, function(e) {
            return e.start === unfilteredData[index].start;
          }).length === 0;
        };

        while (unfilteredData.length !== filteredData.length && i < unfilteredData.length) {
          var unfilteredDatum = unfilteredData[i];

          // If the filtered array doesn't contain an object with the same 'start' index as the
          // current unfiltered object, create new bucket and insert it into the filtered array.

          if (noDatum(i)) {
            var newBucket = {
              start: unfilteredDatum.start,
              end: unfilteredDatum.end,
              value: 0
            };

            filteredData.splice(i, 0, newBucket);
          }

          i++;
        }

        return {
          unfiltered: unfilteredData,
          filtered: filteredData
        };
      }).
      catchException(function(error) {
        if (_.isError(error)) {
          $scope.histogramRenderError = error.message || true;
        } else {
          $scope.histogramRenderError = error || true;
        }
        return Rx.Observable.returnValue({ error: $scope.histogramRenderError });
      });
  }

  // Use a different observable to fetch data depending on the chart type.
  var cardData$ = cardDataHistogram$().share();

  var histogramRenderError$ = $scope.$observe('histogramRenderError').filter(_.isPresent);

  var loading$ = Rx.Observable.merge(
    baseSoqlFilter$.map(_.constant(true)),
    whereClauseExcludingOwn$.map(_.constant(true)),
    cardData$.map(_.constant(false)),
    histogramRenderError$.map(_.constant(false))
  ).startWith(true);

  $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
  $scope.$bindObservable('cardData', cardData$);
  $scope.$bindObservable('isFiltered', isFiltered$);
  $scope.$bindObservable('rescaleAxis', rescaleAxis$);
  $scope.$bindObservable('expanded', expanded$);
  $scope.$bindObservable('currentRangeFilterValues', currentRangeFilterValues$);
  $scope.$bindObservable('loading', loading$);
};

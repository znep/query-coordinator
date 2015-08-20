(function() {
  'use strict';

  function cardVisualizationHistogram(CardDataService, HistogramService, ColumnChartService, Filter, $log, Constants) {

    /**
     * Fetches both unfiltered and filtered data.  Requests the data bucketed
     * either logarithmically (CardDataService.getMagnitudeData) or linearly
     * (CardDataService.getBucketedData), depending on contents of
     * columnDataSummary.
     */
    function fetchHistogramData(fieldName, dataset, whereClauseFragment, aggregationData, columnDataSummary) {
      var dataPromise;
      var bucketingOptions = _.pick(columnDataSummary, 'bucketType', 'bucketSize');
      var bucketData = _.curry(HistogramService.bucketData)(_, bucketingOptions);

      // Fetch data differently depending on how it should be bucketed.
      if (columnDataSummary.bucketType === 'linear') {

        dataPromise = CardDataService.getBucketedData(
          fieldName,
          dataset.id,
          whereClauseFragment,
          aggregationData,
          _.pick(columnDataSummary, 'bucketSize')
        ).then(bucketData);

      } else if (columnDataSummary.bucketType === 'logarithmic') {

        dataPromise = CardDataService.getMagnitudeData(
          fieldName,
          dataset.id,
          whereClauseFragment,
          aggregationData
        ).then(bucketData);

      } else {
        $log.error('Invalid bucket type "{0}"'.format(columnDataSummary.bucketType));
      }

      return Rx.Observable.fromPromise(dataPromise).map(function(data) {
        return {
          data: data,
          bucketType: columnDataSummary.bucketType
        };
      });
    }

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationHistogram.html',
      link: function($scope, element) {
        var whereClause$ = $scope.$observe('whereClause');
        var isFiltered$ = whereClause$.map(_.isPresent);
        var cardModel$ = $scope.$observe('model');
        var dataset$ = cardModel$.observeOnLatest('page.dataset');
        var baseSoqlFilter$ = cardModel$.observeOnLatest('page.baseSoqlFilter');
        var aggregation$ = cardModel$.observeOnLatest('page.aggregation');
        var activeFilters$ = cardModel$.observeOnLatest('activeFilters');
        var fieldName$ = cardModel$.pluck('fieldName');
        var cardId$ = cardModel$.pluck('uniqueId');
        var bucketType$ = cardModel$.observeOnLatest('bucketType');
        var expanded$ = cardModel$.observeOnLatest('expanded');
        var rowDisplayUnit$ = cardModel$.observeOnLatest('page.aggregation.unit');
        var filterSelected$ = $scope.$eventToObservable('toggle-dataset-filter:histogram').
          map(_.property('additionalArguments[0]'));

        var currentRangeFilterValues$ = activeFilters$.map(function(filters) {
          if (!_.isPresent(filters)) { return null; }

          var valueRangeFilter = _.find(filters, function(filter) {
            return filter instanceof Filter.ValueRangeFilter;
          });

          if (_.isDefined(valueRangeFilter)) {
            return [valueRangeFilter.start, valueRangeFilter.end];
          }
        });

        var activeFiltersExcludingOwn$ = cardModel$.observeOnLatest('page.activeFilters').
          withLatestFrom(
            cardId$,
            activeFilters$,
            function(activeFilters, cardId) {
              var cardFilterIndex = _.findIndex(activeFilters, function(cardFilterInfo) {
                return cardFilterInfo.uniqueId === cardId;
              });

              if (_.isDefined(activeFilters[cardFilterIndex])) {
                activeFilters[cardFilterIndex].filters = [];
              }

              return activeFilters;
            });

        var whereClauseExcludingOwn$ = activeFiltersExcludingOwn$.
          map(function(pageFilters) {
            var wheres = _.map(pageFilters, function(cardFilterInfo) {
              if (_.isEmpty(cardFilterInfo.filters)) {
                return null;
              } else {
                return _.invoke(cardFilterInfo.filters, 'generateSoqlWhereFragment', cardFilterInfo.fieldName).
                  join(' AND ');
              }
            });
            return _.compact(wheres).join(' AND ');
          }).startWith('');

        filterSelected$.subscribe(function(filterValues) {
          if (_.isPresent(filterValues)) {
            var filter = new Filter.ValueRangeFilter(filterValues[0], filterValues[1]);
            $scope.model.set('activeFilters', [filter]);
          } else {
            $scope.model.set('activeFilters', []);
          }
        });

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

              $scope.histogramRenderError = false;

              if (!_.isArray(unfiltered.data) || !_.isArray(filtered.data)) {
                throw new Error('badData');
              }

              if (_.isEmpty(unfiltered.data)) {
                throw new Error('noData');
              }

              var unfilteredData = unfiltered.data;
              var filteredData = filtered.data;

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

        function cardDataColumnChart$() {
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

              if (_.isEmpty(values.whereClause)) {
                var result = HistogramService.transformDataForColumnChart(unfilteredData);
                return Rx.Observable.returnValue(result);
              } else {
                var requestArguments = _.at(values, 'fieldName', 'dataset', 'whereClause', 'aggregation').concat({ orderBy: '`{0}`'.format(values.fieldName) });
                var filteredDataPromise = CardDataService.getData.apply(CardDataService, requestArguments).
                  then(function(filteredData) {
                    var selectedValue = _.get(values.activeFilter, 'operand');
                    return HistogramService.transformDataForColumnChart(unfilteredData, filteredData || [], selectedValue);
                  });

                return Rx.Observable.fromPromise(filteredDataPromise);
              }
            })
          ).switchLatest();
        }

        var groupBySample$ = fieldName$.withLatestFrom(
          dataset$,
          aggregation$,
          function(fieldName, dataset, aggregation) {

            // To decide if we should render as a column chart, make a request
            // for (n + 1) unique elements, then ensure that there are n or less
            // elements and that they are all integers, where n is
            // HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD. The where clause
            // excludes blank values because we don't render them and don't want
            // them to skew our decision making process. We don't actually use
            // the aggregation for anything but it's required for
            // CardDataService.getData, so it's included in the withLatestFrom.
            // processResponse just plucks the names of the buckets and passes
            // it to HistogramService.
            var whereClause = '`{0}` IS NOT NULL'.format(fieldName);
            var options = { limit: Constants.HISTOGRAM_COLUMN_CHART_CARDINALITY_THRESHOLD + 1, orderBy: fieldName};
            return Rx.Observable.fromPromise(CardDataService.getData(fieldName, dataset.id, whereClause, aggregation, options));
          }).
          switchLatest().
          shareReplay(1);

        // Fires either 'columnChart' or 'histogram'
        var visualizationType$ = groupBySample$.map(function(groupBySample) {
          return HistogramService.getVisualizationTypeForData(_.pluck(groupBySample, 'name'));
        }).share();

        var cardData$ = visualizationType$.flatMapLatest(function(visualizationType) {
          return visualizationType === 'histogram' ? cardDataHistogram$() : cardDataColumnChart$();
        }).share();

        // This sucks, but we have to conditionally set a negative horizontal
        // margin on the outer container because when the chart renders as a
        // histogram we need the visualization to take up the full width, but
        // when it renders as a column chart it needs to have padding.
        visualizationType$.subscribe(function(visualizationType) {
          var conditionalStyles = {};

          if (visualizationType === 'columnChart') {
            conditionalStyles.marginLeft = 0;
            conditionalStyles.marginRight = 0;
            ColumnChartService.registerColumnChartEvents($scope, element);
          } else {
            conditionalStyles.marginLeft = -Constants.HISTOGRAM_MARGINS.left;
            conditionalStyles.marginRight = -Constants.HISTOGRAM_MARGINS.right;
          }

          element.closest('card-visualization').css(conditionalStyles);
        });

        visualizationType$.subscribe(_.bind($scope.model.set, $scope.model, 'visualizationType'));

        $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
        $scope.$bindObservable('cardData', cardData$);
        $scope.$bindObservable('isFiltered', isFiltered$);
        $scope.$bindObservable('expanded', expanded$);
        $scope.$bindObservable('currentRangeFilterValues', currentRangeFilterValues$);
        $scope.$bindObservable('visualizationType', visualizationType$);

        $scope.$destroyAsObservable(element).subscribe(function() {
          element.closest('card-visualization').css({ marginLeft: 0, marginRight: 0 });
          ColumnChartService.unregisterColumnChartEvents(element);
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationHistogram', cardVisualizationHistogram);

})();

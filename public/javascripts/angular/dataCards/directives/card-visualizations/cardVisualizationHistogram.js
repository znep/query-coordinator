(function() {
  'use strict';

  function cardVisualizationHistogram(CardDataService, HistogramService, Filter, $log) {

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
      link: function($scope) {
        var whereClause$ = $scope.$observe('whereClause');
        var isFiltered$ = whereClause$.map(_.isPresent);
        var cardModel = $scope.$observe('model');
        var datasetModel$ = cardModel.observeOnLatest('page.dataset');
        var baseSoqlFilter$ = cardModel.observeOnLatest('page.baseSoqlFilter');
        var aggregation$ = cardModel.observeOnLatest('page.aggregation');
        var activeFilters$ = cardModel.observeOnLatest('activeFilters');
        var fieldName$ = cardModel.pluck('fieldName');
        var cardId$ = cardModel.pluck('uniqueId');
        var bucketType$ = cardModel.observeOnLatest('bucketType');
        var expanded$ = cardModel.observeOnLatest('expanded');
        var rowDisplayUnit$ = cardModel.observeOnLatest('page.aggregation.unit');
        var filterSelected$ = $scope.$eventToObservable('toggle-dataset-filter:histogram').
          map(_.property('additionalArguments[0]'));

        var currentRangeFilterValues$ = activeFilters$.map(function(filters) {
          if (_.isPresent(filters)) {
            var valueRangeFilter = _(filters).chain().
              select(function(filter) { return filter instanceof Filter.ValueRangeFilter; }).
              first().value();
            if (_.isDefined(valueRangeFilter)) {
              return [valueRangeFilter.start, valueRangeFilter.end];
            }
          }
          return null;
        });

        var activeFiltersExcludingOwn$ = cardModel.observeOnLatest('page.activeFilters').
          withLatestFrom(
            cardId$,
            activeFilters$,
            function(activeFilters, cardId, ownFilters) {
              var cardFilters;
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

        var columnDataSummary$ = Rx.Observable.combineLatest(
          fieldName$,
          datasetModel$,
          bucketType$,
          baseSoqlFilter$,
          function(fieldName, dataset, bucketType) {

            // This promise will ultimately return an object in the form:
            // {min:, max:, bucketType:, bucketSize:}
            // See HistogramService.getBucketingOptions
            var dataPromise = CardDataService.getColumnDomain(fieldName, dataset.id, null).
              then(function(domain) {
                if (_.has(domain, 'min') && _.has(domain, 'max')) {
                  var cachedBucketOptions = HistogramService.getBucketingOptions(domain, bucketType);

                  // TODO: This should be reworked eventually when histogram rendering is revisited.
                  if (_.isUndefined(bucketType)) {
                    $scope.model.set('bucketType', cachedBucketOptions.bucketType);
                  }

                  return cachedBucketOptions;
                } else {
                  $scope.histogramRenderError = 'noData';
                }
              }
            );

            return Rx.Observable.fromPromise(dataPromise);
          }).
          switchLatest().
          distinctUntilChanged().
          filter(_.isDefined);

        var unfilteredData$ = Rx.Observable.combineLatest(
          fieldName$,
          datasetModel$,
          baseSoqlFilter$,
          aggregation$,
          columnDataSummary$,
          fetchHistogramData
        ).switchLatest();

        var filteredData$ = Rx.Observable.combineLatest(
          fieldName$,
          datasetModel$,
          whereClauseExcludingOwn$,
          aggregation$,
          columnDataSummary$,
          fetchHistogramData
        ).switchLatest();

        var cardData$ = Rx.Observable.combineLatest(
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

            return {
              unfiltered: unfiltered,
              filtered: filtered
            };
          }).
          catchException(function(error) {
            if (_.isError(error)) {
              $scope.histogramRenderError = error.message || true;
            } else {
              $scope.histogramRenderError = error || true;
            }
            return Rx.Observable.returnValue({ error: $scope.histogramRenderError });
          }).
          filter(function(data) {
            if (_.isDefined(data.unfiltered) && _.isDefined(data.filtered)) {
              return data.unfiltered.bucketType === data.filtered.bucketType;
            }
          }).
          map(function(data) {
            var unfilteredData = data.unfiltered.data;
            var filteredData = data.filtered.data;

            // While the filtered data doesn't have the same number of buckets as the unfiltered,
            // we need to create the missing buckets and give them values of zero.
            var i = 0;

            while (unfilteredData.length !== filteredData.length && i < unfilteredData.length) {
              var unfilteredDatum = unfilteredData[i];

              // If the filtered array doesn't contain an object with the same 'start' index as the
              // current unfiltered object, create new bucket and insert it into the filtered array.
              var noDatum = $.grep(filteredData, function(e) {
                return e.start === unfilteredDatum.start;
              }).length === 0;

              if (noDatum) {
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
          });

        $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
        $scope.$bindObservable('cardData', cardData$);
        $scope.$bindObservable('isFiltered', isFiltered$);
        $scope.$bindObservable('expanded', expanded$);
        $scope.$bindObservable('currentRangeFilterValues', currentRangeFilterValues$);
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationHistogram', cardVisualizationHistogram);

})();

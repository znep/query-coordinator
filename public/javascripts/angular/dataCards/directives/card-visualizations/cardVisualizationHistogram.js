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

      } else if(columnDataSummary.bucketType === 'logarithmic') {

        dataPromise = CardDataService.getMagnitudeData(
          fieldName,
          dataset.id,
          whereClauseFragment,
          aggregationData
        ).then(bucketData);

      } else {
        $log.error('Invalid bucket type "{0}"'.format(columnDataSummary.bucketType));
      }

      return Rx.Observable.fromPromise(dataPromise);
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
        var expanded$ = cardModel.observeOnLatest('expanded');
        var rowDisplayUnit$ = cardModel.observeOnLatest('page.aggregation.unit');

        var filterSelected$ = $scope.$eventToObservable('toggle-dataset-filter:histogram').
          map(_.property('additionalArguments[0]'));

        var selectionRange$ = activeFilters$.map(function(filters) {
          if (_.isPresent(filters)) {
            var valueRangeFilter = _(filters).chain().
              select(function(filter) { return filter instanceof Filter.ValueRangeFilter; }).
              first().value();
            if (_.isDefined(valueRangeFilter)) {
              return [valueRangeFilter.start, valueRangeFilter.end];
            }
          }
          return [0, 0];
        });

        var activeFiltersExcludingOwn$ = cardModel.observeOnLatest('page.activeFilters').
          withLatestFrom(
            fieldName$,
            activeFilters$,
            function(activeFilters, fieldName, ownFilters) {
              var cardFilters = _(activeFilters).chain().get(fieldName).difference(ownFilters).value();
              var filterHolder = _.extend({}, activeFilters);
              filterHolder[fieldName] = cardFilters;
              return filterHolder;
            });

        var whereClauseExcludingOwn$ = activeFiltersExcludingOwn$.
          map(function(filters) {
            var wheres = _.map(filters, function(operators, field) {
              if (_.isEmpty(operators)) {
                return null;
              } else {
                return _.invoke(operators, 'generateSoqlWhereFragment', field).join(' AND ');
              }
            });
            return _.compact(wheres).join(' AND ');
          }).startWith('');

        filterSelected$.subscribe(function(filterValues) {
          if (_.isDefined(filterValues)) {
            var filter = new Filter.ValueRangeFilter(filterValues[0], filterValues[1]);
            $scope.model.set('activeFilters', [filter]);
          } else {
            $scope.model.set('activeFilters', []);
          }
        });

        var nonBaseFilterApplied$ = Rx.Observable.combineLatest(
          whereClause$,
          baseSoqlFilter$,
          function (whereClause, baseSoqlFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseSoqlFilter;
          }).distinctUntilChanged();

        var columnDataSummary$ = Rx.Observable.combineLatest(
          fieldName$,
          datasetModel$,
          baseSoqlFilter$,
          function(fieldName, dataset, baseSoqlFilter) {

            // This promise will ultimately return an object in the form:
            // {min:, max:, bucketType:, bucketSize:}
            // See HistogramService.getBucketingOptions
            var dataPromise = CardDataService.getColumnDomain(fieldName, dataset.id, null).
              then(HistogramService.getBucketingOptions);

            return Rx.Observable.fromPromise(dataPromise);
          }).switchLatest();

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

        // Combine the filtered and unfiltered data into an object.
        var cardData$ = Rx.Observable.combineLatest(
          unfilteredData$,
          filteredData$,
          function(unfiltered, filtered) {
            if (!_.isArray(unfiltered) || !_.isArray(filtered)) {
              throw new Error('badData');
            }

            if (_.isEmpty(unfiltered)) {
              throw new Error('noData');
            }

            $scope.histogramRenderError = false;

            // While the filtered data doesn't have the same number of buckets as the unfiltered,
            // we need to create the missing buckets and give them values of zero.
            var i = 0;
            while (unfiltered.length !== filtered.length && i < unfiltered.length) {
              // If the filtered array doesn't contain an object with the same 'start' index as the
              // current unfiltered object, create new bucket and insert it into the filtered array.
              if ($.grep(filtered, function(e) {
                  return e.start === unfiltered[i].start;
              }).length === 0) {
                var newBucket = {
                  start: unfiltered[i].start,
                  end: unfiltered[i].end,
                  value: 0
                };
                filtered.splice(i, 0, newBucket);
              }
              i++;
            }

            return {
              unfiltered: unfiltered,
              filtered: filtered
            };
          }
        ).catchException(function(error) {
          if (_.isError(error)) {
            $scope.histogramRenderError = error.message || true;
          }
          else {
            $scope.histogramRenderError = error || true;
          }
          return Rx.Observable.returnValue({error: $scope.histogramRenderError});
        });

        $scope.$bindObservable('rowDisplayUnit', rowDisplayUnit$);
        $scope.$bindObservable('cardData', cardData$);
        $scope.$bindObservable('isFiltered', isFiltered$);
        $scope.$bindObservable('activeFilters', activeFilters$);
        $scope.$bindObservable('expanded', expanded$);
        $scope.$bindObservable('selectionRange', selectionRange$);
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationHistogram', cardVisualizationHistogram);

})();

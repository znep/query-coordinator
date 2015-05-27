(function() {
  'use strict';

  function cardVisualizationHistogram(Constants, CardDataService, HistogramService, Filter, $log) {

    /**
     * Fetches both unfiltered and filtered data.  Requests the data bucketed
     * either logarithmically (CardDataService.getMagnitudeData) or linearly
     * (CardDataService.getBucketedData), depending on contents of
     * columnDataSummary.
     */
    function fetchHistogramData($scope, fieldName, dataset, whereClauseFragment, aggregationData, columnDataSummary) {
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
        var filterApplied$ = whereClause$.map(_.isPresent);
        var cardModel = $scope.$observe('model');
        var datasetModel$ = cardModel.observeOnLatest('page.dataset');
        var baseSoqlFilter$ = cardModel.observeOnLatest('page.baseSoqlFilter');
        var aggregation$ = cardModel.observeOnLatest('page.aggregation');
        var activeFilters$ = cardModel.observeOnLatest('activeFilters');
        var fieldName$ = cardModel.pluck('fieldName');
        var expanded$ = cardModel.observeOnLatest('expanded');
        var rowDisplayUnit$ = cardModel.observeOnLatest('page.aggregation.unit');

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

            // First we get the min and max value of the column...
            var dataPromise = CardDataService.getColumnDomain(fieldName, dataset.id, null);

            // Then we decide on a bucketing type (and bucket size if linear)
            dataPromise.then(function(summary) {

              // TODO factor into service.
              var absMax = Math.max(Math.abs(summary.min), Math.abs(summary.max));
              var threshold = Constants.HISTOGRAM_LOGARITHMIC_BUCKETING_THRESHOLD;
              summary.bucketType = (absMax >= threshold) ? 'logarithmic' : 'linear';

              if (summary.bucketType === 'linear') {

                // Go away d3
                var buckets = d3.scale.linear().
                  nice().
                  domain([summary.min, summary.max]).
                  ticks(20);

                if (buckets.length >= 2) {
                  var bucketSize = buckets[1] - buckets[0];
                  summary.bucketSize = bucketSize;
                }
                else {
                  summary.bucketSize = 1;
                }
              }

              return summary;
            });

            return Rx.Observable.fromPromise(dataPromise);
          }).switchLatest();

        var unfilteredData$ = Rx.Observable.combineLatest(
          fieldName$,
          datasetModel$,
          baseSoqlFilter$,
          aggregation$,
          columnDataSummary$,
          _.curry(fetchHistogramData)($scope)
          ).switchLatest();

        var filteredData$ = Rx.Observable.combineLatest(
          fieldName$,
          datasetModel$,
          whereClause$,
          aggregation$,
          columnDataSummary$,
          _.curry(fetchHistogramData)($scope)
          ).switchLatest();

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
        $scope.$bindObservable('filterApplied', filterApplied$);
        $scope.$bindObservable('expanded', expanded$);
      }
    };
  }

  angular.
    module('dataCards.directives').
    directive('cardVisualizationHistogram', cardVisualizationHistogram);

})();

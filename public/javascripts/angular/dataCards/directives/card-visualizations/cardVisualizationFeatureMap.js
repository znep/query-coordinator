(function() {
  'use strict';

  function cardVisualizationFeatureMap(Constants, AngularRxExtensions, CardDataService, Filter) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationFeatureMap.html',
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        var model = scope.observe('model');
        var dataset = model.pluck('page').observeOnLatest('dataset');
        var baseSoqlFilter = model.pluck('page').observeOnLatest('baseSoqlFilter');
        var dataRequests = new Rx.Subject();
        var dataResponses = new Rx.Subject();
        var unfilteredDataSequence = new Rx.Subject();
        var filteredDataSequence = new Rx.Subject();

        // Keep track of the number of requests that have been made and the number of
        // responses that have come back.
        // .scan() is necessary because the usual aggregation suspect reduce actually
        // will not execute over a sequence until it has been completed; scan is happy
        // to operate on active sequences.
        var dataRequestCount = dataRequests.scan(0, function(acc, x) { return acc + 1; });
        var dataResponseCount = dataResponses.scan(0, function(acc, x) { return acc + 1; });


        function stringifyCoordinates(coordinates) {
          return coordinates[0] + ',' + coordinates[1];
        }

        function mergeUnfilteredAndFilteredData(unfilteredData, filteredData) {

          var unfilteredDataAsHash = _.reduce(unfilteredData, function(acc, datum) {
            acc[stringifyCoordinates(datum.name.coordinates)] = {
              feature: datum.name,
              value: datum.value
            };
            return acc;
          }, {});

          var filteredDataAsHash = _.reduce(unfilteredData, function(acc, datum) {
            acc[stringifyCoordinates(datum.name.coordinates)] = {
              feature: datum.name,
              value: datum.value
            };
            return acc;
          }, {});

          return unfilteredData.map(function(datum) {
            return {
              feature: new L.LatLng(datum.name.coordinates[1], datum.name.coordinates[0]),
              unfiltered: unfilteredDataAsHash[stringifyCoordinates(datum.name.coordinates)].value,
              filtered: filteredDataAsHash[stringifyCoordinates(datum.name.coordinates)].value
            };
          });

        }


        /*************************************
        * FIRST set up the 'busy' indicator. *
        *************************************/

        // If the number of requests is greater than the number of responses, we have
        // a request in progress and we should display the spinner.
        // SUPER IMPORTANT NOTE: Because of the way that RxJS works, we need to bind
        // this one here and not below with the other bound observables... so unfortunately
        // this code is location-dependent within the file.
        scope.bindObservable('busy',
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
          scope.observe('whereClause'),
          baseSoqlFilter,
          function (whereClause, baseFilter) {
            return !_.isEmpty(whereClause) && whereClause != baseFilter;
          }
        );

        Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          baseSoqlFilter,
          function(fieldName, dataset, whereClauseFragment) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment);
            dataPromise.then(
              function(res) {
                // Ok
                unfilteredDataSequence.onNext(dataPromise);
                dataResponses.onNext(1);
              },
              function(err) {
                // Do nothing
              });
            return Rx.Observable.fromPromise(dataPromise);
          });

        Rx.Observable.subscribeLatest(
          model.pluck('fieldName'),
          dataset,
          scope.observe('whereClause'),
          function(fieldName, dataset, whereClauseFragment) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getData(fieldName, dataset.id, whereClauseFragment);
            dataPromise.then(
              function(res) {
                // Ok
                filteredDataSequence.onNext(dataPromise);
                dataResponses.onNext(1);
              },
              function(err) {
                // Do nothing
              });
            return Rx.Observable.fromPromise(dataPromise);
          });


        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.bindObservable('baseLayerUrl', model.observeOnLatest('baseLayerUrl'));

        scope.bindObservable(
          'featureData',
          Rx.Observable.combineLatest(
            unfilteredDataSequence.switchLatest(),
            filteredDataSequence.switchLatest(),
            function(unfilteredData, filteredData) {

              return mergeUnfilteredAndFilteredData(unfilteredData, filteredData);

            }));

        scope.bindObservable(
          'featureLayerUrl',
          Rx.Observable.combineLatest(
            model.pluck('fieldName'),
            dataset,
            scope.observe('whereClause'),
            function(fieldName, dataset, whereClause) {

              var url = '/tiles/' + dataset.id + '/' + fieldName + '/{z}/{x}/{y}.pbf?$limit=50000';

              if (!_.isEmpty(whereClause)) {
                url += '&$where=' + encodeURIComponent(whereClause);
              }

              return url;
            }
          )
        );

        scope.bindObservable('rowDisplayUnit', dataset.observeOnLatest('rowDisplayUnit'));

      }
    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationFeatureMap', cardVisualizationFeatureMap);

})();

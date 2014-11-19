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
        var featureExtentDataSequence = new Rx.Subject();

        // Keep track of the number of requests that have been made and the number of
        // responses that have come back.
        // .scan() is necessary because the usual aggregation suspect reduce actually
        // will not execute over a sequence until it has been completed; scan is happy
        // to operate on active sequences.
        var dataRequestCount = dataRequests.scan(0, function(acc, x) { return acc + 1; });
        var dataResponseCount = dataResponses.scan(0, function(acc, x) { return acc + 1; });


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
            var dataPromise = CardDataService.getFeatureExtent(fieldName, dataset.id);
            dataPromise.then(
              function(res) {
                // Ok
                featureExtentDataSequence.onNext(dataPromise);
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
          'featureExtent',
          featureExtentDataSequence.switchLatest());

        scope.bindObservable(
          'featureLayerUrl',
          Rx.Observable.combineLatest(
            model.pluck('fieldName'),
            dataset,
            scope.observe('whereClause'),
            function(fieldName, dataset, whereClause) {

              // We can't use the .format() method here because we need to retain the literal
              // {z}, {x} and {y} components of the string provided to Leaflet as a tile URL
              // template.
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

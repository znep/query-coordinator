(function() {
  'use strict';

  function cardVisualizationFeatureMap(Constants, ServerConfig, AngularRxExtensions, CardDataService, Filter) {

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
        var dataset = model.observeOnLatest('page.dataset').filter(_.isPresent);
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
        var dataRequests = new Rx.Subject();
        var dataResponses = new Rx.Subject();
        var featureExtentDataSequence = new Rx.Subject();

        // The 'render:start' and 'render:complete' events are emitted by the
        // underlying feature map and are used for a) toggling the state of the
        // 'busy' spinner and b) performance analytics.
        scope.$on('render:start', function(e) {
          scope.busy = true;
        });

        scope.$on('render:complete', function(e) {
          scope.busy = false;
        });

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

        scope.bindObservable(
          'baseLayerUrl',
          model.observeOnLatest('baseLayerUrl')
        );

        scope.bindObservable(
          'featureExtent',
          featureExtentDataSequence.switchLatest()
        );

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
              //
              // The limit of 65,536 is the number of unique points that could potentially be
              // drawn on a 256x256 tile.
              var url = '/tiles/' +
                dataset.id +
                '/' +
                fieldName +
                '/{z}/{x}/{y}.pbf?$limit=' +
                String(Math.pow(256, 2));

              // Tile requests do not go through $http, so we must add the app token parameter here.
              // Technically the preferred method is through a header, but there's no easy way to
              // do that here.
              var appToken = ServerConfig.get('dataCardsAppToken');
              if (!_.isEmpty(appToken)) {
                url += '&$$app_token=' + appToken;
              }

              if (!_.isEmpty(whereClause)) {
                url += '&$where=' + encodeURIComponent(whereClause);
              }

              return url;
            }
          )
        );

        scope.bindObservable(
          'rowDisplayUnit',
          dataset.observeOnLatest('rowDisplayUnit')
        );

      }
    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationFeatureMap', cardVisualizationFeatureMap);

})();

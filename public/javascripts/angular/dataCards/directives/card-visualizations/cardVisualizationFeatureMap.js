(function() {
  'use strict';

  function cardVisualizationFeatureMap(ServerConfig, AngularRxExtensions, CardDataService, VectorTileDataService) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationFeatureMap.html',
      link: function(scope) {

        AngularRxExtensions.install(scope);

        var model = scope.observe('model');
        var dataset = model.observeOnLatest('page.dataset').filter(_.isPresent);
        var datasetPermissions = dataset.observeOnLatest('permissions').filter(_.isPresent);
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
          baseSoqlFilter, // Used for signalling that this combineLatest should run
          function(fieldName, dataset) {
            dataRequests.onNext(1);
            var dataPromise = CardDataService.getFeatureExtent(fieldName, dataset.id);
            dataPromise.then(
              function() {
                // Ok
                featureExtentDataSequence.onNext(dataPromise);
                dataResponses.onNext(1);
              },
              _.noop);
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

        var datasetIsPrivate = datasetPermissions.
          map(function(permissions) {
            return !permissions.isPublic;
          }).
          startWith(true);

        var vectorTileGetterSequence = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset.pluck('id'),
          scope.observe('whereClause'),
          datasetIsPrivate,
          function(fieldName, datasetId, whereClause, datasetIsPrivate) {
            return VectorTileDataService.buildTileGetter(fieldName, datasetId, whereClause, datasetIsPrivate);
          });

        scope.bindObservable('vectorTileGetter', vectorTileGetterSequence);

        scope.bindObservable(
          'rowDisplayUnit',
          dataset.observeOnLatest('rowDisplayUnit')
        );

        scope.zoomDebounceMilliseconds = ServerConfig.get('featureMapZoomDebounce');

      }
    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationFeatureMap', cardVisualizationFeatureMap);

})();

(function() {
  'use strict';

  function cardVisualizationFeatureMap(
    ServerConfig,
    AngularRxExtensions,
    CardDataService,
    VectorTileDataService
  ) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationFeatureMap.html',
      link: function cardVisualizationFeatureMapLink(scope) {

        AngularRxExtensions.install(scope);

        var model = scope.observe('model');
        var dataset = model.observeOnLatest('page.dataset').filter(_.isPresent);
        var datasetPermissions = dataset.observeOnLatest('permissions').filter(_.isPresent);
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');

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

        var synchronizedFieldnameDataset = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset,
          baseSoqlFilter,
          function(fieldName, dataset) {
            return {
              fieldName: fieldName,
              dataset: dataset
            };
          }
        );

        var featureExtentDataSequence = synchronizedFieldnameDataset.
          flatMap(function(fieldNameDataset) {
            var fieldName = fieldNameDataset.fieldName;
            var dataset = fieldNameDataset.dataset;
            var defaultFeatureExtent = CardDataService.getDefaultFeatureExtent();
            if (defaultFeatureExtent) {
              return Rx.Observable.returnValue(defaultFeatureExtent);
            } else {
              return Rx.Observable.
                fromPromise(CardDataService.getFeatureExtent(fieldName, dataset.id));
            }
          });

        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.bindObservable(
          'baseLayerUrl',
          model.observeOnLatest('baseLayerUrl')
        );

        scope.bindObservable('featureExtent', featureExtentDataSequence);

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
            return VectorTileDataService.
              buildTileGetter(fieldName, datasetId, whereClause, datasetIsPrivate);
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

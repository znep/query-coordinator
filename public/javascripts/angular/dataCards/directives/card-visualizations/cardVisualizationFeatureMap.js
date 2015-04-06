(function() {
  'use strict';

  function cardVisualizationFeatureMap(
    ServerConfig,
    AngularRxExtensions,
    CardDataService,
    VectorTileDataService,
    LeafletHelpersService
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
            return Rx.Observable.
              fromPromise(CardDataService.getFeatureExtent(fieldName, dataset.id));
          });

        var synchronizedFeatureExtentDataSequence = featureExtentDataSequence.
          combineLatest(
          Rx.Observable.returnValue(CardDataService.getDefaultFeatureExtent()),
          function(featureExtent, defaultFeatureExtent) {
            if (defaultFeatureExtent) {
              var defaultBounds;
              var featureBounds;
              try {
                defaultBounds = LeafletHelpersService.buildBounds(defaultFeatureExtent);
              } catch(error) {
                $log.warn(
                  'Unable to build bounds from defaultFeatureExtent: \n{0}'.
                    format(defaultFeatureExtent)
                );
                return featureExtent;
              }
              try {
                featureBounds = LeafletHelpersService.buildBounds(featureExtent);
              } catch(error) {
                $log.warn(
                  'Unable to build bounds from featureExtent: \n{0}'.
                    format(featureExtent)
                );
                return featureExtent;
              }
              if (defaultBounds.contains(featureBounds)) {
                return featureExtent;
              } else {
                return defaultFeatureExtent;
              }
            } else {
              return featureExtent;
            }
          });

        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.bindObservable(
          'baseLayerUrl',
          model.observeOnLatest('baseLayerUrl')
        );

        scope.bindObservable('featureExtent', synchronizedFeatureExtentDataSequence);

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

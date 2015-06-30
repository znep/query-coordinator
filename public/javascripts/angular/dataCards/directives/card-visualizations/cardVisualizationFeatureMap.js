(function() {
  'use strict';

  var TIMER_TIMEOUT_MILLISECONDS = 5000;

  function createTimerObservable() {
    return Rx.Observable.timer(TIMER_TIMEOUT_MILLISECONDS, Rx.Scheduler.timeout);
  }

  function cardVisualizationFeatureMap(
    $log,
    ServerConfig,
    CardDataService,
    VectorTileDataService,
    LeafletHelpersService,
    LeafletVisualizationHelpersService
  ) {

    return {
      restrict: 'E',
      scope: {
        'model': '=',
        'whereClause': '='
      },
      templateUrl: '/angular_templates/dataCards/cardVisualizationFeatureMap.html',
      link: function cardVisualizationFeatureMapLink(scope) {
        var model = scope.$observe('model');
        var dataset = model.observeOnLatest('page.dataset').filter(_.isPresent);
        var datasetPermissions = dataset.observeOnLatest('permissions').filter(_.isPresent);
        var baseSoqlFilter = model.observeOnLatest('page.baseSoqlFilter');
        var whereClauseObservable = scope.$observe('whereClause');
        var savedExtent$ = model.observeOnLatest('cardOptions.mapExtent').take(1);
        var defaultExtent$ = Rx.Observable.
          returnValue(CardDataService.getDefaultFeatureExtent());

        // The 'render:start' and 'render:complete' events are emitted by the
        // underlying feature map and are used for a) toggling the state of the
        // 'busy' spinner and b) performance analytics.
        var renderStartObservable = scope.$eventToObservable('render:start');
        var renderErrorObservable = scope.$eventToObservable('render:error');
        var renderCompleteObservable = scope.$eventToObservable('render:complete').
          takeUntil(renderErrorObservable);

        LeafletVisualizationHelpersService.setObservedExtentOnModel(scope, scope.model);

        // For every renderStart event, start a timer that will either expire on
        // its own, or get cancelled by the renderComplete event firing
        var renderTimeoutObservable = renderStartObservable.
          flatMap(createTimerObservable).
          takeUntil(renderCompleteObservable);

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

        // Start a timer when the card is ready to render, that will either
        // expire on its own, or get cancelled by a renderComplete event
        var directiveTimeoutObservable = synchronizedFieldnameDataset.
          flatMap(createTimerObservable).
          takeUntil(renderCompleteObservable);

        // Display the error whenever something has timed out, clear it whenever
        // we successfully render
        var displayRenderErrorObservable = Rx.Observable.
          merge(
            renderTimeoutObservable.map(_.constant(true)),
            directiveTimeoutObservable.map(_.constant(true)),
            renderErrorObservable.map(_.constant(true)),
            renderCompleteObservable.map(_.constant(false))
          ).
          startWith(false).
          distinctUntilChanged();

        scope.$bindObservable('displayRenderError', displayRenderErrorObservable);

        // Show the busy indicator when we are ready to render, and when we have
        // started rendering.  Clear the indicator when things have timed out
        // (i.e. we are showing the render error), or when rendering has
        // completed successfully
        var busyObservable = Rx.Observable.
          merge(
            synchronizedFieldnameDataset.map(_.constant(true)),
            renderStartObservable.map(_.constant(true)),
            renderTimeoutObservable.map(_.constant(false)),
            directiveTimeoutObservable.map(_.constant(false)),
            renderCompleteObservable.map(_.constant(false)),
            renderErrorObservable.map(_.constant(false))
        ).
          startWith(true).
          distinctUntilChanged();

        scope.$bindObservable('busy', busyObservable);

        var serverExtent$ = synchronizedFieldnameDataset.
          flatMap(function(fieldNameDataset) {
            var fieldName = fieldNameDataset.fieldName;
            var dataset = fieldNameDataset.dataset;
            return Rx.Observable.
              fromPromise(CardDataService.getFeatureExtent(fieldName, dataset.id));
          }).
          onErrorResumeNext(Rx.Observable.empty());  // Promise error becomes empty observable

        // TODO - Fix synchronization here - not getting saved value
        var synchronizedFeatureExtentDataSequence = serverExtent$.
          startWith(undefined).
          combineLatest(
          defaultExtent$,
          savedExtent$,
          function(serverExtent, defaultExtent, savedExtent) {
            if (_.isPresent(savedExtent)) {
              return savedExtent;
            }
            else if (defaultExtent) {
              var defaultBounds;
              var featureBounds;
              try {
                defaultBounds = LeafletHelpersService.buildBounds(defaultExtent);
              } catch(error) {
                $log.warn(
                  'Unable to build bounds from defaultExtent: \n{0}'.
                    format(defaultExtent)
                );
                return serverExtent;
              }
              try {
                featureBounds = LeafletHelpersService.buildBounds(serverExtent);
              } catch(error) {
                $log.warn(
                  'Unable to build bounds from serverExtent: \n{0}'.
                    format(serverExtent)
                );
                return serverExtent;
              }
              if (defaultBounds.contains(featureBounds)) {
                return serverExtent;
              } else {
                return defaultExtent;
              }
            } else {
              return serverExtent;
            }
          });

        /****************************************
        * Bind non-busy-indicating observables. *
        ****************************************/

        scope.$bindObservable(
          'baseLayerUrl',
          model.observeOnLatest('baseLayerUrl')
        );

        scope.$bindObservable('featureExtent', synchronizedFeatureExtentDataSequence);

        var featureSet = ServerConfig.getFeatureSet();

        var datasetIsPrivateObservable = datasetPermissions.
          map(function(permissions) {
            return !permissions.isPublic;
          }).
          startWith(true);

        var stagingApiLockdownObservable = Rx.Observable.
          returnValue(_.get(featureSet, 'staging_api_lockdown', false));

        var stagingLockdownObservable = Rx.Observable.
          returnValue(_.get(featureSet, 'staging_lockdown', false));

        var useOriginHostObservable = Rx.Observable.combineLatest(
          datasetIsPrivateObservable,
          stagingApiLockdownObservable,
          stagingLockdownObservable,
          function(datasetIsPrivate, stagingApiLockdown, stagingLockdown) {
            return datasetIsPrivate || stagingApiLockdown || stagingLockdown;
          });

        var vectorTileGetterSequence = Rx.Observable.combineLatest(
          model.pluck('fieldName'),
          dataset.pluck('id'),
          whereClauseObservable,
          useOriginHostObservable,
          VectorTileDataService.buildTileGetter);

        scope.$bindObservable('vectorTileGetter', vectorTileGetterSequence);

        scope.$bindObservable(
          'rowDisplayUnit',
          dataset.observeOnLatest('rowDisplayUnit')
        );

        scope.zoomDebounceMilliseconds = ServerConfig.get('featureMapZoomDebounce');

        scope.disablePanAndZoom = ServerConfig.get('featureMapDisablePanZoom');
      }
    };

  }

  angular.
    module('dataCards.directives').
      directive('cardVisualizationFeatureMap', cardVisualizationFeatureMap);

})();

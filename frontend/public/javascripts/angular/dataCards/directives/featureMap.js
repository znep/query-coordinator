var templateUrl = require('angular_templates/dataCards/featureMap.html');
const FeatureMap = require('common/visualizations').views.FeatureMap;
const RowInspector = require('common/visualizations').views.RowInspector;

module.exports = function featureMap(
  $compile,
  $rootScope,
  $window,
  Constants,
  FeatureMapService,
  LeafletHelpersService,
  LeafletVisualizationHelpersService,
  FlyoutService,
  I18n,
  PluralizeService,
  ServerConfig,
  WindowState,
  rx) {
  const Rx = rx;
  return {
    restrict: 'E',
    scope: true,
    controller: 'FeatureMapController',
    templateUrl: templateUrl,
    link: function($scope, element) {

      var baseLayerUrl$ = $scope.$observe('baseLayerUrl');
      var featureExtent$ = $scope.$observe('featureExtent');
      var vectorTileGetter$ = $scope.$observe('vectorTileGetter');
      var destroy$ = $scope.$destroyAsObservable(element);
      var dimensions$;

      var visualization;
      var visualizationElement;
      var featureMapConfig;
      var visualizationRenderOptions;
      var hasDimensions = false;

      // Holds flyout-related state. Offset is specified in absolute pixels
      // because we don't have an element to position the flyout on.
      var flyoutOffset;
      var flyoutTemplate;

      var queryHandler;
      var scrollSubscription;

      // We need to migrate the VIF in order to render properly. Once we're using the jQuery
      // plugins, we won't need to do this anymore.
      featureMapConfig = {
        configuration: {
          baseLayerOpacity: Constants.DEFAULT_MAP_BASE_LAYER_OPACITY,
          baseLayerUrl: Constants.MAPBOX_SIMPLE_BLUE_BASE_LAYER_URL,
          debug: ServerConfig.get('debug_data_lens'),
          hover: true,
          localization: {
            flyout_filter_notice: I18n.flyout.filterPrompt,
            flyout_filter_or_zoom_notice: I18n.flyout.zoomOrFilterPrompt,
            flyout_dense_data_notice: I18n.flyout.denseData,
            flyout_click_to_inspect_notice: I18n.flyout.details,
            flyout_pan_zoom_disabled_warning_title: I18n.featureMap.zoomDisabled
          },
          mapOptions: {
            zoomAnimation: !Constants.DISABLE_LEAFLET_ZOOM_ANIMATION
          },
          maxTileDensity: Constants.FEATURE_MAP_MAX_TILE_DENSITY,
          maxRowInspectorDensity: Constants.FEATURE_MAP_FLANNEL_MAX_ROW_DENSITY,
          panAndZoom: !$scope.disablePanAndZoom
        }
      };

      // The visualizationRenderOptions may change in response to user actions
      // and are passed as an argument to every render call.
      visualizationRenderOptions = {
        baseLayer: {
          url: featureMapConfig.configuration.baseLayerUrl,
          opacity: featureMapConfig.configuration.baseLayerOpacity
        },
        unit: {
          one: $scope.rowDisplayUnit,
          other: PluralizeService.pluralize($scope.rowDisplayUnit)
        }
      };

      // Initialize visualization and attach event handlers
      visualizationElement = element.find('.feature-map');
      visualization = new FeatureMap(visualizationElement, featureMapConfig);
      attachEvents();

      // Initialize RowInspector (also from frontend-visualizations)
      var rowInspectorConfig = {
        localization: {
          previous: I18n.featureMapFlannel.previous,
          next: I18n.featureMapFlannel.next,
          defaultLabelUnit: $scope.rowDisplayUnit,
          showing: I18n.featureMapFlannel.showing,
          paging: I18n.featureMapFlannel.paging
        }
      };

      RowInspector.setup(rowInspectorConfig);

      /**
       * Attach event handlers
       */
      function attachEvents() {
        visualizationElement.on('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START', handleRenderStart);
        visualizationElement.on('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE', handleRenderComplete);
        visualizationElement.on('SOCRATA_VISUALIZATION_FEATURE_MAP_EXTENT_CHANGE', handleExtentChange);
        visualizationElement.on('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleHoverFlyout);
        visualizationElement.on('SOCRATA_VISUALIZATION_FLYOUT_HIDE', hideHoverFlyout);

        // Control the hover flyout by registering when the mouse enters the map
        // and degistering when the mouse exits the map, so flyouts work across
        // multiple maps.
        // (Register then deregister also ensures proper page-wide behavior of
        // flyout hiding upon click. Feature map flyouts will not hide on click,
        // but others by default still will unless otherwise specified).
        visualizationElement.on('mouseover', registerHoverFlyout);
        visualizationElement.on('mouseout', deregisterHoverFlyout);

        visualizationElement.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);

        // CORE-4832 - disable pan and zoom on feature map
        if ($scope.disablePanAndZoom === true) {
          FlyoutService.register({
            selector: '.feature-map-pan-zoom-disabled-warning',
            render: renderPanZoomWarningFlyout,
            destroySignal: destroy$
          });
        }
      }

      /**
       * Detach event handlers, used when destroying visualization
       */
      function detachEvents() {
        visualizationElement.off('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_START', handleRenderStart);
        visualizationElement.off('SOCRATA_VISUALIZATION_FEATURE_MAP_RENDER_COMPLETE', handleRenderComplete);
        visualizationElement.off('SOCRATA_VISUALIZATION_FEATURE_MAP_EXTENT_CHANGE', handleExtentChange);
        visualizationElement.off('SOCRATA_VISUALIZATION_FLYOUT_SHOW', handleHoverFlyout);
        visualizationElement.off('SOCRATA_VISUALIZATION_FLYOUT_HIDE', hideHoverFlyout);

        visualizationElement.off('mouseover', registerHoverFlyout);
        visualizationElement.off('mouseout', deregisterHoverFlyout);

        visualizationElement.off('SOCRATA_VISUALIZATION_ROW_INSPECTOR_QUERY', handleRowInspectorQuery);
      }

      /**
       * Emit a 'render:start' event that will be consumed by
       * FeatureMapController to determine when to show the spinner
       * and by the analytics system to record render timings.
       */
      function handleRenderStart() {
        $scope.$safeApply(function() {
          $scope.$emit('render:start', { source: `feature_map_${$scope.$id}`, timestamp: _.now(), tag: 'vector_tile_render' });
        });
      }

      /**
       * Emit a 'render:complete' event that will be consumed by
       * cardVisualizationFeatureMap to determine when to show the spinner
       * and by the analytics system to record render timings.
       */
      function handleRenderComplete() {
        $scope.$safeApply(function() {
          $scope.$emit('render:complete', { source: `feature_map_${$scope.$id}`, timestamp: _.now(), tag: 'vector_tile_render' });
        });
      }

      /**
       * Emit a 'set-extent' event that will be consumed by
       * LeafletVisualizationHelpersService.setObservedExtentOnModel
       * to save extent changes made by the user to the card model.
       */
      function handleExtentChange(e) {
        var newExtents = e.originalEvent.detail;
        $scope.$emit('set-extent', newExtents);
      }

      /**
       * Handle assembling flyout
       */
      function handleHoverFlyout(e) {
        var payload = e.originalEvent.detail;

        // visualizations emit the same event for feature flyouts and
        // pan and zoom disabled warning. By checking for `flyoutOffset` on the
        // payload, we filter out the pan and zoom disabled warning. While that
        // flyout returns which element to target, the selector doesn't change,
        // so we register it once (below), rather than registering it on the fly
        // inside of here.
        if (_.has(payload, 'flyoutOffset')) {
          flyoutOffset = payload.flyoutOffset;
          flyoutTemplate = [
            `<div class="flyout-title">${payload.title}</div>`,
            `<div class="flyout-cell">${payload.notice}</div>`
          ].join('');
        }
      }

      /**
       * Return feature flyout template
       */
      function renderFeatureFlyout() {
        return flyoutTemplate;
      }

      /**
       * Return feature flyout offsets
       */
      function featureFlyoutOffset() {
        return flyoutOffset;
      }

      /**
       * Return disable pan and zoom flyout template
       */
      function renderPanZoomWarningFlyout() {
        return `<div class="flyout-title">${I18n.featureMap.zoomDisabled}</div>`;
      }

      /**
       * Handle hiding flyout
       */
      function hideHoverFlyout() {
        flyoutTemplate = undefined;
        FlyoutService.hide();
      }

      /**
       * Register hover flyout
       */
      function registerHoverFlyout() {
        FlyoutService.register({
          selector: 'canvas',
          render: renderFeatureFlyout,
          getOffset: featureFlyoutOffset,
          destroySignal: destroy$,
          persistOnMousedown: true
        });
      }

      /**
       * Deregister hover flyout
       */
      function deregisterHoverFlyout() {
        FlyoutService.deregister('canvas', renderFeatureFlyout);
      }

      /**
       * Handle flannels (aka: RowInspector)
       *
       * If enabled:
       * Handles feature map interaction in the form of cursor click.
       *
       * When point(s) are clicked, displays a flannel reporting information from table
       * corresponding to the rows they represent. Flannel can be cleared by reclicking
       * the point(s), clicking elsewhere in the map, clicking elsewhere on the page,
       * or clicking on the flannel's close icon. Flannel has a spinner while query
       * is pending, and reports an error if the query fails.
       */
      function handleRowInspectorQuery(e) {
        var payload = e.originalEvent.detail;

        // Hide any hover flyouts
        if (_.isDefined(payload.rowCount)) {
          FlyoutService.hide();
        }

        // Clean up any previous handlers
        if (_.isDefined(queryHandler)) {
          queryHandler.dispose();
          queryHandler = undefined;
        }

        if (_.isDefined(scrollSubscription)) {
          scrollSubscription.dispose();
          scrollSubscription = undefined;
        }

        // Kick off and manage query for clicked row data
        var rowQueryResponse$ = $scope.getClickedRows(
          payload.latLng,
          payload.rowCount,
          payload.queryBounds
        );

        // Provoke an update of flannel content based on status of query result.
        // Will show an error message of the query failed, otherwise the formatted
        // results of the query.
        queryHandler = rowQueryResponse$.take(1).filter(_.isDefined).subscribe(
          handleRowInspectorQuerySuccess,
          handleRowInspectorQueryError
        );

        // Shift flannel position if scroll occurs
        scrollSubscription = WindowState.scrollPosition$.subscribe(adjustRowInspectorPosition);

        e.stopPropagation();
      }

      /**
       * Handle row inspector query success
       */
      function handleRowInspectorQuerySuccess(data) {
        var dataPayload = FeatureMapService.formatRowInspectorQueryResponse(data);

        // RowInspector is listening for events emitted on document.body
        $window.document.body.dispatchEvent(
          new $window.CustomEvent(
            'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
            {
              detail: {
                data: dataPayload.rows,
                error: false,
                message: null,
                titles: dataPayload.titles,
                allowUnsafeContent: true
              },
              bubbles: true
            }
          )
        );
      }

      /**
       * Handle row inspector query error
       */
      function handleRowInspectorQueryError() {
        // RowInspector is listening for events emitted on document.body
        $window.document.body.dispatchEvent(
          new $window.CustomEvent(
            'SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE',
            {
              detail: {
                data: null,
                error: true,
                message: I18n.featureMapFlannel.errorMessage
              },
              bubbles: true
            }
          )
        );
      }

      /**
       * Adjust row inspector's position
       */
      function adjustRowInspectorPosition() {
        // RowInspector is listening for events emitted on document.body
        $window.document.body.dispatchEvent(
          new $window.CustomEvent(
            'SOCRATA_VISUALIZATION_ROW_INSPECTOR_ADJUST_POSITION',
            null
          )
        );
      }

      /**
       * Render visualization only if bounds and vectorTileGetter are defined
       */
      function renderIfReady() {
        var hasBounds = _.has(visualizationRenderOptions, 'bounds');
        var hasTileGetter = _.has(visualizationRenderOptions, 'vectorTileGetter');

        if (hasDimensions && hasBounds && hasTileGetter) {
          visualization.render(visualizationRenderOptions);
        }
      }

      // Keep the baseTileLayer in sync with the baseLayerUrl observable.
      baseLayerUrl$.
        map(function(urlFromScope) {
          var resultUrl;
          if (_.isNull(urlFromScope) || _.isUndefined(urlFromScope)) {
            resultUrl = Constants.MAPBOX_SIMPLE_BLUE_BASE_LAYER_URL;
          } else {
            resultUrl = urlFromScope;
          }
          var opacity =
            urlFromScope === Constants.MAPBOX_SIMPLE_GREY_BASE_LAYER_URL
              ? Constants.SIMPLE_GREY_MAP_BASE_LAYER_OPACITY
              : Constants.DEFAULT_MAP_BASE_LAYER_OPACITY;

          return {
            url: resultUrl,
            opacity: opacity
          };
        }).
        distinctUntilChanged(_.property('url')).
        subscribe(function(layerInfo) {
          visualizationRenderOptions.baseLayer = layerInfo;
          renderIfReady();
        });

      // Observe map dimensions exist and have a height and width.
      // Ensures user has the window open, which avoids rendering bugs.
      dimensions$ = element.observeDimensions().
        throttle(500, Rx.Scheduler.timeout).
        filter(function(dimensions) {
          return _.isObject(dimensions) && dimensions.width > 0 && dimensions.height > 0;
        });

      // We want to set the bounds before we start requesting tiles so that
      // we don't make a bunch of requests for zoom level 1 while we are
      // waiting for the extent query to come back.
      Rx.Observable.subscribeLatest(
        featureExtent$.filter(_.isDefined),
        dimensions$.take(1),
        function(featureExtent) {
          var bounds = LeafletHelpersService.buildBounds(featureExtent);
          visualizationRenderOptions.bounds = bounds;
          hasDimensions = true;
          renderIfReady();
        });

      // If the server-provided extent is undefined, defer to zoom level 1
      Rx.Observable.subscribeLatest(
        featureExtent$.filter(_.isUndefined),
        dimensions$.take(1),
        function() {
          hasDimensions = true;
          visualization.invalidateSize();
        });

      // React to changes to the vectorTileGetter observable
      // (which changes indicate that a re-render is needed).
      // Only render once the feature extent has been defined.
      Rx.Observable.subscribeLatest(
        vectorTileGetter$.filter(_.isFunction),
        featureExtent$.filter(_.isDefined), // Used for signaling to create feature layer
        function(vectorTileGetter) {
          visualizationRenderOptions.vectorTileGetter = vectorTileGetterPromise(vectorTileGetter);
          renderIfReady();
        }
      );

      /**
       * Wraps vectorTileGetter in order to handle PhantomJS error
       */
      function vectorTileGetterPromise(vectorTileGetter) {
        return function() {
          return vectorTileGetter.apply(this, Array.prototype.slice.call(arguments))['catch'](function() {
              $scope.$safeApply(function() {

                // CORE-5208: PhantomJS always produces an error here even
                // though it successfully renders the points. For now we
                // are making an exception to improve the polaroid
                // experience until we can investigate the cause further.
                if (!$window._phantom) {
                  $scope.$emit('render:error');
                }
              });
            });
        };
      }

      dimensions$.skip(1).subscribe(function() {
          visualization.invalidateSize();
        });

      // Visualization needs to be told to clean up after itself.
      destroy$.subscribe(function() {
        detachEvents();
        if (visualization) {
          visualization.destroy();
        }
      });
    }
  };
};

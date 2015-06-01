(function() {
  'use strict';

  function FeatureMap(
    Constants,
    VectorTiles,
    LeafletHelpersService,
    FlyoutService
  ) {
    return {
      restrict: 'E',
      scope: {
        'baseLayerUrl': '=',
        'featureExtent': '=',
        'zoomDebounceMilliseconds': '=',
        'vectorTileGetter': '=',
        'rowDisplayUnit': '=?',
        'disablePanAndZoom': '='
      },
      templateUrl: '/angular_templates/dataCards/featureMap.html',
      link: function(scope, element) {
        var baseLayerUrlObservable = scope.$observe('baseLayerUrl');
        var featureExtentObservable = scope.$observe('featureExtent');
        var vectorTileGetterObservable = scope.$observe('vectorTileGetter');

        var mapOptions = {
          attributionControl: false,
          center: [47.609895, -122.330259], // Center on Seattle by default.
          keyboard: false,
          scrollWheelZoom: false,
          zoom: 1,
          zoomControlPosition: 'topleft'
        };

        if (Constants.DISABLE_LEAFLET_ZOOM_ANIMATION) {
          options.zoomAnimation = false;
        }

        // CORE-4832 - disable pan and zoom on feature map
        if (scope.disablePanAndZoom === true) {
          $.extend(mapOptions, {
            dragging: false,
            zoomControl: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false
          });
          scope.showPanZoomDisabledWarning = true;
          $(element).children('.feature-map-container').css('cursor', 'default');

          FlyoutService.register({
            className: 'pan-zoom-disabled-warning-icon',
            render: _.constant(
              '<div class="flyout-title">Zoom is temporarily unavailable. Please try again later.</div>'
            ),
            destroySignal: scope.$destroyAsObservable()
          });
        }

        var map = L.map(element.find('.feature-map-container')[0], mapOptions);
        // We buffer feature layers so that there isn't a visible flash
        // of emptiness when we transition from one to the next. This is accomplished
        // by only removing the previous layers when the current one completes rendering.
        var featureLayers = new Map();
        // We also keep a handle on the current feature layer Url so we know which of
        // the existing layers we can safely remove (i.e. not the current one).
        var currentVectorTileGetter;
        var startResizeFn = null;
        var completeResizeFn = null;
        var baseTileLayerObservable;
        var dimensions$;
        var RESIZE_DEBOUNCE_INTERVAL = 250;

        /**
         * Returns a unique string id for a feature that will be used as a key
         * into a key => value hash. The 'index' parameter is the index of this
         * feature into the array of all features.
         *
         * @param feature - The feature for which we will compute an id.
         * @param index - The index of the feature into the tile's collection
         *   of features.
         * @returns {String}
         */
        function getFeatureId(feature, index) {
          return String(index);
        }

        /**
         * Returns true for features that should be drawn and false for features
         * that should not be drawn.
         *
         * @param feature - The feature that we will style.
         * @param context - The canvas 2d context to which we are drawing.
         * @returns {Boolean}
         */
        function filterLayerFeature(feature, context) {
          return true;
        }

        /**
         * Returns the 'z-index' at which the feature should be drawn.
         *
         * @param feature - The feature that we will style.
         * @returns {Number}
         */
        function getFeatureZIndex(feature) {
          return 1;
        }

        /**
         * Scales points according to zoom level. The maximum zoom level
         * in Leaflet is 18; the minimum is 1.
         *
         * @param zoomLevel - The current zoom level of the map.
         * @returns {Number}
         */
        function scalePointFeatureRadiusByZoomLevel(zoomLevel) {
          // This was created somewhat arbitrarily by Chris to
          // result in point features which get slightly larger
          // as the map is zoomed in. It can be replaced with
          // any function which computes a number that makes
          // sense as the radius of a point feature in pixels.
          return Math.pow(zoomLevel * 0.125, 2) + 1;
        }

        /**
         * Returns an object specifying the styles with which a point feature
         * will be rendered.
         *
         * This function is called by the Vector Tile Layer extension to Leaflet
         * as it iterates over features in a vector tile.
         *
         * @returns {Object} - A style object that will be used to render the
         *   feature.
         */
        function getPointStyle() {
          return {
            color: 'rgba(48,134,171,1.0)',
            radius: scalePointFeatureRadiusByZoomLevel,
            lineWidth: 1,
            strokeStyle: 'rgba(255,255,255,1.0)'
          };
        }

        /**
         * Returns an object specifying the styles with which a line string
         * feature will be rendered.
         *
         * This function is called by the Vector Tile Layer extension to Leaflet
         * as it iterates over features in a vector tile.
         *
         * @returns {Object} - A style object that will be used to render the
         *   feature.
         */
        function getLineStringStyle() {
          return {
            color: 'rgba(161,217,155,0.8)',
            size: 3
          };
        }

        /**
         * Returns an object specifying the styles with which a polygon feature
         * will be rendered.
         *
         * This function is called by the Vector Tile Layer extension to Leaflet
         * as it iterates over features in a vector tile.
         *
         * @returns {Object} - A style object that will be used to render the
         *   feature.
         */
        function getPolygonStyle() {
          return {
            color: 'rgba(149,139,255,0.4)',
            outline: {
              color: 'rgb(20,20,20)',
              size: 2
            }
          };
        }

        /**
         * Provides a generic interface to the styling functions above and
         * dispatches requests to the appropriate type based on the feature
         * being styled.
         *
         * @param feature - The feature that we will style.
         * @returns {Object} - A function that can be used to generate a style
         *   object.
         */
        function getFeatureStyle(feature) {

          var style = {
            selected: {}
          };

          switch (feature.type) {

            // Point
            case 1:
              return getPointStyle();

            // LineString
            case 2:
              return getLineStringStyle();

            // Polygon
            case 3:
              return getPolygonStyle();

            default:
              throw new Error('Cannot apply style to unknown feature type "' + feature.type + '".');
          }
        }

        /**
         * Creates a new feature layer with a specific tileServer endpoint
         * and adds it to the map. Because of the way vector tiles are
         * implemented (in mapbox-vector-tiles.js) it is necessary to
         * create an entirely new feature layer every time the page's
         * global where clause changes.
         *
         * This function should be used in conjunction with removeOldFeatureLayer
         * so that there is only ever one active feature layer attached to the
         * map at a time.
         *
         * @param {Object} map - The Leaflet map object.
         * @param {Function} vectorTileGetter - Function that gets a vector tile
         */
        function createNewFeatureLayer(map, vectorTileGetter) {
          var featureLayerOptions = {
            debug: false,
            getFeatureId: getFeatureId,
            filter: filterLayerFeature,
            layerOrdering: getFeatureZIndex,
            style: getFeatureStyle,
            debounceMilliseconds: scope.zoomDebounceMilliseconds,
            onRenderStart: emitRenderStarted,
            onRenderComplete: function() {
              emitRenderCompleted();
              removeOldFeatureLayers(map);
            },
            vectorTileGetter: function() {
              var promise = vectorTileGetter.apply(this, Array.prototype.slice.call(arguments));
              promise.then(_.noop,
                function() {
                  scope.$safeApply(function() {
                    scope.$emit('render:error');
                  });
                });
              return promise;
            }
            // You can interact with mouse events by passing
            // callbacks on three property names: 'mousedown',
            // 'mouseup' and 'mousemove'.
            // E.g.
            // mousemove: function(e) { /* do stuff with e.latLng */ }
          };

          // Don't create duplicate layers.
          if (!featureLayers.has(vectorTileGetter)) {
            var layer = VectorTiles.create(featureLayerOptions);
            featureLayers.set(vectorTileGetter, layer);
            map.addLayer(layer);
          }
        }

        /**
         * Removes existing but out of date feature layers from the map.
         * This is used in conjunction with createNewFeatureLayer.
         *
         * @param map - The Leaflet map object.
         */
        function removeOldFeatureLayers(map) {
          featureLayers.forEach(function(value, key) {
            if (key !== currentVectorTileGetter) {
              map.removeLayer(value);
              featureLayers['delete'](key);
            }
          });
        }

        /**
         * Derives a bounding box that contains each element in a set of points
         * and then causes the map to fit that bounding box within its viewport.
         *
         * @param bounds - The Leaflet LatLngBounds object that represents the
         *   extents of the column's features.
         */
        function fitMapBounds(bounds) {

          map.fitBounds(
            bounds,
            {
              animate: false,
              pan: { animate: false },
              zoom: { animate: false }
            }
          );
        }

        /**
         * Emit a 'render:start' event that will be consumed by
         * cardVisualizationFeatureMap to determine when to show the spinner
         * and by the analytics system to record render timings.
         */
        function emitRenderStarted() {
          scope.$safeApply(function() {
            scope.$emit('render:start', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now(), tag: 'vector_tile_render' });
          });
        }

        /**
         * Emit a 'render:complete' event that will be consumed by
         * cardVisualizationFeatureMap to determine when to show the spinner
         * and by the analytics system to record render timings.
         */
        function emitRenderCompleted() {
          scope.$safeApply(function() {
            scope.$emit('render:complete', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now(), tag: 'vector_tile_render' });
          });
        }

        // Map resizes are messy because our map containers are animated. This
        // causes Leaflet to believe that we are resizing the map n times when
        // we are really just doing it once but lerping between the container
        // sizes. To work around this we can debounce the event twice--once on
        // the leading edge and once on the trailing edge--to simulate 'start'
        // and 'stop' events for the resize.
        startResizeFn = _.debounce(
          function() {
            // We will need to record the current min and max latitude of the
            // viewport here so that we can reset the viewport to capture a
            // similar vertical area after the resize event completes.
          },
          RESIZE_DEBOUNCE_INTERVAL,
          { leading: true, trailing: false }
        );

        completeResizeFn = _.debounce(
          function() {
            // We will need to reset the viewport using a center point and a
            // zoom level in order to preserve the 'perceptual' area covered by
            // the map.
            // These can be constructed from the min and max latitude of the
            // pre-resize viewport, which we have conveniently recorded when
            // the event was originally fired.
          },
          RESIZE_DEBOUNCE_INTERVAL,
          { leading: false, trailing: true }
        );

        // Respond to map events.
        map.on('click', function(e) {
          // TODO: Something?
        });

        map.on('resize', function(e) {
          // This is debounced and will fire on the leading edge.
          startResizeFn();
          // This is debounced and will fire on the trailing edge.
          // In the best case, this will be called RESIZE_DEBOUNCE_INTERVAL
          // milliseconds after the resize event is captured by this handler.
          completeResizeFn();
        });

        // Keep the baseTileLayer in sync with the baseLayerUrl observable.
        baseTileLayerObservable = baseLayerUrlObservable.
          map(function(url) {
            if (!_.isDefined(url)) {
              return {
                url: Constants['DEFAULT_MAP_BASE_LAYER_URL'],
                opacity: 0.15
              };
            } else {
              return {
                url: url,
                opacity: 0.35
              };
            }
          }).
          distinctUntilChanged(_.property('url')).
          map(function(layerInfo) {
            var url = layerInfo.url;
            var opacity = layerInfo.opacity;
            return L.tileLayer(
              url,
              {
                attribution: '',
                detectRetina: false,
                opacity: opacity,
                unloadInvisibleTiles: true
              }
            );
          }
        ).
        // Only subscribe once everything is wired up, otherwise some
        // subscribers may miss the first value from the scope.observe().
        publish();

        // Observe map dimensions exist and have a height and width.
        // Ensures user has the window open, which avoids rendering bugs.
        dimensions$ = element.observeDimensions().
          filter(function(dimensions) {
            return _.isObject(dimensions) && dimensions.width > 0 && dimensions.height > 0;
          });

        // Remove old map layers.
        baseTileLayerObservable.
          bufferWithCount(2, 1).
          subscribe(function(layers) {
            map.removeLayer(layers[0]);
          }
        );
        // Add new map layers.
        baseTileLayerObservable.
          subscribe(function(layer) {
            layer.addTo(map);
            layer.bringToBack(map);
          }
        );
        // Now that everything's hooked up, connect the subscription.
        baseTileLayerObservable.connect();

        // We want to set the bounds before we start requesting tiles so that
        // we don't make a bunch of requests for zoom level 1 while we are
        // waiting for the extent query to come back.
        Rx.Observable.subscribeLatest(
          featureExtentObservable.filter(_.isDefined),
          dimensions$.take(1),
          function(featureExtent) {
            var bounds = LeafletHelpersService.buildBounds(featureExtent);

            // It is critical to invalidate size prior to updating bounds.
            // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
            // This manifests itself as the map being zoomed all of the way out.
            map.invalidateSize();
            fitMapBounds(bounds);
          });

        // If the server-provided extent is undefined, defer to zoom level 1
        Rx.Observable.subscribeLatest(
          featureExtentObservable.filter(_.isUndefined),
          dimensions$,
          function() {
            map.invalidateSize();
          });

        // React to changes to the vectorTileGetter observable
        // (which changes indicate that a re-render is needed).
        Rx.Observable.subscribeLatest(
          vectorTileGetterObservable.filter(_.isFunction),
          featureExtentObservable, // Used for signaling to create feature layer
          dimensions$,
          function(vectorTileGetter) {
            currentVectorTileGetter = vectorTileGetter;
            createNewFeatureLayer(map, vectorTileGetter);
          }
        );

        dimensions$.subscribe(function() {
          map.invalidateSize();
        });
      }
    }
  }

  angular.
    module('dataCards.directives').
      directive('featureMap', FeatureMap);
})();

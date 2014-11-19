(function() {
  'use strict';

  function featureMap(Constants,
                      AngularRxExtensions,
                      WindowState,
                      FlyoutService,
                      $timeout) {

    return {
      restrict: 'E',
      scope: {
        'baseLayerUrl': '=',
        'featureExtent': '=',
        'featureLayerUrl': '=',
        'rowDisplayUnit': '=?'
      },
      templateUrl: '/angular_templates/dataCards/featureMap.html',
      link: function(scope, element) {

        AngularRxExtensions.install(scope);

        //
        // Set up state.
        //

        var cachedFeatureData = null;

        var mapOptions = {
          attributionControl: false,
          center: [47.609895, -122.330259], // Center on Seattle by default.
          keyboard: false,
          scrollWheelZoom: false,
          zoom: 1,
          zoomControlPosition: 'topleft'
        };

        var map = L.map(element.find('.feature-map-container')[0], mapOptions);

        var baseTileLayer = null;

        // We 'double-buffer' feature layers so that there isn't a visible flash
        // of emptiness when we transition from one to the next. This is accomplished
        // by only removing the previous one when the current one completes rendering.
        var thisFeatureLayer = null;
        var lastFeatureLayer = null;

        var firstRender = true;

        var tilesToProcess = 0;


        /**
         *
         * getFeatureId
         *
         * Returns a unique string id for a feature that will be used as a key
         * into a key => value hash. The 'index' parameter is the index of this
         * feature into the array of all features.
         *
         */

        function getFeatureId(feature, index) {
          return String(index);
        }


        /**
         *
         * filterLayerFeature
         *
         * Returns true for features that should be drawn and false for features
         * that should not be drawn.
         *
         */

        function filterLayerFeature(feature, context) {
          return true;
        }


        /**
         *
         * getFeatureZIndex
         *
         * Returns the 'z-index' at which the feature should be drawn.
         *
         */

        function getFeatureZIndex(feature) {
          return 1;
        }


        /**
         *
         * scalePointFeatureRadiusByZoomLevel
         *
         * Scales points according to zoom level. The maximum zoom level
         * in Leaflet is 18; the minimum is 1.
         *
         */

        function scalePointFeatureRadiusByZoomLevel(zoomLevel) {

          if (zoomLevel > 10) {
            return 3;
          } else if (zoomLevel > 7) {
            return 2;
          } else {
            return 1;
          }

        }


        /**
         *
         * getPointStyleFn
         *
         * Returns an object specifying the styles with which a point feature
         * will be rendered.
         *
         * This function is called by the Vector Tile Layer extension to Leaflet
         * as it iterates over features in a vector tile.
         *
         */

        function getPointStyleFn() {
          return {
            color: 'rgba(48,134,171,1.0)',
            radius: scalePointFeatureRadiusByZoomLevel,
            selected: {
              color: 'rgba(255,255,0,0.5)',
              radius: 6
            }
          };
        }


        /**
         *
         * getLineStringStyleFn
         *
         * Returns an object specifying the styles with which a line string
         * feature will be rendered.
         *
         * This function is called by the Vector Tile Layer extension to Leaflet
         * as it iterates over features in a vector tile.
         *
         */

        function getLineStringStyleFn() {
          return {
            color: 'rgba(161,217,155,0.8)',
            size: 3,
            selected: {
              color: 'rgba(255,255,0,0.5)',
              size: 6
            }
          };
        }


        /**
         *
         * getPolygonStyleFn
         *
         * Returns an object specifying the styles with which a polygon feature
         * will be rendered.
         *
         * This function is called by the Vector Tile Layer extension to Leaflet
         * as it iterates over features in a vector tile.
         *
         */

        function getPolygonStyleFn() {
          return {
            color: 'rgba(149,139,255,0.4)',
            outline: {
              color: 'rgb(20,20,20)',
              size: 2
            },
            selected: {
              color: 'rgba(255,255,0,0.5)',
              outline: {
                color: '#d9534f',
                size: 3
              }
            }
          };
        }


        /**
         *
         * getFeatureStyle
         *
         * Provides a generic interface to the styling functions above and
         * dispatches requests to the appropriate type based on the feature
         * being styled.
         *
         */

        function getFeatureStyle(feature) {

          var style = {
            selected: {}
          };

          switch (feature.type) {

            // Point
            case 1:
              return getPointStyleFn();

            // LineString
            case 2:
              return getLineStringStyleFn();

            // Polygon
            case 3:
              return getPolygonStyleFn();

            default:
              throw new Error('Cannot apply style to unknown feature type "' + feature.type + '".');

          }

        }


        /**
         *
         * createFeatureLayer
         *
         * Creates a new feature layer with a specific tileserver endpoint
         * and adds it to the map. Because of the way vector tiles are
         * implemented (in mapbox-vector-tiles.js) it is necessary to
         * create an entirely new feature layer every time the page's
         * global where clause changes.
         *
         * This function should be used in conjunction with removeFeatureLayer
         * so that there is only ever one active feature layer attached to the
         * map at a time.
         *
         */

        function createFeatureLayer(map, featureLayerUrl) {

          var featureLayerOptions = {
            url: featureLayerUrl,
            headers: { 'X-Socrata-Host': 'localhost:8080' },
            debug: false,
            clickableLayers: [],
            getIDForLayerFeature: getFeatureId,
            filter: filterLayerFeature,
            layerOrdering: getFeatureZIndex,
            style: getFeatureStyle
          };

          lastFeatureLayer = thisFeatureLayer;
          thisFeatureLayer = new L.TileLayer.MVTSource(featureLayerOptions);

          map.addLayer(thisFeatureLayer);

        }


        /**
         *
         * removeFeatureLayer
         *
         * Removes an existing feature layer from the map. This is used in
         * conjunction with createFeatureLayer.
         *
         */

        function removeFeatureLayer(map) {

          if (lastFeatureLayer !== null) {

            map.removeLayer(lastFeatureLayer);
            lastFeatureLayer = null;

          }

        }


        /**
         *
         * fitMapBounds
         *
         * Derives a bounding box that contains each element in a set of points
         * and then causes the map to fit that bounding box within its viewport.
         *
         */

        function fitMapBounds(featureExtent) {

          map.fitBounds(
            [
              featureExtent.southwest,
              featureExtent.northeast
            ]
          );

        }


        //
        // Respond to clicks.
        //

        map.on('click', function(e) {
          // TODO: Something
        });


        //
        // Keep the baseTileLayer in sync with the baseLayerUrl observable.
        //

        baseTileLayer = scope.observe('baseLayerUrl').
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
                detectRetina: true,
                opacity: opacity,
                unloadInvisibleTiles: true
              }
            );
          }).
          publish(); // Only subscribe once everything is wired up,
                     // otherwise some subscribers may miss the first
                     // value from the scope.observe().

        // Remove old map layers.
        baseTileLayer.bufferWithCount(2, 1).subscribe(function(layers) {
          map.removeLayer(layers[0]);
        });

        // Add new map layers.
        baseTileLayer.subscribe(function(layer) {
          layer.addTo(map);
        });
        
        // Now that everything's hooked up, connect the subscription.
        baseTileLayer.connect();


        //
        // Emit analytics events on render start and complete events
        // for protocol buffer vector tiles.
        //

        element.on('protobuffer-tile-loading', function(e) {

          if (e.originalEvent.tilesToProcess > tilesToProcess) {
            tilesToProcess = e.originalEvent.tilesToProcess;
            scope.$emit('render:start', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now() });
          }

        });


        element.on('protobuffer-tile-loaded', function(e) {

          if (e.originalEvent.tilesToProcess > tilesToProcess) {
            tilesToProcess = e.originalEvent.tilesToProcess;
          }

          tilesToProcess -= 1;

          if (tilesToProcess === 0) {
            removeFeatureLayer(map);
            scope.$emit('render:complete', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now() });
          }

        });


        //
        // React to changes to the featureLayerUrl observable
        // (which changes indicate that a re-render is needed).
        //

        Rx.Observable.subscribeLatest(
          scope.observe('featureLayerUrl'),
          function(featureLayerUrl) {
            createFeatureLayer(map, featureLayerUrl);
          });


        //
        // React to changes to the visualization's dimensions
        // and the underlying feature data
        // (which changes indicate that the map's starting
        // zoom level and viewport bounds should be calculated).
        //

        Rx.Observable.subscribeLatest(
          element.observeDimensions(),
          scope.observe('featureExtent'),
          function(dimensions, featureExtent) {

            if (_.isDefined(featureExtent)) {

              scope.$emit('render:start', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now() });

              // It is citical to invalidate size prior to updating bounds.
              // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
              // This manifests itself as the map being zoomed all of the way out.
              map.invalidateSize();

              if (firstRender) {
                fitMapBounds(featureExtent);
                firstRender = false;
              }

              // Yield execution to the browser to render, then notify that render is complete
              $timeout(function() {
                scope.$emit('render:complete', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now() });
              });
            }
          });

      }
    }
  }

  angular.
    module('dataCards.directives').
      directive('featureMap', ['Constants',
                               'AngularRxExtensions',
                               'WindowState',
                               'FlyoutService',
                               '$timeout',
                               featureMap]);

})();

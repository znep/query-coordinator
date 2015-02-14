(function() {
  'use strict';

  function featureMap(Constants,
                      AngularRxExtensions,
                      VectorTiles,
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

        // We only want to calculate the extent on page load, so we track whether or
        // not this is the first render. After the first render this flag gets switched
        // to false and we will no longer set the map bounds based on the colum's extent.
        var firstRender = true;

        // We track how many protocol buffer tile requests are in-flight so that we can
        // swap out the old tiles when all the new ones have loaded (see the explanation
        // of thisFeatureLayer and lastFeatureLayer above).
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
          // This was created somewhat arbitrarily by Chris to
          // result in point features which get slightly larger
          // as the map is zoomed in. It can be replaced with
          // any function which computes a number that makes
          // sense as the radius of a point feature in pixels.
          return Math.pow(zoomLevel * 0.125, 2) + 1;

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
            lineWidth: 1,
            strokeStyle: 'rgba(255,255,255,1.0)'
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
            size: 3
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
         * createNewFeatureLayer
         *
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
         */

        function createNewFeatureLayer(map, featureLayerUrl) {

          var featureLayerOptions = {
            url: featureLayerUrl,
            // The X-Socrata-Host header is a temporary local development
            // stopgap until TileServer can discover Soda Fountain on its
            // own.
            headers: {},
            debug: false,
            getFeatureId: getFeatureId,
            filter: filterLayerFeature,
            layerOrdering: getFeatureZIndex,
            style: getFeatureStyle
            // You can interact with mouse events by passing
            // callbacks on three property names: 'mousedown',
            // 'mouseup' and 'mousemove'.
            // E.g.
            // mousemove: function(e) { /* do stuff with e.latLng */ }
          };

          lastFeatureLayer = thisFeatureLayer;
          thisFeatureLayer = VectorTiles.create(featureLayerOptions);

          map.addLayer(thisFeatureLayer);

        }


        /**
         *
         * removeOldFeatureLayer
         *
         * Removes an existing feature layer from the map. This is used in
         * conjunction with createNewFeatureLayer.
         *
         */

        function removeOldFeatureLayer(map) {

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
            ],
            {
              animate: false,
              pan: { animate: false },
              zoom: { animate: false }
            }
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
          layer.bringToBack(map);
        });
        
        // Now that everything's hooked up, connect the subscription.
        baseTileLayer.connect();


        //
        // Emit analytics events on render start and complete events
        // for protocol buffer vector tiles.
        //

        element.on('vector-tile-render-started', function(e) {

          scope.$emit('render:start', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now(), tag: 'vector_tile_render' });

        });

        element.on('vector-tile-render-complete', function(e) {

          removeOldFeatureLayer(map);
          scope.$emit('render:complete', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now(), tag: 'vector_tile_render' });

        });


        //
        // React to changes to the featureLayerUrl observable
        // (which changes indicate that a re-render is needed).
        //

        Rx.Observable.subscribeLatest(
          scope.observe('featureLayerUrl'),
          function(featureLayerUrl) {
            if (_.isString(featureLayerUrl)) {
              createNewFeatureLayer(map, featureLayerUrl);
            }
          });


        //
        // React to changes to the visualization's dimensions
        // and the underlying feature data
        // (which changes indicate that the map's starting
        // zoom level and viewport bounds should be calculated).
        //

        // TODO: Maybe split the below into two subscriptions, one to each
        // and which react to one source only.

        Rx.Observable.subscribeLatest(
          element.observeDimensions(),
          scope.observe('featureExtent'),
          function(dimensions, featureExtent) {

            if (dimensions.height > 0 && _.isDefined(featureExtent)) {

              scope.$emit('render:start', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now(), tag: 'fit_bounds' });

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
                scope.$emit('render:complete', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now(), tag: 'fit_bounds' });
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
                               'VectorTiles',
                               'FlyoutService',
                               '$timeout',
                               featureMap]);

})();

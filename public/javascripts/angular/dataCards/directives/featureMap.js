(function() {
  'use strict';

  function featureMap(Constants,
                      AngularRxExtensions,
                      GeospatialService,
                      WindowState,
                      FlyoutService,
                      $timeout) {

    return {
      restrict: 'E',
      scope: {
        'baseLayerUrl': '=',
        'featureData': '=',
        'fieldName': '=',
        'datasetId': '=',
        'whereClause': '=',
        'rowDisplayUnit': '=?'
      },
      templateUrl: '/angular_templates/dataCards/featureMap.html',
      link: function(scope, element) {

        AngularRxExtensions.install(scope);

        /***************
        * Set up state *
        ***************/

        var cachedFeatureData = null;

        var twoPI = Math.PI * 2;

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

        var canvasTileLayer = null;

        var firstRender = true;

        var protocolBufferLayer = null;
console.log('PBF', protocolBufferLayer);

        function pGetIDForLayerFeature(feature) {
          return ''; //feature.properties.id;
        }

        /**
         * The filter function gets called when iterating though each vector tile feature (vtf). You have access
         * to every property associated with a given feature (the feature, and the layer). You can also filter
         * based of the context (each tile that the feature is drawn onto).
         *
         * Returning false skips over the feature and it is not drawn.
         *
         * @param feature
         * @returns {boolean}
         */
        function pFilter(feature, context) {
          //return feature.properties.type != 'Mobile Money Agent';
          return true;
        }

        /**
         * When we want to link events between layers, like clicking on a label and a
         * corresponding polygon freature, this will return the corresponding mapping
         * between layers. This provides knowledge of which other feature a given feature
         * is linked to.
         *
         * @param layerName  the layer we want to know the linked layer from
         * @returns {string} returns corresponding linked layer
         */
        function pLayerLink(layerName) {
          if (layerName.indexOf('_label') > -1) {
            return layerName.replace('_label', '');
          }
          return layerName + '_label';
        }

        /**
         * Specify which features should have a certain z index (integer).  Lower numbers will draw on 'the bottom'.
         *
         * @param feature - the PBFFeature that contains properties
         */
        function pLayerOrdering(feature) {
          //This only needs to be done for each type, not necessarily for each feature. But we'll start here.
          if (feature && feature.properties) {
           // feature.properties.zIndex = CICO_LAYERS[feature.properties.type].zIndex || 5;
          }
        }

        function pStyle(feature) {

          var style = {};
          var selected = style.selected = {};
          var pointRadius = 1;

          function ScaleDependentPointRadius(zoom) {
            //Set point radius based on zoom
            var pointRadius = 1;
            if (zoom >= 0 && zoom <= 7) {
              pointRadius = 1;
            }
            else if (zoom > 7 && zoom <= 10) {
              pointRadius = 2;
            }
            else if (zoom > 10) {
              pointRadius = 3;
            }

            return pointRadius;
          }

          var type = feature.type;
          switch (type) {
            case 1: //'Point'
              // unselected
              style.color =  '#3086AB';
              style.radius = 2,//ScaleDependentPointRadius;
              // selected
              style.selected = {
                color: 'rgba(255,255,0,0.5)',
                radius: 6
              };
              break;
            case 2: //'LineString'
              // unselected
              style.color = 'rgba(161,217,155,0.8)';
              style.size = 3;
              // selected
              style.selected = {
                color: 'rgba(255,255,0,0.5)',
                size: 6
              };
              break;
            case 3: //'Polygon'
              // unselected
              style.color = 'rgba(149,139,255,0.4)';
              style.outline = {
                color: 'rgb(20,20,20)',
                size: 2
              };
              // selected
              style.selected = {
                color: 'rgba(255,255,0,0.5)',
                outline: {
                  color: '#d9534f',
                  size: 3
                }
              };

          }

          return style;

        }

        function createProtocolBufferLayer(map, fieldName, datasetId, whereClause) {

          var url = '/tiles/' + datasetId + '/' + fieldName + '/{z}/{x}/{y}.pbf';

          if (!_.isEmpty(whereClause)) {
            url += '?$where=' + encodeURIComponent(whereClause);
          }

          var options = {
            url: url,
            headers: { 'X-Socrata-Host': 'localhost:8080' },
            debug: false,
            clickableLayers: [''],
            getIDForLayerFeature: pGetIDForLayerFeature,
            filter: pFilter,
            layerLink: pLayerLink,
            layerOrdering: pLayerOrdering,
            style: pStyle
          };

          protocolBufferLayer = new L.TileLayer.MVTSource(options);

          map.addLayer(protocolBufferLayer);

        }

        function removeProtocolBufferLayer(map) {
          if (protocolBufferLayer !== null) {
            map.removeLayer(protocolBufferLayer);
            protocolBufferLayer = null;
          }
        }

        map.on('click', function(e) {
          console.log(e.latlng, e.layerPoint);
        });


        function fitMapBounds(southwesternLatLng, northeasternLatLng) {

          var boundingBox = GeospatialService.calculateBoundingBox(cachedFeatureData);

          map.fitBounds(
            [
              boundingBox.southwest,
              boundingBox.northeast
            ]
          );

        }

        /*function renderPoint(context, point, offset, radius) {
          var p = map.project(point);
          var x = Math.floor(p.x - offset.x);
          var y = Math.floor(p.y - offset.y);
          context.beginPath();
          context.arc(x, y, radius, 0, twoPI, false);
          context.fill();
        }

        function renderCanvasTile(canvas, tilePoint, zoom) {

          if (cachedFeatureData !== null) {

            var tileSize = canvasTileLayer.options.tileSize;
            var tileOrigin = tilePoint.multiplyBy(tileSize);

            var context = canvas.getContext('2d');

            var radius = 5;

            var i;

            context.fillStyle = '#FF3300';

            for (i = 0; i < cachedFeatureData.length; i++) {
              renderPoint(context, cachedFeatureData[i].feature, tileOrigin, radius);
            }

          }

        }*/


        function updateQueryBoundingBox() {

          var leafletBoundingBox = map.getBounds();

          var genericBoundingBox = {
            'southwest': {
              'lat': leafletBoundingBox._southWest.lat,
              'lng': leafletBoundingBox._southWest.lng
            },
            'northeast': {
              'lat': leafletBoundingBox._northEast.lat,
              'lng': leafletBoundingBox._northEast.lng
            }
          }

          scope.$emit('feature-map:update-query-bounding-box', genericBoundingBox);

        }



        /**********************************************************************
        *
        * Notify the cardVisualizationFeatureMap directive of changes
        * in the feature map's visible area.
        *
        */

        map.on('moveend', updateQueryBoundingBox);


        /***********************************
        * Keep the base tile layer in sync *
        ***********************************/

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


        /*********************************
        * React to changes in bound data *
        *********************************/

        Rx.Observable.subscribeLatest(
          scope.observe('fieldName'),
          scope.observe('datasetId'),
          scope.observe('whereClause'),
          function(fieldName, datasetId, whereClause) {
            removeProtocolBufferLayer(map);
            createProtocolBufferLayer(map, fieldName, datasetId, whereClause);
          });

        Rx.Observable.subscribeLatest(
          element.observeDimensions(),
          scope.observe('featureData'),
          function(dimensions, featureData) {

            if (_.isDefined(featureData)) {

              scope.$emit('render:start', { source: 'feature_map_{0}'.format(scope.$id), timestamp: _.now() });

              // Critical to invalidate size prior to updating bounds
              // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
              // This manifests itself as the map being zoomed all of the way out.
              map.invalidateSize();

              cachedFeatureData = featureData;

              if (firstRender) {
                fitMapBounds();
//                removeProtocolBufferLayer(map);
//                createProtocolBufferLayer(map, '');
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
                               'GeospatialService',
                               'WindowState',
                               'FlyoutService',
                               '$timeout',
                               featureMap]);

})();

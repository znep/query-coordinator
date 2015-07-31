(function() {
  'use strict';

  function FeatureMap(
    $compile,
    $rootScope,
    Constants,
    VectorTiles,
    LeafletHelpersService,
    LeafletVisualizationHelpersService,
    FlyoutService,
    I18n,
    ServerConfig,
    WindowState
  ) {
    return {
      restrict: 'E',
      scope: {
        'getClickedRows': '=',
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
          zoomControlPosition: 'topleft',
          maxZoom: Constants.FEATURE_MAP_MAX_ZOOM
        };

        if (Constants.DISABLE_LEAFLET_ZOOM_ANIMATION) {
          mapOptions.zoomAnimation = false;
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
            selector: '.pan-zoom-disabled-warning-icon',
            render: _.constant(
              '<div class="flyout-title">{0}</div>'.format(I18n.featureMap.zoomDisabled)
            ),
            destroySignal: scope.$destroyAsObservable()
          });
        }

        // Holds flyout-related state. Offset is specified in absolute pixels
        // because we don't have an element to position the flyout on.
        var flyoutData = {
          count: 0,
          offset: {x: 0, y: 0}
        };

        // Handles flyouts for hover
        function renderHoverFlyout(target) {
          var noPoints = (flyoutData.count === 0);

          // Set the appropriate cursor
          target.style.cursor = noPoints ? 'inherit' : 'pointer';

          // Hide the flyout if there are no nearby points
          if (noPoints) {
            FlyoutService.hide();
            return;
          }

          var template = [
            '<div class="flyout-title">{0} {1}</div>',
            I18n.flyout.details
          ].join('');

          var unit = (flyoutData.count === 1) ?
            scope.rowDisplayUnit :
            scope.rowDisplayUnit.pluralize();

          return template.format(flyoutData.count, _.escape(unit));
        }

        var map = L.map(element.find('.feature-map-container')[0], mapOptions);
        // Control the hover flyout by registering when the mouse enters the map
        // and degistering when the mouse exits the map, so flyouts work across
        // multiple maps.
        map.on('mouseover', function() {
          FlyoutService.register({
            selector: 'canvas',
            render: renderHoverFlyout,
            getOffset: function() {
              return flyoutData.offset;
            },
            destroySignal: scope.$destroyAsObservable()
          });
        });
        map.on('mouseout', function() {
          FlyoutService.deregister('canvas', renderHoverFlyout);
        });
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
          return Math.pow(zoomLevel * 0.125, 3) + 1;
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
            highlightColor: 'rgba(255, 255, 255, .5)',
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

        var mousemoveHandler = _.noop;
        var clickHandler = _.noop;
        if (ServerConfig.get('oduxEnableFeatureMapHover')) {
          var windowRef = $(window);
          var lastPoints = null;

          mousemoveHandler = function(e) {
            // Set flyout data and force a refresh of the flyout
            flyoutData.offset = {
              x: e.originalEvent.clientX,
              y: e.originalEvent.clientY + Constants.FEATURE_MAP_FLYOUT_Y_OFFSET
            };
            flyoutData.count = _.sum(e.points, 'count');

            FlyoutService.refreshFlyout(e.originalEvent);
          };

          clickHandler = function(e) {
            // Generate observable for data of clicked rows
            var clickedDataRows$ = scope.getClickedRows(e.latlng, e.points);

            if (_.xor(e.points, lastPoints).length === 0) {
              lastPoints = null;
              return;
            } else {
              lastPoints = e.points;
            }

            // Update position and content of row-detail flannel.
            // Control passes back to cardVisualizationFeatureMap.js here.
            Rx.Observable.subscribeLatest(
              clickedDataRows$.take(1).filter(_.isDefined),
              function(rows) {

                if (rows.length === 0) {
                  return;
                }

                var flannelTargetLatLng;

                // Open flannel over the point if a single point is selected, otherwise
                // opens over the cursor location.
                if (rows.length === 1) {
                  var latIndex = 1;
                  var lngIndex = 0;
                  var featureMapLocationData = _.find(rows[0], {isCurrentColumn: true});
                  var rowPoint = _.find(featureMapLocationData.value, {type: 'Point'});
                  flannelTargetLatLng = L.latLng(rowPoint.coordinates[latIndex], rowPoint.coordinates[lngIndex]);
                  //target on lat lang of point
                } else {
                  flannelTargetLatLng = e.latlng;
                }

                // Set up the essential properties for the row-details flannel.
                // Any property changes that occur after binding scope to the
                // compiled directive need to be performed inside $safeApply.
                var flannelScope = $rootScope.$new();
                flannelScope.rows = rows;
                flannelScope.rowDisplayUnit = scope.rowDisplayUnit;
                flannelScope.isExpanded = $(element).closest('card').hasClass('expanded');

                // Instantiate the row-details flannel.
                var flannelFactory = $compile(angular.element('<feature-map-flannel />'));
                var flannel = flannelFactory(flannelScope);
                // Recalculates the position of the panel and hint.
                // Runs now to obtain initial values.
                function adjustPosition() {
                  flannelScope.$safeApply(function() {

                    var containerPoint = map.latLngToContainerPoint(flannelTargetLatLng);
                    var distanceOutOfView = $(window).scrollTop();
                    var mapContainerBounds = map.getContainer().getBoundingClientRect();
                    var mapLeftEdge = mapContainerBounds.left;
                    var mapTopEdge = mapContainerBounds.top;
                    var xPosition = mapLeftEdge + containerPoint.x;
                    var yPosition = mapTopEdge + containerPoint.y + distanceOutOfView;
                    var windowWidth = windowRef.width();

                    flannelScope.abutsRightEdge = windowWidth <
                      (xPosition + Constants.FLANNEL_WIDTH + Constants.FLYOUT_WINDOW_PADDING);

                    flannelScope.panelPositionStyle = {};
                    flannelScope.hintPositionStyle = {};

                    flannelScope.panelPositionStyle.top = '{0}px'.format(yPosition);

                    if (flannelScope.abutsRightEdge) {
                      flannelScope.useSoutheastHint = xPosition + (Constants.FLANNEL_WIDTH / 2) >
                        windowWidth - (Constants.FLYOUT_WINDOW_PADDING + Constants.FLANNEL_PADDING_COMPENSATION);

                      flannelScope.panelPositionStyle.right = '{0}px'.format(
                        Constants.FLANNEL_WIDTH + Constants.FLANNEL_PADDING_COMPENSATION + Constants.FLYOUT_WINDOW_PADDING
                      );

                      var hintRightOffset = xPosition + Constants.FLYOUT_WINDOW_PADDING +
                        (flannelScope.useSoutheastHint ? 0 : Constants.FLANNEL_HINT_WIDTH);
                      var hintPositionFromRight = Math.max(0, windowWidth - hintRightOffset);
                      flannelScope.hintPositionStyle.right = '{0}px'.format(hintPositionFromRight);
                      flannelScope.hintPositionStyle.left = 'auto';
                    } else {
                      flannelScope.panelPositionStyle.left = '{0}px'.format(xPosition);
                      flannelScope.useSoutheastHint = false;
                    }
                  });
                }
                adjustPosition();

                // Clean up after ourselves, and trigger clearing of clicked points under closing flannel
                function handleDestroyFlannel() {
                  closeSubscriber.dispose();
                  scrollSubscriber.dispose();
                  map.off('resize', adjustPosition);
                  flannel.remove();
                  flannelScope.$destroy();
                  map.fire('flannelclosed', e);
                }

                // Dismiss this flannel instance when clicking outside
                // the flannel itself, or on the close icon
                var closeSubscriber = WindowState.closeDialogEventObservable.
                  filter(function(e) {
                    var target = $(e.target);
                    return target.closest('.feature-map-flannel').length === 0 || target.is('.icon-close');
                  }).
                  subscribe(function(e) {
                    scope.$safeApply(handleDestroyFlannel);
                    // If the click is outside of the map itself, (when clicking elsewhere on the page,
                    // or updating a filter) clear all hover and clicked point highlighting
                    if ($(e.target).closest('.feature-map-container').length === 0) {
                      map.fire('clearhighlightrequest');
                    }
                  });

                // Shift flannel position if scroll occurs
                var scrollSubscriber = WindowState.scrollPositionSubject.subscribe(function() {
                  adjustPosition();
                });

                // Remove the flannel on pan/zoom, but just shift its position
                // if the map resizes innocuously (e.g. due to window resize).
                map.once('dragstart zoomstart', function() {
                  scope.$safeApply(handleDestroyFlannel);
                });

                map.on('resize', adjustPosition);

                // Insert the flannel into the DOM.
                $(e.originalEvent.target).
                  closest('body').
                  append(flannel);
              });
          };
        }

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
            },
            mousemove: mousemoveHandler,
            click: clickHandler
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
          Constants.FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL,
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
          Constants.FEATURE_MAP_RESIZE_DEBOUNCE_INTERVAL,
          { leading: false, trailing: true }
        );

        // Respond to map resize events
        map.on('resize', function() {
          // This is debounced and will fire on the leading edge.
          startResizeFn();
          // This is debounced and will fire on the trailing edge.
          // In the best case, this will be called RESIZE_DEBOUNCE_INTERVAL
          // milliseconds after the resize event is captured by this handler.
          completeResizeFn();
        });

        LeafletVisualizationHelpersService.emitExtentEventsFromMap(scope, map);

        // Keep the baseTileLayer in sync with the baseLayerUrl observable.
        baseTileLayerObservable = baseLayerUrlObservable.
          map(function(url) {
            if (!_.isDefined(url)) {
              return {
                url: Constants.DEFAULT_MAP_BASE_LAYER_URL,
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
    };
  }

  angular.
    module('dataCards.directives').
      directive('featureMap', FeatureMap);
})();

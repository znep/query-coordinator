(function() {
  'use strict';

  function FeatureMap(
    $compile,
    $rootScope,
    Constants,
    VectorTileService,
    LeafletHelpersService,
    LeafletVisualizationHelpersService,
    FlyoutService,
    I18n,
    PluralizeService,
    ServerConfig,
    WindowState
  ) {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: '/angular_templates/dataCards/featureMap.html',
      link: function(scope, element) {
        var baseLayerUrl$ = scope.$observe('baseLayerUrl');
        var featureExtent$ = scope.$observe('featureExtent');
        var vectorTileGetter$ = scope.$observe('vectorTileGetter');
        var busy$ = scope.$observe('busy');

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
          var zoom = map.getZoom();
          var template;

          // Set the appropriate cursor
          target.style.cursor = noPoints ? 'inherit' : 'pointer';

          // Hide the flyout if there are no nearby points
          if (noPoints) {
            FlyoutService.hide();
            return;
          }

          template = [
            '<div class="flyout-title">{0}</div>',
            '<div class="flyout-cell">{1}</div>'
          ].join('');

          // If the tile we are hovering over has more points then the
          // TileServer limit or the selected points contain more than the
          // max number of rows to be displayed on a flannel,
          // prompt the user to filter and/or zoom in for accurate data.
          if (flyoutData.totalPoints >= Constants.FEATURE_MAP_MAX_TILE_DENSITY) {
            var rowDisplayUnit = PluralizeService.pluralize(scope.rowDisplayUnit);
            return template.format(
              I18n.t('flyout.denseData', rowDisplayUnit),
              chooseUserActionPrompt(zoom)
            );

          } else if (flyoutData.count > Constants.FEATURE_MAP_FLANNEL_MAX_ROW_DENSITY) {

            return template.format(
              assembleFlyoutRowInfo(),
              chooseUserActionPrompt(zoom)
            );

          } else {
            // Otherwise prompt the user to click for details
            return template.format(
              assembleFlyoutRowInfo(),
              I18n.flyout.details
            );
          }
        }

        function assembleFlyoutRowInfo() {
          var unit = PluralizeService.pluralize(scope.rowDisplayUnit, flyoutData.count);
          return '{0} {1}'.format(flyoutData.count, _.escape(unit));
        }

        function chooseUserActionPrompt(zoom) {
          return zoom === Constants.FEATURE_MAP_MAX_ZOOM ?
            I18n.flyout.filterPrompt :
            I18n.flyout.zoomOrFilterPrompt;
        }

        // Construct leaflet map
        var map = L.map(element.find('.feature-map-container')[0], mapOptions);

        // Control the hover flyout by registering when the mouse enters the map
        // and degistering when the mouse exits the map, so flyouts work across
        // multiple maps.
        // (Register then deregister also ensures proper page-wide behavior of
        // flyout hiding upon click. Feature map flyouts will not hide on click,
        // but others by default still will unless otherwise specified).
        map.on('mouseover', function() {
          FlyoutService.register({
            selector: 'canvas',
            render: renderHoverFlyout,
            getOffset: function() {
              return flyoutData.offset;
            },
            destroySignal: scope.$destroyAsObservable(),
            persistOnMousedown: true
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
        var baseTileLayer$;
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
         * TODO: Determine if this can be substituted for _.constant(true).
         */
        function filterLayerFeature() {
          return true;
        }

        /**
         * Returns the 'z-index' at which the feature should be drawn.
         * TODO: Determine if this can be substituted for _.constant(1).
         */
        function getFeatureZIndex() {
          return 1;
        }

        /**
        * Returns the current hover threshold at the given zoom level, calculated
        * based on point radius.
        *
        * @param zoomLevel - The current zoom level of the map.
        * @returns {Number}
        */
        function getHoverThreshold(zoomLevel) {
          return Math.max(scalePointFeatureRadiusByZoomLevel(zoomLevel), Constants.FEATURE_MAP_MIN_HOVER_THRESHOLD);
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
          return Math.pow(zoomLevel * 0.0695, 5) + 2;
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
            color: calculatePointColor,
            highlightColor: 'rgba(255, 255, 255, .5)',
            radius: scalePointFeatureRadiusByZoomLevel,
            lineWidth: 1,
            strokeStyle: calculateStrokeStyleColor
          };
        }

        /**
        * Determine point fill color at given zoom level.
        * Makes points more transparent as map zooms out.
        */
        function calculatePointColor(zoomLevel) {
          return 'rgba(0,80,114,' + (0.3 * Math.pow(zoomLevel / 18, 5) + 0.4) + ')';
        }

        /**
        * Determine stroke style (point outline) at given zoom level.
        * Dims point outline color as map zooms out.
        */
        function calculateStrokeStyleColor(zoomLevel) {
          return 'rgba(255,255,255,' + (0.8 * Math.pow(zoomLevel / 18, 8) + 0.1) + ')';
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
          switch (feature.type) {
            case 1:
              return getPointStyle();
            case 2:
              return getLineStringStyle();
            case 3:
              return getPolygonStyle();
            default:
              throw new Error('Cannot apply style to unknown feature type "' + feature.type + '".');
          }
        }

        /**
        * If enabled:
        * Handles feature map interaction in the form of cursor hover and click.
        *
        *   - When point(s) are hovered over, displays a flyout reporting the number of rows represented by
        *     points under the cursor. Updates as mouse moves.
        *
        *   - When point(s) are clicked, displays a flannel reporting information from table
        *     corresponding to the rows they represent. Flannel can be cleared by reclicking
        *     the point(s), clicking elsewhere in the map, clicking elsewhere on the page,
        *     or clicking on the flannel's close icon. Flannel has a spinner while query
        *     is pending, and reports an error if the query fails.
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
            flyoutData.totalPoints = e.tile.totalPoints;
            FlyoutService.refreshFlyout(e.originalEvent);
          };

          clickHandler = function(e) {
            var isolateScrollSubscriber;
            var isScrollable$;

            // Update record of points clicked. Clear flannel upon reclick.
            if (_.isEmpty(_.xor(e.points, lastPoints))) {
              lastPoints = null;
              return;
            } else {
              lastPoints = e.points;
            }

            var flannelScope;

            // If points were clicked, open a flannel and hide existing hover flyout
            if (!_.isEmpty(e.points)) {
              FlyoutService.hide();
              // Set up flannel properties. Any subsequent changes after binding
              // of directive need to be performed inside $safeApply.
              flannelScope = $rootScope.$new();
              flannelScope.queryStatus = Constants.QUERY_PENDING;
              flannelScope.rowDisplayUnit = scope.rowDisplayUnit;
              flannelScope.useDefaults = false;

              // Instantiate the flannel
              var flannelFactory = $compile(angular.element('<feature-map-flannel />'));
              var flannel = flannelFactory(flannelScope);

              // Obtain initial values for flannel and hint position
              adjustPosition();

              // Insert flannel into the DOM
              $(e.originalEvent.target).
                closest('body').
                append(flannel);

              // Determine smaller box bounds within which to query for clicked points
              // (optimization in order to narrow down query)
              var withinBoxBounds = preprocessQueryRequest(e.containerPoint);

              // Kick off and manage query for clicked row data
              var rowQueryResponse$ = scope.getClickedRows(e.latlng, e.points, withinBoxBounds);

              // Provoke an update of flannel content based on status of query result.
              // Will show an error message of the query failed, otherwise the formatted
              // results of the query.
              var queryHandler = rowQueryResponse$.take(1).filter(_.isDefined).subscribe(
                function(rows) {
                  flannelScope.$safeApply(function() {
                    if (_.isNull(rows)) {
                      flannelScope.queryStatus = Constants.QUERY_ERROR;
                    } else {
                      // Extract row titles from each row if present
                      // before giving the rows to the flannel's scope for rendering.
                      var customTitles = [];
                      rows.map(function(row) {
                        var title = _.remove(row, _.property('isTitleColumn'));
                        customTitles.push(title[0]);
                      });

                      flannelScope.titles = [];
                      if (_.find(customTitles, _.isDefined)) {
                        flannelScope.titles = customTitles;
                      } else {
                        // If no row titles are specified, extract default row titles
                        // (those from the column used to produce the current feature map),
                        // and set flannel to use default titles.
                        rows.map(function(row) {
                          var title = _.remove(row, _.property('isFeatureMapColumn'));
                          flannelScope.titles.push(title[0]);
                        });
                        flannelScope.useDefaults = true;
                      }

                      flannelScope.rows = rows;
                      flannelScope.queryStatus = Constants.QUERY_SUCCESS;

                      // If scrollable flannel, disable scrolling on body. Otherwise,
                      // enable scrolling.
                      isScrollable$ = flannelScope.$observe('isScrollable');
                      isolateScrollSubscriber = isScrollable$.filter(_.isDefined).subscribe(
                        function(isScrollable) {
                          var flannelScrollingElement = flannel.find('.tool-panel-inner-container');
                          window.socrata.utils.isolateScrolling(flannelScrollingElement, isScrollable);
                        });
                      flannelScope.$on('$destroy', function() {
                        isolateScrollSubscriber.dispose();
                      });
                    }
                  });
                });
            }

            // If a flannel is currently open, be prepared to close flannel or adjust its position.
            if (_.isDefined(flannelScope)) {
              // Destroy flannel if it is closed.
              var closeSubscriber = WindowState.closeDialogEvent$.skip(1).filter(function(evt) {
                if (evt.type === 'click') {
                  var target = $(evt.target);
                  return target.closest('.feature-map-flannel').length === 0 || target.is('.icon-close');
                } else {
                  return true; // Escape key
                }
              }).subscribe(function(evt) {
                scope.$safeApply(handleDestroyFlannel);
                if ($(evt.target).closest('.feature-map-container').length === 0) {
                  // If click outside map itself, clear all hover and clicked point highlighting
                  map.fire('clearhighlightrequest');
                }
              });

              // Shift flannel position if scroll occurs
              var scrollSubscriber = WindowState.scrollPosition$.subscribe(adjustPosition);

              // Remove the flannel on pan/zoom, but just shift its position
              // if the map resizes innocuously (e.g. due to window resize).
              map.once('dragstart zoomstart', function() {
                scope.$safeApply(handleDestroyFlannel);
              });
              map.on('resize', adjustPosition);
            }

            // Determines within box query bounds to be passed into row query
            function preprocessQueryRequest(cursor) {
              var hoverThreshold = getHoverThreshold(map.getZoom());
              var delta = Constants.FEATURE_MAP_FLANNEL_QUERY_BOX_PADDING + hoverThreshold;
              var northeastContainerPoint = L.point(cursor.x - delta, cursor.y + delta);
              var southwestContainerPoint = L.point(cursor.x + delta, cursor.y - delta);
              return {
                northeast: map.containerPointToLatLng(northeastContainerPoint),
                southwest: map.containerPointToLatLng(southwestContainerPoint)
              };
            }

            // Recalculates the position of the flannel and hint so that
            // flannel opens over the cursor location.
            function adjustPosition() {
              flannelScope.$safeApply(function() {

                var containerPoint = map.latLngToContainerPoint(e.latlng);
                var distanceOutOfView = $(window).scrollTop();
                var mapContainerBounds = map.getContainer().getBoundingClientRect();
                var mapLeftEdge = mapContainerBounds.left;
                var mapTopEdge = mapContainerBounds.top;
                var xPosition = mapLeftEdge + containerPoint.x;
                var yPosition = mapTopEdge + containerPoint.y + distanceOutOfView;
                var windowWidth = windowRef.width();

                flannelScope.abutsRightEdge = windowWidth <
                  (xPosition + Constants.FEATURE_MAP_FLANNEL_WIDTH + Constants.FLYOUT_WINDOW_PADDING);

                flannelScope.panelPositionStyle = {};
                flannelScope.hintPositionStyle = {};

                flannelScope.panelPositionStyle.top = '{0}px'.format(yPosition);

                // Display flannel above clicked point if the point is more than halfway
                // down the window viewport. Else display flannel below the point.
                flannelScope.positionFlannelNorth = (yPosition - distanceOutOfView) < (window.innerHeight / 2);

                if (flannelScope.abutsRightEdge) {
                  flannelScope.positionFlannelEast = xPosition + (Constants.FEATURE_MAP_FLANNEL_WIDTH / 2) >
                    windowWidth - (Constants.FLYOUT_WINDOW_PADDING + Constants.FEATURE_MAP_FLANNEL_PADDING_COMPENSATION);

                  flannelScope.panelPositionStyle.right = '{0}px'.format(
                    Constants.FEATURE_MAP_FLANNEL_WIDTH + Constants.FEATURE_MAP_FLANNEL_PADDING_COMPENSATION + Constants.FLYOUT_WINDOW_PADDING
                  );

                  var hintRightOffset = xPosition + Constants.FLYOUT_WINDOW_PADDING +
                    (flannelScope.positionFlannelEast ? 0 : Constants.FEATURE_MAP_FLANNEL_HINT_WIDTH);
                  var hintPositionFromRight = Math.max(0, windowWidth - hintRightOffset);
                  flannelScope.hintPositionStyle.right = '{0}px'.format(hintPositionFromRight);
                  flannelScope.hintPositionStyle.left = 'auto';
                } else {
                  flannelScope.panelPositionStyle.left = '{0}px'.format(xPosition);
                  flannelScope.positionFlannelEast = false;
                }
              });
            }

            // Clean up after ourselves, and trigger clearing of clicked points under closing flannel
            function handleDestroyFlannel() {
              // isolateScrollSubscriber is disposed via a $destroy event handler,
              // as it can potentially be undefined
              queryHandler.dispose();
              closeSubscriber.dispose();
              scrollSubscriber.dispose();
              map.off('resize', adjustPosition);
              flannel.remove();
              flannelScope.$destroy();
              map.fire('flannelclosed', e);
            }
          };
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
        function createNewFeatureLayer(vectorTileGetter) {
          var layer;
          var featureLayerOptions = {
            debug: false,
            // disable interactivity during load
            disableMapInteractions: true,
            getFeatureId: getFeatureId,
            filter: filterLayerFeature,
            layerOrdering: getFeatureZIndex,
            style: getFeatureStyle,
            getHoverThreshold: getHoverThreshold,
            debounceMilliseconds: scope.zoomDebounceMilliseconds,
            onRenderStart: emitRenderStarted,
            onRenderComplete: function() {
              emitRenderCompleted();
              removeOldFeatureLayers();
              if (ServerConfig.get('oduxEnableFeatureMapHover')) {
                map.fire('clearhighlightrequest');
              }
              // enable interactivity once load is complete
              updateMapInteractivity(layer);
            },
            vectorTileGetter: function() {
              var promise = vectorTileGetter.apply(this, Array.prototype.slice.call(arguments));
              promise.then(_.noop,
                function() {
                  scope.$safeApply(function() {

                    // CORE-5208: PhantomJS always produces an error here even
                    // though it successfully renders the points. For now we
                    // are making an exception to improve the polaroid
                    // experience until we can investigate the cause further.
                    if (!window._phantom) {
                      scope.$emit('render:error');
                    }
                  });
                });
              return promise;
            },
            mousemove: mousemoveHandler,
            click: clickHandler
          };

          // Don't create duplicate layers.
          if (!featureLayers.has(vectorTileGetter)) {
            layer = VectorTileService.create(featureLayerOptions);
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
        function removeOldFeatureLayers() {
          featureLayers.forEach(function(value, key) {
            if (key !== currentVectorTileGetter) {
              map.removeLayer(value);
              featureLayers['delete'](key);
            }
          });
        }

        // Update map interactivity based on map load status.
        // Enables map interactivity once map load is complete.
        function updateMapInteractivity(layer) {
          if (_.isDefined(layer)) {
            busy$.subscribe(function(busy) {
              layer.options.disableMapInteractions = busy;
            });
          }
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
        baseTileLayer$ = baseLayerUrl$.
          map(function(url) {
            if (_.isNull(url) || _.isUndefined(url)) {
              return {
                url: Constants.DEFAULT_MAP_BASE_LAYER_URL,
                opacity: Constants.DEFAULT_MAP_BASE_LAYER_OPACITY
              };
            } else {
              return {
                url: url,
                opacity: Constants.DEFINED_MAP_BASE_LAYER_OPACITY
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
        baseTileLayer$.
          bufferWithCount(2, 1).
          subscribe(function(layers) {
            map.removeLayer(layers[0]);
          }
        );
        // Add new map layers.
        baseTileLayer$.
          subscribe(function(layer) {
            layer.addTo(map);
            layer.bringToBack(map);
          }
        );
        // Now that everything's hooked up, connect the subscription.
        baseTileLayer$.connect();

        // We want to set the bounds before we start requesting tiles so that
        // we don't make a bunch of requests for zoom level 1 while we are
        // waiting for the extent query to come back.
        Rx.Observable.subscribeLatest(
          featureExtent$.filter(_.isDefined),
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
          featureExtent$.filter(_.isUndefined),
          dimensions$,
          function() {
            map.invalidateSize();
          });

        // React to changes to the vectorTileGetter observable
        // (which changes indicate that a re-render is needed).
        // Only render once the feature extent has been defined.
        Rx.Observable.subscribeLatest(
          vectorTileGetter$.filter(_.isFunction),
          featureExtent$.filter(_.isDefined), // Used for signaling to create feature layer
          dimensions$,
          function(vectorTileGetter) {
            currentVectorTileGetter = vectorTileGetter;
            createNewFeatureLayer(vectorTileGetter);
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

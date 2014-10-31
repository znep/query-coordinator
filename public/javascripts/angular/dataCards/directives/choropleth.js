(function() {
  'use strict';

  // A WORD ON TERMINOLOGY:
  //
  // 'selected' is what happens when you are filtering by a feature (this is currently an orange stroke).
  // 'highlighted' is what happens when you mouseover a feature (this is currently a white stroke).

  function choropleth(Constants,
                      AngularRxExtensions,
                      $timeout,
                      numberFormatter,
                      ChoroplethVisualizationService,
                      WindowState,
                      FlyoutService) {

    return {
      restrict: 'E',
      replace: true,
      scope: {
        'baseLayerUrl': '=',
        'geojsonAggregateData': '=',
        'rowDisplayUnit': '=?'
      },
      template: ['<div class="choropleth-container">',
                    '<div class="choropleth-map-container"></div>',
                    '<div class="choropleth-legend"></div>',
                  '</div>'].join(''),
      link: function(scope, element) {

        AngularRxExtensions.install(scope);

        /***********************
        * Mutate Leaflet state *
        ***********************/

        function setTileLayer(url, options) {
          L.tileLayer(url, options).addTo(map);
        }

        function setGeojsonData(data, options) {
          if (geojsonBaseLayer !== null) {
            map.removeLayer(geojsonBaseLayer);
          }
          geojsonBaseLayer = L.geoJson(data, options);
          geojsonBaseLayer.addTo(map);
        }

        function updateBounds(geojsonData) {

          function buildPositionArray(positions) {

            var cleanPositions = positions.filter(function(position) {
              return typeof position[0] === 'number' && typeof position[1] === 'number';
            });

            // IMPORTANT NOTE: in geojson, positions are denoted as [longitude, latitude] pairs
            var lngs = _.map(cleanPositions, function(lngLat){ return lngLat[0]; });
            var lats = _.map(cleanPositions, function(lngLat){ return lngLat[1]; });

            // Clamp values to min and max
            if (_.min(lngs) < minLng) {
              minLng = _.min(lngs);
            }
            if (_.max(lngs) > maxLng) {
              maxLng = _.max(lngs);
            }
            if (_.min(lats) < minLat) {
              minLat = _.min(lats);
            }
            if (_.max(lats) > maxLat) {
              maxLat = _.max(lats);
            }

          }

          var boundsArray = [ [maxLat, maxLng], [minLat, minLng] ];
          var minLng = 180;
          var maxLng = -180;
          var minLat = 90;
          var maxLat = -90;
          var coordinates;

          if (_.isDefined(geojsonData)) {

            if (geojsonData.type !== 'FeatureCollection') {
              throw new Error('Cannot calculate geojson bounds: geojsonData is not of type <FeatureCollection>.');
            }

            _.each(geojsonData.features, function(feature){

              coordinates = feature.geometry.coordinates;

              switch (feature.geometry.type) {
                case 'Polygon':
                  // Polygon coordinates = arrays of position arrays
                  _.each(coordinates, function(positionArrays){
                    buildPositionArray(positionArrays);
                  });
                  break;
                case 'MultiPolygon':
                  // MultiPolygon coordinates = an array of Polygon coordinate arrays
                  _.each(coordinates, function(polygonCoordinates){
                    _.each(polygonCoordinates, function(positionArrays){
                      buildPositionArray(positionArrays);
                    });
                  });
                  break;
                case 'MultiLineString':
                  // MultiLineString coordinates
                  // = an array of LineString coordinate arrays
                  // = an array of arrays of position arrays
                  // (same as Polygon coordinates)
                  _.each(coordinates, function(positionArrays){
                    buildPositionArray(positionArrays);
                  });
                  break;
                case 'LineString':
                  // LineString coordinates = position array
                  buildPositionArray(coordinates);
                  break;
                case 'Point':
                  clampCoordinates([coordinates[1]],[coordinates[0]]);
                  break;
              }

            });

            boundsArray = [ [maxLat,maxLng],[minLat,minLng] ];

          }

          map.fitBounds(L.latLngBounds([
            boundsArray[1][0],
            boundsArray[1][1]
          ], [
            boundsArray[0][0],
            boundsArray[0][1]
          ]));

        }

        function updateLegend(classBreaks, colors) {

          function bigNumTickFormatter(val) {
            // used if ss.standard_deviation(classBreaks) > 10
            // val = a x 10^b (a: coefficient, b: exponent);
            if (val === 0) {
              return 0;
            }
            var exponent = Math.floor(Math.log(Math.abs(val)) / Math.LN10);
            var coefficient = val / Math.pow(10, exponent);
            var isMultipleOf10 = coefficient % 1 == 0;
            if (isMultipleOf10) {
              var numNonzeroDigits = coefficient.toString().length;
              var formattedNum = numberFormatter.formatNumber(val, {
                fixedPrecision: 0,
                maxLength: _.min([numNonzeroDigits, 3])
              });
            } else {
              var numNonzeroDigits = coefficient.toString().length - 1;
              var formattedNum = numberFormatter.formatNumber(val, {
                maxLength: _.min([numNonzeroDigits, 3])
              });
            }
            return formattedNum;
          }

          var legendLabelColorHeight = function(colorIndex, totalHeight) {
            var minVal = _.min(classBreaks);
            var maxVal = _.max(classBreaks);
            var percentOfClassbreakRange = (classBreaks[colorIndex + 1] - classBreaks[colorIndex]) / (maxVal - minVal);
            return Math.floor(percentOfClassbreakRange * totalHeight);
          };

          var className = 'choropleth-legend';
          var position = 'bottomright';

          if (classBreaks.length === 0) {

            element.find('.' + className).hide();

          } else {

            // Draw the legend on the map.
            if (classBreaks.length == 1) {

              // If there is just 1 value, make it range from 0 to that value.
              var singleClassBreak = classBreaks[0];
              classBreaks = [_.min([0, singleClassBreak]), _.max([0, singleClassBreak])];
              var numTicks = 1;

            } else {

              if (element.height() < 250) {
                var numTicks = 3;
              } else {
                var numTicks = 4;
              }

            }

            var minBreak = classBreaks[0];
            var maxBreak = classBreaks[classBreaks.length - 1];

            var colorWidth = 15;
            var width = Math.floor(colorWidth);
            var height = Math.floor(Math.min(element.height() - 60, 250));

            var legendSelection = d3.select(element.find('.' + className)[0]).data([{colors: colors, classBreaks: classBreaks}]);

            legendSelection.enter().
              append('div').
              classed(className, function() {
                return true;
              }).
              classed(position, true);

            var svg = legendSelection.selectAll('svg').data([{colors: colors, classBreaks: classBreaks}]);

            svg.enter().
              append('svg').
              append('g');

            svg.
              attr('width', width).
              attr('height', height);

            var yTickScale = d3.scale.linear().range([height - 1, 1]);
            var yLabelScale = d3.scale.linear().range([height, 0]);

            var yAxis = d3.svg.
                          axis().
                          scale(yTickScale).
                          ticks(numTicks).
                          orient('left');

            var yTickScaleDomain = yTickScale.domain([minBreak, maxBreak]);
            var yLabelScaleDomain = yLabelScale.domain([minBreak, maxBreak]);

            var isLargeRange = ss.standard_deviation(classBreaks) > 10;

            if (isLargeRange) {
              // d3 quirk: using a #tickFormat formatter that just returns the value
              // gives unexpected results due to floating point math.
              // We want to just return the value for "small-ranged" data.
              // --> do not call a tickFormatter on yAxis if range is small.
              yAxis.tickFormat(bigNumTickFormatter);

              // Due to similar issues, d3's scale#nice method also has
              // floating point math issues.
              yTickScaleDomain.nice();
              yLabelScaleDomain.nice();
            }

            // include min and max back into d3 scale, if #nice truncates them
            if (_.min(classBreaks) > minBreak) {
              classBreaks.unshift(minBreak);
            }

            if (_.max(classBreaks) < maxBreak) {
              classBreaks.push(maxBreak);
            }

            // update first and last class breaks to nice y domain
            classBreaks[0] = yTickScale.domain()[0];
            classBreaks[classBreaks.length - 1] = yTickScale.domain()[1];

            var labels = svg.selectAll('.labels').data([classBreaks]);

            labels.enter().
              append('g').
              attr('class', 'labels');

            labels.
              call(yAxis).
              // remove axis line that comes with d3 axis
              select('path').
              remove();

            labels.
              exit().
              remove();

            // draw legend colors
            var rects = svg.selectAll('.choropleth-legend-color').data(colors);

            rects.enter().
              append('rect');

            rects.
              attr('class', 'choropleth-legend-color').
              attr('width', colorWidth).
              attr('height', function(c, i) {
                return legendLabelColorHeight(i, height);
              }).
              attr('y', function(c, i) {
                return Math.floor(yLabelScale(classBreaks[i + 1]));
              }).
              style('fill', function(c, i) { return c; });

            if (colors.length > 1) {
              if (isLargeRange) {
                rects.
                  attr('data-flyout-text', function(color, i) {
                    return bigNumTickFormatter(classBreaks[i]) + ' - ' + bigNumTickFormatter(classBreaks[i + 1]);
                  });
              } else {
                rects.
                  attr('data-flyout-text', function(color, i) {
                    return classBreaks[i] + ' - ' + classBreaks[i + 1];
                  });
              }
            } else {
              if (isLargeRange) {
                rects.
                  attr('data-flyout-text', bigNumTickFormatter(singleClassBreak));
              } else {
                rects.
                  attr('data-flyout-text', singleClassBreak);
              }
            }

            rects.exit().
              remove();

            var legendPadding = parseInt(element.find('.' + className).css('padding'), 10);

            var maxLabelWidth = _.reduce(element.find('.labels > .tick > text'), function(accumulator, element) {
              return Math.max(accumulator, $(element).width());
            }, 0);

            element.find('.' + className).css('padding-left', legendPadding + yAxis.innerTickSize() + maxLabelWidth).show();

          }

        }


        /***************************
        * Handle dataset filtering *
        ***************************/

        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        function filterDataset(selectedFeature, callback) {
          selectedFeature.properties[Constants['SELECTED_PROPERTY_NAME']] = true;
          scope.$emit('dataset-filter:choropleth');
          scope.$emit(
            'toggle-dataset-filter:choropleth',
            selectedFeature,
            callback);
        }

        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        function clearDatasetFilter(selectedFeature, callback) {
          selectedFeature.properties[Constants['SELECTED_PROPERTY_NAME']] = false;
          scope.$emit('dataset-filter-clear:choropleth');
          scope.$emit(
            'toggle-dataset-filter:choropleth',
            selectedFeature,
            callback);
        }


        /**********************
        * Handle mouse events *
        **********************/

        function onFeatureMouseOver(e) {
          if (!element.parents('.card').hasClass('dragged')) {
            addHighlight(e);
          }
        }

        function onFeatureMouseMove(e) {

          currentFeature = e.target.feature;

          var evt = document.createEvent('HTMLEvents');
          evt.initEvent('surrogate-mousemove', true, true);
          evt.clientX = e.originalEvent.clientX;
          evt.clientY = e.originalEvent.clientY;
          e.originalEvent.target.dispatchEvent(evt);

        }

        function onFeatureMouseOut(e) {
          if (!element.parents('.card').hasClass('dragged')) {
            currentFeature = null;
            removeHighlight(e);
          }
        }

        function onFeatureClick(e) {

          var now = Date.now();
          var delay = now - lastClick;
          var featureIsSelected = false;
          lastClick = now;
          if (delay < doubleClickThreshold) {
            if (lastClickTimeout !== null) {
              // If this is actually a double click, cancel the timeout which selects
              // the feature and zoom in instead.
              $timeout.cancel(lastClickTimeout);
              map.setView(e.latlng, map.getZoom() + 1);
            }
          } else {
            lastClickTimeout = $timeout(function() {
              if (e.target.hasOwnProperty('feature') &&
                  e.target.feature.hasOwnProperty('properties') &&
                  e.target.feature.properties.hasOwnProperty(Constants['SELECTED_PROPERTY_NAME'])) {

                featureIsSelected = e.target.feature[Constants['SELECTED_PROPERTY_NAME']];
                // single click --> filters dataset
                if (featureIsSelected) {
                  clearDatasetFilter(e.target.feature, function(ok) {
                    if (ok) {
                      // TODO: Do something on filter clear?
                    }
                  });
                } else {

                  filterDataset(e.target.feature, function(ok) {
                    if (ok) {
                      // TODO: Do something on filter?
                    }
                  });
                }
              }
            }, singleClickSuppressionThreshold);
          }
        };


        /*********************************************************
        * Highlight features (helper functions for mouse events) *
        *********************************************************/

        function addHighlight(e) {
          var layer = e.target;

          // IE HACK: Attempt to fix the mouseout event not being reliable.
          if (L.Browser.ie) {
            clearHighlights(layer);
          }
          if (layer.hasOwnProperty('feature') &&
              layer.feature.hasOwnProperty('properties') &&
              layer.feature.properties.hasOwnProperty(Constants['SELECTED_PROPERTY_NAME']) &&
              !layer.feature.properties[Constants['SELECTED_PROPERTY_NAME']]) {

            layer.setStyle({
              weight: 4
            });
            layer.bringToFront();
          }
        }

        function removeHighlight(e) {
          var layer = e.target;

          if (layer.hasOwnProperty('feature') &&
              layer.feature.hasOwnProperty('properties') &&
              layer.feature.properties.hasOwnProperty(Constants['SELECTED_PROPERTY_NAME']) &&
              !layer.feature.properties[Constants['SELECTED_PROPERTY_NAME']]) {

            layer.setStyle({
              weight: 1
            });
            layer.bringToBack();
          }
        }

        function clearHighlights(layer) {
          _.each(layer._map._layers, function(l) {
            if (_.isPresent(l.feature) &&
                l.hasOwnProperty('feature') &&
                l.feature.hasOwnProperty('properties') &&
                l.feature.properties.hasOwnProperty(Constants['SELECTED_PROPERTY_NAME']) &&
                l.feature.properties[Constants['SELECTED_PROPERTY_NAME']]) {

              layer.setStyle({
                weight: 1
              });
            }
          });
        }


        /*************************
        * Handle flyout behavior *
        *************************/

        function applyRowDisplayUnit(value) {
          if (value !== '1') {
            return value + ' ' + scope.rowDisplayUnit.pluralize();
          } else {
            return value + ' ' + scope.rowDisplayUnit;
          }
        }

        FlyoutService.register('leaflet-clickable', function(element) {

          var featureHumanReadableName;
          var value;
          var unfilteredValue;
          var filteredValue;
          var filterApplied;
          var html;

          // To ensure that only one choropleth instance will ever draw
          // a flyout at a given point in time, we check to see if the
          // directive's private scope includes a non-null currentFeature.
          // This is set to a non-null value when a feature controlled by
          // the choropleth raises a mousemove event, and reset to null
          // when a feature controlled by the choropleth raises a mouseout
          // event. (See onFeatureMouseMove and onFeatureMouseOut).
          if (null === currentFeature) {
            return;
          }

          if ($(element).parents('.card').hasClass('dragged')) {
            return;
          }

          featureHumanReadableName = currentFeature.properties[Constants['HUMAN_READABLE_PROPERTY_NAME']];
          value = currentFeature.properties[Constants['FILTERED_VALUE_PROPERTY_NAME']];
          unfilteredValue = currentFeature.properties[Constants['UNFILTERED_VALUE_PROPERTY_NAME']];
          filteredValue = 0;

          filterApplied = (value !== unfilteredValue);

          if (typeof unfilteredValue !== 'number') {
            unfilteredValue = Constants['NULL_VALUE_LABEL'];
          } else {
            unfilteredValue = applyRowDisplayUnit($.toHumaneNumber(unfilteredValue));
          }

          if (typeof value !== 'number') {
            // filtered value should show as 0, if null/undefined.
            filteredValue = applyRowDisplayUnit('0');
          } else {
            filteredValue = applyRowDisplayUnit($.toHumaneNumber(value));
          }

          if (filterApplied) {

            html = '<div class="flyout-title">{0}</div>'
                 + '<div class="flyout-row">'
                 + '<span class="flyout-cell">{1}</span>'
                 + '<span class="flyout-cell">{2}</span>'
                 + '</div>'
                 + '<div class="flyout-row">'
                 + '<span class="flyout-cell emphasis">{3}</span>'
                 + '<span class="flyout-cell emphasis">{4}</span>'
                 + '</div>';

            return html.format(featureHumanReadableName.capitalizeEachWord(),
                               'Total',
                               unfilteredValue,
                               'Filtered amount',
                               filteredValue);
          } else {

            html = '<div class="flyout-title">{0}</div>'
                 + '<div class="flyout-row">'
                 + '<span class="flyout-cell">{1}</span>'
                 + '<span class="flyout-cell">{2}</span>'
                 + '</div>';

            return html.format(featureHumanReadableName.capitalizeEachWord(),
                               'Total',
                               unfilteredValue);

          }

        },
        // The second-to-last argument specifies whether the flyout should follow
        // the cursor (true) or be fixed to the target element (false).
        true,
        false);

        FlyoutService.register('choropleth-legend-color', function(element) {
          if ($(element).parents('.card').hasClass('dragged')) {
            return;
          }
          return '<div class="flyout-title">{0}</div>'.format(element.getAttribute('data-flyout-text'));
        },
        false,
        // The last argument specifies a horizontal display mode.
        true);

        /***************
        * Set up state *
        ***************/

        var options = {
          attributionControl: false,
          center: [47.609895, -122.330259], // Center on Seattle by default.
          keyboard: false,
          scrollWheelZoom: false,
          zoom: 1,
          zoomControlPosition: 'topleft'
        };

        var map = L.map(element.find('.choropleth-map-container')[0], options);
        // emit a zoom event, so tests can check it
        map.on('zoomstart zoomend', function(e) {
          scope.$emit(e.type, e.target);
        });

        // Keep track of the geojson layers so that we can remove them cleanly.
        // Every redraw of the map forces us to remove the layer entirely because
        // there is no way to mutate already-rendered geojson objects.
        var geojsonBaseLayer = null;

        // Watch for first render so we know whether or not to update the center/bounds.
        // (We don't update the center or the bounds if the choropleth has already been
        // rendered so that we can retain potential panning and zooming done by the user.
        var firstRender = true;

        // The methods by which we determine choropleth styles are wrapped up in the
        // ChoroplethVisualization class, which does a lot of dynamic styles based on the
        // individual dataset.
        var visualization = new ChoroplethVisualizationService.getChoroplethVisualization();

        // Keep track of click details so that we can zoom on double-click but
        // still selects on single clicks.
        var singleClickSuppressionThreshold = 200;
        var doubleClickThreshold = 400;
        var lastClick = 0;
        var lastClickTimeout = null;

        // Keep track of the currently-hovered-over feature so we can render flyouts outside
        // of Leaflet.
        var currentFeature = null;

        // Keep track of the base layer url currently in use so we only reset it when necessary.
        var currentBaseLayerUrl = null;


        /*********************************
        * React to changes in bound data *
        *********************************/

        Rx.Observable.subscribeLatest(
          scope.observe('baseLayerUrl'),
          element.observeDimensions().throttle(500),
          scope.observe('geojsonAggregateData'),
          function(baseLayerUrl, dimensions, geojsonAggregateData) {

            var classBreaks;
            var fillClass;
            var coloring;
            var geojsonOptions;

            if (_.isDefined(geojsonAggregateData)) {

              scope.$emit('render:start', { source: 'choropleth_{0}'.format(scope.$id), timestamp: _.now() });

              if (!_.isDefined(baseLayerUrl)) {
                baseLayerUrl = Constants['DEFAULT_MAP_BASE_LAYER_URL'];
              }

              if (currentBaseLayerUrl !== baseLayerUrl) {
                currentBaseLayerUrl = baseLayerUrl;
                setTileLayer(baseLayerUrl, { attribution: '', detectRetina: true, opacity: 0.15, unloadInvisibleTiles: true });
              }

              // Critical to invalidate size prior to updating bounds
              // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
              // This manifests itself as the map being zoomed all of the way out.
              map.invalidateSize();

              // Only update bounds on the first render so we can persist
              // users' panning and zooming.
              if (firstRender) {
                updateBounds(geojsonAggregateData);
                firstRender = false;
              }

              classBreaks = visualization.calculateDataClassBreaks(geojsonAggregateData, Constants['UNFILTERED_VALUE_PROPERTY_NAME']);

              coloring = visualization.calculateColoringParameters(visualization.defaultColorClass, classBreaks);

              updateLegend(classBreaks, coloring.scale.colors());

              if (_.isEmpty(classBreaks)) {
                fillClass = 'none';
              } else if (classBreaks.length === 1) {
                fillClass = 'single';
              } else {
                fillClass = 'multi';
              }

              geojsonOptions = {
                onEachFeature: function(feature, layer) {
                  layer.on({
                    mouseover: onFeatureMouseOver,
                    mouseout: onFeatureMouseOut,
                    mousemove: onFeatureMouseMove,
                    click: onFeatureClick
                  });
                },
                style: visualization.getStyleFn(coloring, fillClass)
              };

              setGeojsonData(geojsonAggregateData, geojsonOptions);

              // Iterate over selecteded features and ensure that they are 'on top'.
              // Otherwise, the selecteded stroke is likely to be hidden behind the
              // non-selected stroke.
              Object.
                keys(map._layers).
                forEach(function(k) {
                  if (map._layers[k].hasOwnProperty('feature') &&
                      map._layers[k].feature.hasOwnProperty('properties') &&
                      map._layers[k].feature.properties.hasOwnProperty(Constants['SELECTED_PROPERTY_NAME']) &&
                      map._layers[k].feature.properties[Constants['SELECTED_PROPERTY_NAME']]) {
                    map._layers[k].bringToFront();
                  }
                });

              // Yield execution to the browser to render, then notify that render is complete
              $timeout(function() {
                scope.$emit('render:complete', { source: 'choropleth_{0}'.format(scope.$id), timestamp: _.now() });
              });
            }
          });
      }
    }
  }

  angular.
    module('dataCards.directives').
      directive('choropleth', ['Constants',
                               'AngularRxExtensions',
                               '$timeout',
                               'numberFormatter',
                               'ChoroplethVisualizationService',
                               'WindowState',
                               'FlyoutService',
                               choropleth]);

})();

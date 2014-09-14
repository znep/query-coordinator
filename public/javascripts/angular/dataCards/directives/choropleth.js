(function() {
  'use strict';

  function choropleth(Constants, AngularRxExtensions, $timeout, numberFormatter, ChoroplethVisualizationService) {

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
                    '<div class="choropleth-legend-container modern-legend"></div>',
                  '</div>'].join(''),
      link: function(scope, element) {

        AngularRxExtensions.install(scope);

        /*********
        * Set up *
        *********/

        var options = {
          attributionControl: false,
          center: [47.609895, -122.330259], // Center on Seattle by default.
          keyboard: false,
          scrollWheelZoom: false,
          zoom: 1,
          zoomControlPosition: 'topleft'
        };

        var map = L.map(element.find('.choropleth-map-container')[0], options);

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

        // Keep track of which features are currently highlighted.
        // See 'highlightFeature()', 'unhighlightFeature()' and 'featureIsHighlighted()'.
        var highlightedFeatures = {};

        // Keep track of click details so that we can zoom on double-click but
        // still highlight on single clicks.
        var singleClickSuppressionThreshold = 200;
        var doubleClickThreshold = 400;
        var lastClick = 0;
        var lastClickTimeout = null;

        // Keep a handle for the flyout so we can manipulate it globally.
        var choroplethFlyout;

        // Keep track of the base layer url currently in use so we only reset it when necessary.
        var currentBaseLayerUrl = null;


        /**************************************
        * Functions that mutate Leaflet state *
        **************************************/

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

            // IMPORTANT NOTE: in geojson, positions are denoted as [longitude, latitude] pairs
            var lngs = _.map(positions, function(lngLat){ return lngLat[0]; });
            var lats = _.map(positions, function(lngLat){ return lngLat[1]; });

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

        };

        function updateLegend(classBreaks, colors) {

          function bigNumTickFormatter(val) {
            // used if ss.standard_deviation(classBreaks) > 10
            // val = a x 10^b (a: coefficient, b: exponent);
            if (val === 0) return 0;
            var exponent = Math.floor(Math.log(Math.abs(val))/Math.LN10);
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

          var className = 'modern-legend';
          var position = 'bottomright';

          if (colors.length === 0) {
            // short-circuit d3's exit selections and simply remove the entire legend vs removing individual components.
            d3.select(element[0]).select('.' + className).remove();
            return;
          }

          if (colors.length !== classBreaks.length - 1) {
            throw new Error('Cannot update legend: the number of legend colors (' + colors.length + ') should be 1 less than the number of class breaks (' + classBreaks.length + ').');
          }

          // draw the legend on the map

          var minBreak = classBreaks[0];
          var maxBreak = classBreaks[classBreaks.length - 1];

          var colorWidth = 15;
          var width = Math.floor(colorWidth);
          var height = Math.floor(Math.min(element.height() - 60, 250));


          var legendSelection = d3.select(element.find('.choropleth-legend-container')[0]).data([{colors: colors, classBreaks: classBreaks}]);

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

          if (classBreaks.length == 1) {
            // if there is just 1 value, make it range from 0 to that value
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

          var rects = svg.selectAll('.color').data(colors);

          rects.enter().
            append('rect');

          rects.
            attr('class', 'color').
            attr('width', colorWidth).
            attr('height', function(c, i){
              return legendLabelColorHeight(i, height);
            }).
            attr('y', function(c, i){
              return Math.floor(yLabelScale(classBreaks[i+1]));
            }).
            style('fill', function(color){ return color; });

          if (colors.length > 1) {
            if (isLargeRange) {
              rects.
                attr('data-flyout-text', function(color, i) {
                  return bigNumTickFormatter(classBreaks[i]) + ' - ' + bigNumTickFormatter(classBreaks[i+1]);
                });
            } else {
              rects.
                attr('data-flyout-text', function(color, i) {
                  return classBreaks[i] + ' - ' + classBreaks[i+1];
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

          // set up legend color flyouts
          $(element).find('.modern-legend').flyout({
            selector: '.color',
            direction: 'horizontal',
            style: 'table',
            parent: document.body,
            interact: true,
            overflowParent: true,
            inset: {
              horizontal: -3,
              vertical: 2
            },
            html: function($target, $head, options, $element) {
              // do not use $target.data('flyout-text') due to conflicts with jQuery caching .data() results
              // [see http://stackoverflow.com/questions/8707226/jquery-data-does-not-work-but-attrdata-itemname-does]
              return $target.attr('data-flyout-text');
            }
          });

        }


        /***************************************
        * Track which features are highlighted *
        ***************************************/

        function highlightFeature(featureId) {
          highlightedFeatures = {};
          highlightedFeatures[featureId] = true;
        }

        function unhighlightFeature(featureId) {
          if (highlightedFeatures.hasOwnProperty(featureId)) {
            delete highlightedFeatures[featureId];
          }
        }

        function featureIsHighlighted(featureId) {
          return highlightedFeatures.hasOwnProperty(featureId);
        }


        /***************************
        * Handle dataset filtering *
        ***************************/

        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        function filterDataset(selectedFeature, callback) {
          var featureId = selectedFeature.properties[Constants.get('INTERNAL_DATASET_FEATURE_ID')];
          highlightFeature(featureId);
          scope.$emit('dataset-filter:choropleth');
          scope.$emit(
            'toggle-dataset-filter:choropleth',
            selectedFeature,
            callback);
        }

        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        function clearDatasetFilter(selectedFeature, callback) {
          var featureId = selectedFeature.properties[Constants.get('INTERNAL_DATASET_FEATURE_ID')];
          unhighlightFeature(featureId);
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

          function applyRowDisplayUnit(val) {
            if (typeof val != 'number') {
              return '';
            } else {
              if (val != 1) {
                return ' ' + scope.rowDisplayUnit.pluralize();
              } else {
                return ' ' + scope.rowDisplayUnit;
              }
            }
          };

          // NOTE: one cannot attach data-attributes from a feature's geojson properties to their associated SVG path element via leaflet easily.
          // as a result, much of the $.flyout behavior must be custom-implemented, because $.flyout's #html option depends upon
          // the data being readily available.

          // initialize choro flyout element, can disappear on card collapse.
          choroplethFlyout = initializeChoroplethFlyout();
          var layer = e.target;
          var feature = layer.feature;
          var featureHumanReadableName = feature.properties[Constants.get('HUMAN_READABLE_PROPERTY_NAME')];
          var value = feature.properties[Constants.get('FILTERED_VALUE_PROPERTY_NAME')];
          var unfilteredValue = feature.properties[Constants.get('UNFILTERED_VALUE_PROPERTY_NAME')];
          var filteredValue = 0;
          var featureIsHighlighted = (value !== unfilteredValue);
          var unfilteredValueIsUndefined = false;
          var unfilteredValueDisplay;
          var filteredValueDisplay;
          var contents = [];

          if (!element.parents('.card').hasClass('dragged')) {

            choroplethFlyout.removeClass('undefined').removeClass('filtered');

            if (typeof value != 'number') {
              filteredValueDisplay = 0;
              // filtered value should show as 0, if null/undefined.
              filteredValue = 0;
            } else {
              filteredValueDisplay = $.toHumaneNumber(value);
            }

            if (typeof unfilteredValue != 'number') {
              unfilteredValueDisplay = Constants.get('NULL_VALUE_LABEL');
              unfilteredValueIsUndefined = true;
            } else {
              unfilteredValueDisplay = $.toHumaneNumber(unfilteredValue);
            }

            if (featureHumanReadableName) {
              choroplethFlyout.find('.flyout-title').text(featureHumanReadableName.capitaliseEachWord());
            }

            contents = [{ title: 'Total', body: unfilteredValueDisplay + applyRowDisplayUnit(unfilteredValue), italicize: unfilteredValueIsUndefined }];

            if (featureIsHighlighted) {
              contents.push({ title: 'Filtered Amount', body: filteredValueDisplay + applyRowDisplayUnit(filteredValue) });
              choroplethFlyout.addClass('filtered');
            }

            populateFlyout.call(choroplethFlyout, contents);

            mouseoverBrighten(e);

          }

        }

        function onFeatureMouseOut(e) {
          if (!element.parents('.card').hasClass('dragged')) {
            if (_.isEmpty($('#choropleth-flyout:hover'))) {
              choroplethFlyout.hide();
            }
            mouseoutUnbrighten(e);
          }
        }


        function onFeatureMouseMove(e) {
          if (element.parents('.card').hasClass('dragged')) {
            choroplethFlyout.hide();
          } else {
            choroplethFlyout.show();
            positionChoroplethFlyout.call(choroplethFlyout, e);
          }
        }

        function onFeatureClick(e) {

          var now = Date.now();
          // NOTE: uses real timestamp, so testing this requires an actual timeout, not just a mocked timeout!
          var delay = now - lastClick;
          lastClick = now;
          if (delay < doubleClickThreshold) {
            if (lastClickTimeout != null) {
              // If this is actually a double click, cancel the timeout which selects
              // the feature and zoom in instead.
              $timeout.cancel(lastClickTimeout);
              map.setView(e.latlng, map.getZoom() + 1);
            }
          } else {
            lastClickTimeout = $timeout(function() {
              var featureId = e.target.feature.properties[Constants.get('INTERNAL_DATASET_FEATURE_ID')];
              // single click --> filters dataset
              if (featureIsHighlighted(featureId)) {
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
            }, singleClickSuppressionThreshold);
          }
        };


        /**************************
        * Respond to mouse events *
        **************************/

        function clearAllBrighten(layer) {
          _.each(layer._map._layers, function(l) {
            if (_.isPresent(l.feature)) {
              var featureId = l.feature.properties[Constants.get('INTERNAL_DATASET_FEATURE_ID')];
              if (!featureIsHighlighted(featureId)) {
                layer.setStyle({
                  weight: 1
                });
              }
            }
          });
        }

        function mouseoverBrighten(e) {
          var layer = e.target;

          // IE HACK: Attempt to fix the mouseout event not being reliable.
          if (L.Browser.ie) {
            clearAllBrighten(layer);
          }
          var featureId = layer.feature.properties[Constants.get('INTERNAL_DATASET_FEATURE_ID')];
          if (!featureIsHighlighted(featureId)) {
            layer.setStyle({
              weight: 4
            });
            layer.bringToFront();
          }
        };

        function mouseoutUnbrighten(e) {
          var layer = e.target;
          var featureId = layer.feature.properties[Constants.get('INTERNAL_DATASET_FEATURE_ID')];
          if (!featureIsHighlighted(featureId)) {
            layer.setStyle({
              weight: 1
            });
            layer.bringToBack();
          }
        };


        /*************************
        * Handle flyout behavior *
        *************************/

        function initializeChoroplethFlyout() {
          choroplethFlyout = $('#choropleth-flyout');

          if (choroplethFlyout.length === 0) {
            var html = '<div id="choropleth-flyout" class="flyout nointeract flyout-chart top">' +
              '<div class="flyout-arrow left"></div>' +
              '<div class="flyout-title"></div>' +
              '<div class="flyout-content">' +
              '</div>' +
            '</div>';
            $('body').append(html);
            choroplethFlyout = $('#choropleth-flyout');
            choroplethFlyout.hide();

            choroplethFlyout.
              mousemove(function(e) {
                console.log(element, element.parents('.card'));
                if (element.parent('.card').hasClass('dragged')) {
                  console.log('what');
                }
                  positionChoroplethFlyout.call(choroplethFlyout, e);
              }).
              mouseout(function() {
                //remove bug where flyout doesn't disappear when hovering on map
                if ($("#choropleth-flyout:hover").length == 0) {
                  choroplethFlyout.hide();
                }
              });
          }

          return choroplethFlyout;

        }

        function positionChoroplethFlyout(e){

          // Note: 'this' is a jQuery object.

          var bodyWidth = document.body.clientWidth;
          var cursorTop = e.originalEvent.pageY;
          var cursorLeft = e.originalEvent.pageX;
          var flyoutHeight = this.outerHeight(true) + 2;
          var flyoutWidth = this.outerWidth(true) + 2;
          var marginX = this.outerWidth(true) - this.width();
          var arrowMargin = 15;
          var cursorArrowOffset = 5; // the "space" that appears between the pointer finger and the flyout arrow
          var arrowDisplacement = arrowMargin - cursorArrowOffset;

          // IE HACK: Move the flyout further from to stop interaction.
          if (L.Browser.ie) {
            arrowMargin += 10;
          }

          this.css("top", (cursorTop - flyoutHeight - arrowMargin));

          // spec: if the choropleth flyout approaches the edge of the screen,
          // keep the flyout fully displayed on the screen.
          // adjust the flyout arrow horizontally to track the mouse move.
          // flip the orientation of the arrow if you are over halfway across the flyout width.

          var orientationIsRight = cursorLeft > this.offset().left + this.width()/2;
          var leftOffset = cursorLeft - marginX / 2 + arrowDisplacement;
          var maxLeftOffset = bodyWidth - flyoutWidth + cursorArrowOffset;

          var choroplethFlyoutArrow = this.find('.flyout-arrow');

          if (orientationIsRight) {
            leftOffset -= arrowDisplacement;
            choroplethFlyoutArrow.removeClass('left').addClass('right');
          } else {
            choroplethFlyoutArrow.removeClass('right').addClass('left');
          }

          if (leftOffset < maxLeftOffset) {
            this.css('left', leftOffset);
            choroplethFlyoutArrow.css('left', 0);
          } else {
            this.css('left', maxLeftOffset);
            choroplethFlyoutArrow.css('left', leftOffset - maxLeftOffset);
          }
        };

        function populateFlyout(contents) {
          var htmlContent = '', valClass = '';
          for (var i = 0; i < contents.length; i++) {
            var content = contents[i];
            htmlContent += '<div class="flyout-row">' +
              '<span class="flyout-cell">' + content.title + '</span>' +
              '<span class="flyout-cell ' + (content.italicize ? 'italicize' : '') + '">' + content.body + '</span>' +
            '</div>';
          }
          this.children('.flyout-content').html(htmlContent);
        }

        /*********************************
        * React to changes in bound data *
        *********************************/

        Rx.Observable.subscribeLatest(
          scope.observe('baseLayerUrl'),
          element.observeDimensions().throttle(500),
          scope.observe('geojsonAggregateData'),
          function(baseLayerUrl, dimensions, geojsonAggregateData) {

            var classBreaks;
            var fillType = 'multi';
            var coloring;
            var geojsonOptions;

            if (_.isDefined(baseLayerUrl)) {

              if (currentBaseLayerUrl !== baseLayerUrl) {
                currentBaseLayerUrl = baseLayerUrl;
                setTileLayer(baseLayerUrl, { attribution: '', detectRetina: true, opacity: 0.15, unloadInvisibleTiles: true });
              }

              map.invalidateSize();

              if (_.isDefined(geojsonAggregateData)) {

                // Only update bounds on the first render so we can persist
                // users' panning and zooming.
                if (firstRender) {
                  updateBounds(geojsonAggregateData);
                  firstRender = false;
                }

                classBreaks = visualization.calculateDataClassBreaks(geojsonAggregateData, Constants.get('UNFILTERED_VALUE_PROPERTY_NAME'));

                coloring = visualization.calculateColoringParameters(visualization.defaultColorClass, classBreaks);

                updateLegend(classBreaks, visualization.sampleColorRange(coloring, classBreaks.length));

                geojsonOptions = {
                  onEachFeature: function(feature, layer) {
                    layer.on({
                      mouseover: onFeatureMouseOver,
                      mouseout: onFeatureMouseOut,
                      mousemove: onFeatureMouseMove,
                      click: onFeatureClick
                    });
                  },
                  style: visualization.getStyleFn(coloring, fillType)
                };

                setGeojsonData(geojsonAggregateData, geojsonOptions);

                // Iterate over highlighted features and ensure that they are 'on top'.
                // Otherwise, the highlighted stroke is likely to be hidden behind the
                // unhighlighted stroke.
                Object.
                  keys(map._layers).
                  forEach(function(k) {
                    if (map._layers[k].hasOwnProperty('feature') &&
                        map._layers[k].feature.properties[Constants.get('HIGHLIGHTED_PROPERTY_NAME')]) {
                      map._layers[k].bringToFront();
                    }
                  });

              }
            }
          });

      }

    }
  }

  angular.
    module('dataCards.directives').
      directive('choropleth', ['Constants', 'AngularRxExtensions', '$timeout', 'numberFormatter', 'ChoroplethVisualizationService', choropleth]);

})();

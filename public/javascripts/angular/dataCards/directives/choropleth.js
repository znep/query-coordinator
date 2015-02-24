(function() {
  'use strict';

  // A WORD ON TERMINOLOGY:
  //
  // 'selected' is what happens when you are filtering by a feature (this is currently an orange stroke).
  // 'highlighted' is what happens when you mouseover a feature (this is currently a white stroke).

  function choropleth(Constants,
                      AngularRxExtensions,
                      $timeout,
                      ChoroplethVisualizationService,
                      WindowState,
                      FlyoutService) {
    // The methods by which we determine choropleth styles are wrapped up in the
    // ChoroplethVisualization class, which does a lot of dynamic styles based on the
    // individual dataset.
    var visualizationUtils = ChoroplethVisualizationService.utils;

    /**
     * A choropleth legend, with discrete colors for ranges of values.
     */
    function LegendDiscrete(element, container, scope) {
      this.element = element;
      this.container = container;

      // Initialize the flyout handler
      FlyoutService.register('choropleth-legend-color', function(element) {
        if ($(element).parents('.card').hasClass('dragged')) {
          return;
        }
        return '<div class="flyout-title">{0}</div>'.format(
          element.getAttribute('data-flyout-text')
        );
      },
      scope.eventToObservable('$destroy'),
      false,
      // The last argument specifies a horizontal display mode.
      true);
    }

    $.extend(LegendDiscrete.prototype, {
      ZERO_COLOR: '#eeeeee',
      NEGATIVE_COLOR: '#c6663d',
      POSITIVE_COLOR: '#408499',

      /**
       * Generates a color scale for the given classBreaks.
       * @param {Number[]} classBreaks The values that define the boundaries of the different
       *   discrete groups of values.
       * @return {Object} an object with 'colors' and 'scale' functions, that mirror a chroma scale.
       */
      colorScaleFor: function(classBreaks) {
        var marginallyNegative = chroma.interpolate(this.ZERO_COLOR, this.NEGATIVE_COLOR, 0.1);
        var marginallyPositive = chroma.interpolate(this.ZERO_COLOR, this.POSITIVE_COLOR, 0.1);
        if (classBreaks.length === 1) {
          // There's only one value. So give it only one color.
          var color;
          if (classBreaks[0] < 0) {
            color = this.NEGATIVE_COLOR;
          } else if (classBreaks[0] > 0) {
            color = this.POSITIVE_COLOR;
          } else {
            color = this.ZERO_COLOR;
          }
          var singleColorScale = _.constant([color]);
          singleColorScale.colors = _.constant([color]);
          return singleColorScale;
        }

        if (classBreaks[0] < 0) {

          // If we have values that straddle zero, add the zero point as one of our breaks
          if (_.last(classBreaks) > 0) {
            var indexOf0 = classBreaks.indexOf(0);
            if (indexOf0 < 0) {
              throw 'Expecting classBreaks to contain a break at 0, if the values straddle 0';
            }
            var negatives = classBreaks.slice(0, indexOf0 + 1);
            var positives = classBreaks.slice(indexOf0);

            // When the values straddle 0 unevenly, we want the brightness of the colors to be
            // proportional to how far from 0 it is. In particular, we want eg 5 and -5 to have
            // about the same amount of luminosity. So - have the colors scale to the same absolute
            // distance from zero.
            var negativeHeavy = -classBreaks[0] > _.last(classBreaks);
            if (negativeHeavy) {
              // The last value of classBreaks is interpreted as the highest value that's in the
              // last class. Since we're adding another value to the end, it's meaning changes - now
              // it is the lowest value (inclusive) of the last break. Since we actually want that
              // value to be included in the last class, we have to increment it.
              positives[positives.length - 1] += (
                -classBreaks[0] - _.last(positives)) / 100;
              positives.push(-classBreaks[0]);
            } else {
              negatives.unshift(-_.last(classBreaks));
            }

            var negativeColorScale = visualizationUtils.calculateColoringScale(
              [this.NEGATIVE_COLOR, marginallyNegative], negatives
            );
            var positiveColorScale = visualizationUtils.calculateColoringScale(
              [marginallyPositive, this.POSITIVE_COLOR], positives
            );

            // Create a faux colorScale that implements the interface, but delegates to the positive
            // or negative actual-scale depending on what you're trying to scale.
            var fauxColorScale = _.bind(function(value) {
              if (value === 0) {
                return chroma(this.ZERO_COLOR);
              } else {
                return (value < 0 ? negativeColorScale : positiveColorScale)(value);
              }
            }, this);

            /**
             * Our faux .colors method basically just retrieves the positive and negative arrays and
             * combines them.
             */
            fauxColorScale.colors = function() {
              var negColors = negativeColorScale.colors();
              var posColors = positiveColorScale.colors();

              // We added a break to catch the most-luminescent color, on the scale that didn't have
              // values as high as the other one. So - drop that color.
              if (negativeHeavy) {
                posColors.pop();
              } else {
                negColors.shift();
              }

              // chroma gives us 2 colors if we give it a domain of only 2 values. This messes
              // things up later on when we assume that classBreaks.length == colors.length + 1, so
              // shave off some colors if we have to.
              if (negatives.length === 2)  {
                negColors = negColors.slice(0, 1);
              }
              if (positives.length === 2) {
                posColors = posColors.slice(1);
              }

              return negColors.concat(posColors);
            };

            return fauxColorScale;

          } else {

            // All the numbers are negative. Give them the negative color scale.
            return visualizationUtils.calculateColoringScale(
              [this.NEGATIVE_COLOR, marginallyNegative], classBreaks
            );
          }
        } else {
          // Otherwise, it's all positive, so give them the positive color scale.
          return visualizationUtils.calculateColoringScale(
            [marginallyPositive, this.POSITIVE_COLOR], classBreaks
          );
        }
      },

      /**
       * Updates the legend.
       *
       * @param {Number[]} data The data being plotted on the map.
       *
       * @return {chroma.scale} A chroma color scale that maps a datum value to a color.
       */
      update: function(data) {
        var classBreaks = visualizationUtils.calculateDataClassBreaks(
          data, Constants['UNFILTERED_VALUE_PROPERTY_NAME']
        );

        visualizationUtils.addZeroIfNecessary(classBreaks);

        var position = 'bottomright';
        var numTicks = 3;
        var tickValues;
        var colorScale = this.colorScaleFor(classBreaks);

        switch(classBreaks.length) {
          case 0:
            this.element.hide();
            return null;
          case 1:
            tickValues = classBreaks.slice(0);
            // If there is just 1 value, make it range from 0 to that value.
            if (classBreaks[0] === 0) {
              // ...the only value is 0. Give 'em a fake range. It's all they deserve.
              classBreaks.push(1);
            } else if (classBreaks[0] < 0) {
              classBreaks.push(0);
            } else {
              classBreaks.unshift(0);
            }
            break;
          case 2:
            // If there are two values, duplicate the max value, to allow there to be a color stop
            tickValues = classBreaks.slice(0);
            classBreaks = [classBreaks[0], classBreaks[1], classBreaks[1]]
            break;
          default:
            if (this.container.height() < 250) {
              numTicks = 3;
            } else {
              numTicks = Math.min(classBreaks.length, 4);
            }
        }

        var minBreak = classBreaks[0];
        var maxBreak = _.last(classBreaks);

        // Size of the colored scale.
        var COLOR_BAR_WIDTH = 15;
        var colorBarHeight = Math.floor(Math.min(this.container.height() - 60, 250));

        // Reserve some padding space for the bottom-most tick label text.
        var BOTTOM_PADDING = 15;

        var colors = colorScale.colors();

        // Give the svg an empty datum, so that it will create/reuse one svg
        var svg = d3.select(this.element[0]).selectAll('svg').data([{}]);

        svg.enter().
          append('svg');

        svg.attr('height', colorBarHeight + BOTTOM_PADDING);

        var yTickScale = d3.scale.linear().range([colorBarHeight - 1, 1]);
        var yLabelScale = d3.scale.linear().range([colorBarHeight, 0]);

        var yAxis = d3.svg.
                      axis().
                      scale(yTickScale).
                      orient('left');
        if (tickValues) {
          yAxis.tickValues(tickValues);
        } else {
          yAxis.ticks(numTicks);
        }

        // ensure that there's always a 0 tick
        /* TODO(jerjou): 2015-02-04 I can't seem to get a d3 range to NOT give me a 0 if it
         * straddles 0. So while I could leave this block in, I can't figure out a way to verify
         * that it works.
        if (minBreak <= 0 && maxBreak >= 0) {
          var ticks = yTickScale.ticks(numTicks);
          var index = ticks.indexOf(0);
          if (-1 === index) {
            ticks.splice(0, 0, 0);
          }
          yAxis.tickValues(ticks);
        }
        */

        var yTickScaleDomain = yTickScale.domain([minBreak, maxBreak]);
        var yLabelScaleDomain = yLabelScale.domain([minBreak, maxBreak]);

        var isLargeRange = ss.standard_deviation(classBreaks) > 10;

        if (isLargeRange) {
          // d3 quirk: using a #tickFormat formatter that just returns the value
          // gives unexpected results due to floating point math.
          // We want to just return the value for "small-ranged" data.
          // --> do not call a tickFormatter on yAxis if range is small.
          yAxis.tickFormat(visualizationUtils.bigNumTickFormatter);

          // Due to similar issues, d3's scale#nice method also has
          // floating point math issues.
          yTickScaleDomain.nice();
          yLabelScaleDomain.nice();
          // update first and last class breaks to nice y domain
          classBreaks[0] = yTickScale.domain()[0];
          classBreaks[classBreaks.length - 1] = yTickScale.domain()[1];
        }

        var labels = svg.selectAll('.labels').
            // Give it some data so it creates the container element
            data([null]);

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

        var maxLabelWidth = _.reduce(this.element.find('.labels > .tick > text'), function(accumulator, element) {
          return Math.max(accumulator, $(element).width());
        }, 0);
        var tickAreaWidth = maxLabelWidth + yAxis.tickSize() + yAxis.tickPadding();

        // The d3 axis places all elements LEFT of the origin (negative X coords).
        // Translate everything to within the bounds of the SVG.
        labels.
          attr('transform', 'translate({0})'.format(tickAreaWidth));

        // Size the SVG appropriately.
        svg.attr('width', tickAreaWidth + COLOR_BAR_WIDTH);

        // draw legend colors
        var rects = svg.selectAll('.choropleth-legend-color').data(colors);

        rects.enter().
          append('rect');

        var minVal = classBreaks[0];
        var maxVal = _.last(classBreaks);
        rects.
          attr('class', 'choropleth-legend-color').
          attr('width', COLOR_BAR_WIDTH).
          attr('height', _.bind(function(c, i) {
            return Math.floor(
              yLabelScale(classBreaks[i]) -
              yLabelScale(classBreaks[i + 1])
            );
          }, this)).
          attr('x', tickAreaWidth).
          attr('y', function(c, i) {
            return Math.floor(yLabelScale(classBreaks[i + 1]));
          }).
          style('fill', function(c, i) { return c; });

        if ((tickValues ? tickValues.length : numTicks) === 1) {
          var value = _.filter(classBreaks)[0];
          if (isLargeRange) {
            rects.
              attr('data-flyout-text', visualizationUtils.bigNumTickFormatter(value));
          } else {
            rects.
              attr('data-flyout-text', value);
          }
        } else {
          if (isLargeRange) {
            rects.
              attr('data-flyout-text', _.bind(function(color, i) {
                return visualizationUtils.bigNumTickFormatter(classBreaks[i]) + ' – ' +
                  visualizationUtils.bigNumTickFormatter(classBreaks[i + 1]);
              }, this));
          } else {
            rects.
              attr('data-flyout-text', function(color, i) {
                return classBreaks[i] + ' – ' + classBreaks[i + 1];
              });
          }
        }

        rects.exit().
          remove();

        return colorScale;
      }
    });


    /**
     * A Legend with a continuous scale.
     */
    function LegendContinuous(element, container) {
      this.element = element.addClass('continuous');
      this.container = container;
    }

    $.extend(LegendContinuous.prototype, {
      ZERO_COLOR: '#ffffff',
      NEGATIVE_COLOR: '#c6663d',
      POSITIVE_COLOR: '#003747',

      /**
       * Finds an array of values, including the min, max, and numStops - 2 more values,
       * evenly-spaced between the min and max.
       *
       * @param {d3.scale} scale a d3 scale whose domain is the value domain.
       * @param {Number} numStops the number of values to find.
       *
       * @return {Number[]} a sorted array of numbers, of length numStops. The first element is the
       *   smallest value in the features, the last element is the largest, and the other values are
       *   evenly spaced between them (and may not actually appear in the dataset).
       * @private
       */
      _findTickStops: function(scale, numStops) {
        var scaleForReversing = scale.copy().range([0, 1]);
        var stops = _.map(
          _.range(0, 1, 1 / (numStops - 1)),
          _.bind(scaleForReversing.invert, scaleForReversing)
        ).concat(_.last(scaleForReversing.domain()));
        if (_.last(stops) - stops[0] > 5) {
          stops = _.map(stops, Math.round);
        }
        return stops;
      },

      /**
       * Draw an SVG rectangle with the appropriate gradient.
       *
       * @param {Number[]} tickStops the values at which ticks will be drawn. The first value should
       *   be the minimum value, and the last value should be the maximum.
       * @param {d3.scale} colorScale a scale from a value, to a color.
       *
       * @return {d3.selection} the svg's d3 selection.
       * @private
       */
      _drawGradient: function(tickStops, colorScale) {
        var elementSelection = d3.select(this.element[0]);
        // Create the svg element
        var legendSvg = elementSelection.data([0]).selectAll('svg').data([0]);
        legendSvg.exit().remove();
        legendSvg.enter().append('svg').
          // Create the gradient that's referenced later when the containing rectangle is drawn.
          append('linearGradient').attr({
            id: 'gradient',
            gradientUnits: 'userSpaceOnUse',
            // x,y are actually left,top
            y1: '100%', x1: 0, x2: 0, y2: 0
          });
        // Due to a webkit bug (https://bugs.webkit.org/show_bug.cgi?id=83438), we can't select a
        // camelCase element. So select it by id
        var gradient = legendSvg.selectAll('#gradient');

        // Create a scale for positioning values by percentage
        var positionScale = colorScale.copy().range([0, 100]);
        var domain = positionScale.domain();
        if (domain.length > 2) {
          positionScale.domain([domain[0], _.last(domain)]);
        }

        // We'll make a stop in the gradient for each tick stop, to ensure the gradients grade
        // similarly.
        var gradientStops = gradient.selectAll('stop').data(tickStops);
        gradientStops.enter().append('stop');
        gradientStops.attr({
          offset: function(value) {
            return positionScale(value) + '%';
          },
          'stop-color': colorScale
        });
        gradientStops.exit().remove();

        // Draw the rectangles in pieces, so as to store the data, so the ticks can access them.
        var rectangles = legendSvg.selectAll('rect').data(tickStops);
        rectangles.enter().
          append('rect').attr({
            x: 0,
            y: function(value) {
              // Since y is actually 'top', and we want the lowest value at the bottom, subtract
              // from 100
              return (100 - positionScale(value)) + '%';
            },
            width: '100%',
            height: function(value, i) {
              if (i === 0) {
                return 0;
              }
              return Math.abs(positionScale(value) - positionScale(tickStops[i - 1])) + '%';
            },
            fill: 'url(#gradient)'
          });
        rectangles.exit().remove();

        return legendSvg;
      },

      /**
       * Creates the d3 scale used to map from a value to a color.
       *
       * @param {Number[]} tickStops an array of values, the first of which should be the minimum
       *   value of the data, the last of which should be the maximum value of the data.
       * @param {d3.scale} scale a d3 scale whose domain is the value domain.
       *
       * @return {d3.scale} a scale mapping from a value within features, to a color.
       * @private
       */
      _createColorScale: function(tickStops, scale) {
        var domain;
        var range = [this.NEGATIVE_COLOR, this.ZERO_COLOR, this.POSITIVE_COLOR];
        var min = tickStops[0];
        var max = _.last(tickStops);
        if (min >= 0) {
          // All positive values
          domain = [min, max];
          range = range.slice(1);
        } else if (max <= 0) {
          // All negative values
          domain = [min, max];
          range = range.slice(0, 2);
        } else {
          // Straddle zero
          domain = [min, 0, max];
        }

        return scale.copy().
          domain(domain).
          range(range);
      },

      /**
       * Draw the ticks and labels for the legend.
       */
      _drawAxis: function(legendSvg, tickStops, scale, indexOf0) {
        var positionScale = scale.copy().range([this.element.height(), 0]);
        var axis = d3.svg.axis().
          scale(positionScale).
          tickValues(tickStops).
          orient('left');

        if (_.last(tickStops) - tickStops[0] > 10) {
          axis.tickFormat(visualizationUtils.bigNumTickFormatter);
        }

        axis(legendSvg);

        // We want to size the ticks differently than d3's default. Do that manually.
        var ticks = legendSvg.selectAll('g.tick');
        var isSmall = true; // Alternate small/big, starting with big.
        ticks.classed('small', function(value, i) {
          if (i === indexOf0) {
            // zero was added artificially. Show a tick, but make it small.
            return true;
          }
          if (tickStops.length === (i + 1)) {
            // Always make the end ticks big
            return false;
          }
          // For normal ticks, alternate big and small
          isSmall = !isSmall;
          return isSmall;
        }).style('opacity', ''); // d3 sets an opacity for some reason. unset it.

        return axis;
      },

      /**
       * Determines the type of d3 scale to create for the given values, and creates it.
       *
       * @param {Number[]} values the data values we're visualizing.
       * @param {Number=} min the minimum value within values. Saves us the trouble of finding it,
       *   if you already have it.
       * @param {Number=} max the maximum value within values. Saves us the trouble of finding it,
       *   if you already have it.
       *
       * @return {d3.scale} a d3 scale of the determined type, with the domain set.
       */
      _scaleForValues: function(values, min, max) {
        min = min || _.min(values);
        max = max || _.max(values);
        var scale;

        if (min >= 0 || max <= 0) {
          var deltaMagnitude = _.log10(max - min);
          if (deltaMagnitude < 1) {
            scale = d3.scale.linear();
          } else if (deltaMagnitude <= 3 && min > 0 || max < 0) {
            scale = d3.scale.log();
          } else {
            // TODO: determine what the exponent should be based on the value distribution?
            scale = d3.scale.pow().exponent(2);
          }
        } else {
          scale = d3.scale.linear();
        }

        return scale.domain([min, max]).nice();
      },

      NUM_TICKS: 5,

      /**
       * Redraw the legend.
       *
       * TODO:
       * flyouts
       * make sure numbers fit AC
       *
       * @return {d3.scale} a scale mapping from value to color.
       */
      update: function(data) {
        if (!(data.features && data.features.length)) return;

        var values = _.pluck(
          _.pluck(data.features, 'properties'),
          Constants.UNFILTERED_VALUE_PROPERTY_NAME
        );
        var min = _.min(values);
        var max = _.max(values);
        if (min === max) {
          // If there's only one value, make it a scale from 0 to that value.
          if (max < 0) {
            values.push(0);
            max = 0;
          } else if (min > 0) {
            values.unshift(0);
            min = 0;
          } else {
            // ...the only value is 0. Give 'em a fake range. It's all they deserve.
            values.push(1);
            max = 1;
          }
        }

        var scale = this._scaleForValues(values, min, max);
        var tickStops = this._findTickStops(scale, Math.min(values.length, this.NUM_TICKS));
        var indexOf0 = visualizationUtils.addZeroIfNecessary(tickStops);

        var colorScale = this._createColorScale(tickStops, scale);
        var legendSvg = this._drawGradient(tickStops, colorScale);
        this._drawAxis(legendSvg, tickStops, scale, indexOf0);

        return colorScale;
      }
    });

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
      link: function(scope, element, attrs) {

        AngularRxExtensions.install(scope);

        var LegendType = attrs.stops === 'continuous' ? LegendContinuous : LegendDiscrete;
        var legend = new LegendType(element.find('.choropleth-legend'), element, scope);

        /***********************
         * Mutate Leaflet state *
         ***********************/

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

          if (layer.hasOwnProperty('feature') &&
              layer.feature.hasOwnProperty('properties') &&
              layer.feature.properties.hasOwnProperty(Constants['SELECTED_PROPERTY_NAME']) &&
              !layer.feature.properties[Constants['SELECTED_PROPERTY_NAME']]) {

            layer.setStyle({
              weight: 4
            });

            // IE HACK (CORE-3566): IE exhibits (not fully-characterized) pointer madness if you bring a layer 
            // containing a MultiPolygon which actually contains more than one polygon to the
            // front in a featureMouseOver. The rough cause is that the paths corresponding to this
            // layer get removed and re-added elsewhere in the dom while the mouseover is getting handled.
            // The symptoms of this are IE spewing mouseout events all over the place on each mousemove.
            // Since we've spent well over 4 dev days across the team trying to fix this, we'll just
            // sacrifice some prettiness (= getting a uniform stroke highlight) in exchange for actually
            // getting a featureMouseOut later.
            if (!L.Browser.ie) {
              layer.bringToFront();
            }
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

              l.setStyle({
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
        scope.eventToObservable('$destroy'),
        // The second-to-last argument specifies whether the flyout should follow
        // the cursor (true) or be fixed to the target element (false).
        true,
        false);

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
        // Manage the layers in a layerGroup, so we can clear them all at once.
        var layerGroup = L.layerGroup().addTo(map);
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

        // Keep track of click details so that we can zoom on double-click but
        // still selects on single clicks.
        var singleClickSuppressionThreshold = 200;
        var doubleClickThreshold = 400;
        var lastClick = 0;
        var lastClickTimeout = null;

        // Keep track of the currently-hovered-over feature so we can render flyouts outside
        // of Leaflet.
        var currentFeature = null;

        /*********************************
        * React to changes in bound data *
        *********************************/

        var tileLayer = scope.observe('baseLayerUrl').
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
            return L.tileLayer(url, { attribution: '', detectRetina: true, opacity: opacity, unloadInvisibleTiles: true });
          }).
          publish(); // Only subscribe once everything is wired up,
                     // otherwise some subscribers may miss the first
                     // value from the scope.observe().

        // Remove old map layers.
        tileLayer.bufferWithCount(2, 1).subscribe(function(layers) {
          map.removeLayer(layers[0]);
        });

        // Add new map layers.
        tileLayer.subscribe(function(layer) {
          layer.addTo(map);
        });
        
        // Now that everything's hooked up, connect the subscription.
        tileLayer.connect();

        Rx.Observable.subscribeLatest(
          element.observeDimensions().throttle(500),
          scope.observe('geojsonAggregateData'),
          function(dimensions, geojsonAggregateData) {

            if (_.isDefined(geojsonAggregateData)) {

              scope.$emit('render:start', {
                source: 'choropleth_{0}'.format(scope.$id), timestamp: _.now()
              });

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

              var coloring = legend.update(geojsonAggregateData);

              var geojsonOptions = {
                onEachFeature: function(feature, layer) {
                  layer.on({
                    mouseover: onFeatureMouseOver,
                    mouseout: onFeatureMouseOut,
                    mousemove: onFeatureMouseMove,
                    click: onFeatureClick
                  });
                },
                style: visualizationUtils.getStyleFn(coloring)
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
                               'ChoroplethVisualizationService',
                               'WindowState',
                               'FlyoutService',
                               choropleth]);

})();

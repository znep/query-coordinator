(function() {
  'use strict';

  // A WORD ON TERMINOLOGY:
  //
  // 'selected' is what happens when you are filtering by a feature (this is currently a yellow stroke).
  // 'highlighted' is what happens when you mouseover a feature (this is currently a white stroke).

  function choropleth(Constants,
    $timeout,
    ChoroplethVisualizationService,
    LeafletHelpersService,
    LeafletVisualizationHelpersService,
    FlyoutService,
    I18n,
    FormatService) {

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
      FlyoutService.register({
        selector: '.choropleth-legend-color',
        render: function(element) {
          if ($(element).parents('.card').hasClass('dragged')) {
            return undefined;
          }

          return '<div class="flyout-title">{0}</div>'.
            format(element.getAttribute('data-flyout-text'));
        },
        destroySignal: scope.$destroyAsObservable(),
        horizontal: true
      });
    }

    $.extend(LegendDiscrete.prototype, {

      /**
       * Generates a color scale for the given classBreaks.
       * @param {Number[]} classBreaks The values that define the boundaries of the different
       *   discrete groups of values.
       * @return {Object} an object with 'colors' and 'scale' functions, that mirror a chroma scale.
       */
      colorScaleFor: function(classBreaks) {
        var marginallyNegative = chroma.interpolate(
          Constants.DISCRETE_LEGEND_ZERO_COLOR,
          Constants.DISCRETE_LEGEND_NEGATIVE_COLOR,
          0.1
        );
        var marginallyPositive = chroma.interpolate(
          Constants.DISCRETE_LEGEND_ZERO_COLOR,
          Constants.DISCRETE_LEGEND_POSITIVE_COLOR,
          0.1
        );

        if (classBreaks.length === 1) {

          // There's only one value. So give it only one color.
          var color;
          if (classBreaks[0] < 0) {
            color = Constants.DISCRETE_LEGEND_NEGATIVE_COLOR;
          } else if (classBreaks[0] > 0) {
            color = Constants.DISCRETE_LEGEND_POSITIVE_COLOR;
          } else {
            color = Constants.DISCRETE_LEGEND_ZERO_COLOR;
          }

          var singleColorScale = _.constant([color]);
          singleColorScale.colors = _.constant([color]);

          return singleColorScale;
        }

        if (classBreaks[0] < 0) {

          // If we have values that straddle zero, add the zero point as one of our breaks
          if (_.last(classBreaks) > 0) {
            var indexOfZero = classBreaks.indexOf(0);
            if (indexOfZero < 0) {
              throw 'Expecting classBreaks to contain a break at 0, if the values straddle 0';
            }

            var negatives = classBreaks.slice(0, indexOfZero + 1);
            var positives = classBreaks.slice(indexOfZero);

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
              positives[positives.length - 1] += (-classBreaks[0] - _.last(positives)) / 100;
              positives.push(-classBreaks[0]);
            } else {
              negatives.unshift(-_.last(classBreaks));
            }

            var negativeColorScale = visualizationUtils.calculateColoringScale(
              [Constants.DISCRETE_LEGEND_NEGATIVE_COLOR, marginallyNegative],
              negatives
            );
            var positiveColorScale = visualizationUtils.calculateColoringScale(
              [marginallyPositive, Constants.DISCRETE_LEGEND_POSITIVE_COLOR],
              positives
            );

            // Create a faux colorScale that implements the interface, but delegates to the positive
            // or negative actual-scale depending on what you're trying to scale.
            var fauxColorScale = _.bind(function(value) {
              if (value === 0) {
                return chroma(Constants.DISCRETE_LEGEND_ZERO_COLOR);
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
              if (negatives.length === 2) {
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
              [Constants.DISCRETE_LEGEND_NEGATIVE_COLOR, marginallyNegative],
              classBreaks
            );
          }
        } else {
          // Otherwise, it's all positive, so give them the positive color scale.
          return visualizationUtils.calculateColoringScale(
            [marginallyPositive, Constants.DISCRETE_LEGEND_POSITIVE_COLOR],
            classBreaks
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
          data,
          Constants.UNFILTERED_VALUE_PROPERTY_NAME
        );

        visualizationUtils.addZeroIfNecessary(classBreaks);

        var numTicks = 3;
        var tickValues;
        var colorScale = this.colorScaleFor(classBreaks);

        switch (classBreaks.length) {

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
            classBreaks = [classBreaks[0], classBreaks[1], classBreaks[1]];
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
        var svg = d3.select(this.element[0]).
          selectAll('svg').
          data([{}]);

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

        // Ensure that there's always a 0 tick
        /* FIXME (jerjou): 2015-02-04 I can't seem to get a d3 range to NOT give me a 0 if it
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

        // 'ss' is simple_statistics.js
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

          // Update first and last class breaks to nice y domain
          classBreaks[0] = yTickScale.domain()[0];
          classBreaks[classBreaks.length - 1] = yTickScale.domain()[1];
        }

        // Give it some data so it creates the container element
        var labels = svg.selectAll('.labels').
            data([null]);

        labels.enter().
          append('g').
          attr('class', 'labels');

        // Remove axis line that comes with d3 axis
        labels.
          call(yAxis).
          select('path').
          remove();

        labels.
          exit().
          remove();

        var labelTextElement = this.element.find('.labels > .tick > text');
        var maxLabelWidth = _.reduce(labelTextElement, function(accumulator, element) {
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
        var rects = svg.
          selectAll('.choropleth-legend-color').
          data(colors);

        rects.enter().
          append('rect');

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
          style('fill', function(c) {
            return c;
          });

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
                return '{0} – {1}'.format(classBreaks[i], classBreaks[i + 1]);
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
      this.gradientId = 'gradient-{0}'.format(_.uniqueId());
    }

    $.extend(LegendContinuous.prototype, {

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
      findTickStops: function(scale, numStops) {
        var scaleForReversing = scale.copy().range([0, 1]);
        var stops = _.map(
          _.range(0, 1, 1 / (numStops - 1)),
          _.bind(scaleForReversing.invert, scaleForReversing)
        ).concat(_.last(scaleForReversing.domain()));

        if (_.last(stops) - stops[0] > 5) {
          stops = _.map(stops, Math.round);
        }

        // For log scales, if the first stop is zero, set it to the minimum value.
        if (scale.base && _.first(stops) === 0) {
          stops[0] = _.first(scale.domain());
        }

        return stops;
      },

      /**
       * Draw an SVG rectangle with the appropriate gradient.
       *
       * @param {jQuery selection} gradientSvg The node to render into.
       * @param {Number[]} tickStops the values at which ticks will be drawn. The first value should
       *   be the minimum value, and the last value should be the maximum.
       * @param {d3.scale} colorScale a scale from a value, to a color.
       *
       * @private
       */
      drawGradient: function(gradientSvg, tickStops, colorScale) {

        var gradientSvgSelection = d3.select(gradientSvg[0]);

        if (d3.select('#' + this.gradientId).empty()) {
          gradientSvgSelection.append('linearGradient').attr({
            id: this.gradientId,
            gradientUnits: 'userSpaceOnUse',
            y1: '100%',
            x1: 0,
            x2: 0,
            y2: 0
          });
        }

        // Due to a webkit bug (https://bugs.webkit.org/show_bug.cgi?id=83438), we can't select a
        // camelCase element. So select it by id
        var gradient = gradientSvgSelection.selectAll('#{0}'.format(this.gradientId));

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
            return '{0}%'.format(positionScale(value));
          },
          'stop-color': colorScale
        });
        gradientStops.exit().remove();

        // Draw the rectangles in pieces, so as to store the data, so the ticks can access them.
        var rectangles = gradientSvgSelection.
          selectAll('rect').
          data(tickStops);

        rectangles.enter().
          append('rect');

        rectangles.attr({
            x: 0,
            y: function(value) {

              // Since y is actually 'top', and we want the lowest value at the bottom, subtract
              // from 100
              return '{0}%'.format(100 - positionScale(value));
            },
            width: '100%',
            height: function(value, i) {
              if (i === 0) {
                return 0;
              }
              return '{0}%'.format(Math.abs(positionScale(value) - positionScale(tickStops[i - 1])));
            },
            fill: 'url(#{0})'.format(this.gradientId)
          });

        rectangles.exit().remove();
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
      createColorScale: function(tickStops, scale) {
        var domain;
        var range = [
          Constants.CONTINUOUS_LEGEND_NEGATIVE_COLOR,
          Constants.CONTINUOUS_LEGEND_ZERO_COLOR,
          Constants.CONTINUOUS_LEGEND_POSITIVE_COLOR
        ];
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

        // For log scales, if the domain includes zero, set it to the minimum value instead.
        if (scale.base && _.first(domain) === 0) {
          domain[0] = min;
        }

        return scale.copy().
          domain(domain).
          range(range);
      },

      /**
       * Draw the ticks and labels for the legend.
       *
       * @param {jQuery selection} ticksSvg The node to render into.
       * @param {jQuery selection} gradientSvg The associated gradient node to consult for layout.
       * @param {Number[]} tickStops the values at which ticks will be drawn. The first value should
       *   be the minimum value, and the last value should be the maximum.
       * @param {d3.scale} colorScale a scale from a value, to a color.
       * @param {Number} indexOfZero The index of the origin in ticks.
       *
       * @private
       */
      drawAxis: function(ticksSvg, gradientSvg, tickStops, scale, indexOfZero) {
        var ticksGroup = ticksSvg.find('g.ticks');
        var positionScale = scale.copy().range([this.element.height(), 0]);
        var axis = d3.svg.axis().
          scale(positionScale).
          tickValues(tickStops).
          orient('left');

        if (_.last(tickStops) - tickStops[0] > 10) {
          axis.tickFormat(visualizationUtils.bigNumTickFormatter);
        }

        axis(ticksGroup);

        // We want to size the ticks differently than d3's default. Do that manually.
        var ticks = d3.select(ticksGroup[0]).selectAll('g.tick');

        // Round ticks close to zero to fix logarithmic special cases.
        ticks.each(function(d) {
          if (Math.abs(d) < 1) {
            d3.select(this).select('text').text('0');
          }
        });

        // Alternate small/big, starting with big.
        var isSmall = true;

        ticks.classed('small', function(value, i) {

          // Zero was added artificially. Show a tick, but make it small.
          if (i === indexOfZero) {
            return true;
          }

          // Always make the end ticks big
          if (tickStops.length === (i + 1)) {
            return false;
          }

          // For normal ticks, alternate big and small
          isSmall = !isSmall;
          return isSmall;

        }).style('opacity', ''); // d3 sets an opacity for some reason. unset it.

        // D3's axis draws ticks left-of-origin, which causes issues with browsers that won't render
        // SVG elements outside of the parent SVG node's bounds (PhantomJS).
        // So shift the ticks right into positive X coordinates, and then move the entire SVG left
        // to compensate.
        // Similarly, D3's tick text extends above and below the SVG bounds. Compensate much the same way.
        var MAGICAL_FONT_RENDERING_ALLOWANCE = 10;
        var tickMaxWidth = d3.max(
          ticksGroup.find('g.tick').map(function(i, element) {
            return element.getBoundingClientRect().width;
          })
        ) + MAGICAL_FONT_RENDERING_ALLOWANCE;

        var tickMaxHeight = d3.max(
          ticksGroup.find('g.tick').map(function(i, element) {
            return element.getBoundingClientRect().height;
          })
        );

        // Allow for 1/2 tick height above and below by bumping up height.
        ticksSvg.height(gradientSvg.height() + tickMaxHeight);
        ticksSvg.width(gradientSvg.width() + tickMaxWidth);

        // Shift the entire SVG appropriately.
        ticksSvg.css('left', '{0}px'.format(-tickMaxWidth));
        ticksSvg.css('top', '{0}px'.format(parseInt(gradientSvg.css('top'), 10) - tickMaxHeight / 2));

        // Now listen to me very carefully. Compensate for shift in SVG by putting the ticks back.
        ticksGroup.attr('transform', 'translate({0},{1})'.format(tickMaxWidth, tickMaxHeight / 2));
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
      scaleForValues: function(values, min, max) {
        var scale;

        min = min || _.min(values);
        max = max || _.max(values);

        if (min > 0 || max < 0) {

          // Eligible for logarithmic scale, if all-positive or all-negative values
          var deltaMagnitude = _.log10(max - min);
          if (deltaMagnitude >= 3) {

            // Only logarithmic if we've got a large change in magnitude
            scale = d3.scale.log();
          } else {
            scale = d3.scale.linear();
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
      update: function(data, dimensions) {
        if (!(data.features && data.features.length)) {
          return undefined;
        }

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

          // ...the only value is 0. Give 'em a fake range. It's all they deserve.
          } else {
            values.push(1);
            max = 1;
          }
        }

        var scale = this.scaleForValues(values, min, max);
        var tickStops = this.findTickStops(scale, Math.min(values.length, this.NUM_TICKS));
        var indexOfZero = visualizationUtils.addZeroIfNecessary(tickStops);

        var colorScale = this.createColorScale(tickStops, scale);
        var gradientSvg = this.element.find('svg.gradient');
        var ticksSvg = this.element.find('svg.legend-ticks');

        // Grab the top and bottom padding from the css.
        var legendPaddingTop = parseInt(this.element.css('padding-top'), 10);
        var legendPaddingBottom = parseInt(this.element.css('padding-bottom'), 10);
        var legendVerticalPadding = legendPaddingTop + legendPaddingBottom;

        // We want the maximum height that will fit inside the visualization,
        // which comes down to: visualizationHeight - legendVerticalPadding.
        var legendHeight = Math.min(
          dimensions.height - legendVerticalPadding,
          parseInt(this.element.css('maxHeight'), 10)
        );

        // Assign this height to both the legend container and the gradient.
        // This will cause the legend to be rendered inside the visualization
        // in all cases, and at its maximum height if the visualization is
        // sufficiently tall.
        this.element.height(legendHeight);
        gradientSvg.height(legendHeight);

        this.drawGradient(gradientSvg, tickStops, colorScale);
        this.drawAxis(ticksSvg, gradientSvg, tickStops, scale, indexOfZero);

        return colorScale;
      }
    });

    return {
      restrict: 'E',
      replace: true,
      scope: {
        'baseLayerUrl': '=',
        'geojsonAggregateData': '=',
        'savedExtent': '=',
        'defaultExtent': '=',
        'rowDisplayUnit': '=?',
        'isFiltered': '='
      },
      template: ['<div class="choropleth-container">',
                    '<div class="choropleth-map-container"></div>',
                    '<div class="choropleth-legend">',
                      '<svg class="gradient"></svg>',
                      '<svg class="legend-ticks">',
                        '<g class="ticks"></g>',
                      '</svg>',
                    '</div>',
                    '<div class="choropleth-selection-box">',
                      '<span class="icon-filter"></span>',
                      '<span class="choropleth-selection-value"></span>',
                      '<span class="icon-close"></span>',
                    '</div>',
                  '</div>'].join(''),
      link: function choroplethLink(scope, element, attrs) {

        // Merge 'mousemove' and 'mouseleave' events into a single flyout
        // registration stream.
        var registerFlyout$ = Rx.Observable.merge(
          Rx.Observable.fromEvent(element, 'mousemove'),
          Rx.Observable.fromEvent(element, 'mouseleave')
        ).map(function(e) {
          return e.type === 'mousemove';
        }).distinctUntilChanged();

        var LegendType = attrs.stops === 'continuous' ? LegendContinuous : LegendDiscrete;
        var legend = new LegendType(element.find('.choropleth-legend'), element, scope);
        var savedExtent$ = scope.$observe('savedExtent');
        var defaultExtent$ = scope.$observe('defaultExtent');
        var baseLayerUrl$ = scope.$observe('baseLayerUrl');
        var geojsonAggregateData$ = scope.$observe('geojsonAggregateData');
        var selectionBox = element.find('.choropleth-selection-box');
        var selectionBoxFilterIcon = selectionBox.find('.icon-filter');
        var selectionBoxValue = selectionBox.find('.choropleth-selection-value');
        var clearSelectionButton = selectionBox.find('.icon-close');
        var map;
        var geojsonBaseLayer;
        var minLng;
        var maxLng;
        var minLat;
        var maxLat;
        var boundsArray;
        var coordinates;
        var selectedFeature;
        var currentFeature;
        var singleClickSuppressionThreshold;
        var doubleClickThreshold;
        var lastClick;
        var lastClickTimeout;

        /***********************
         * Mutate Leaflet state *
         ***********************/

        function setGeojsonData(data, options) {
          if (!_.isNull(geojsonBaseLayer)) {
            map.removeLayer(geojsonBaseLayer);
          }
          geojsonBaseLayer = L.geoJson(data, options);
          geojsonBaseLayer.addTo(map);
        }

        function updateBounds(geojsonData, defaultExtent, savedExtent) {

          function buildPositionArray(positions) {

            var cleanPositions = positions.filter(function(position) {
              return _.isNumber(position[0]) && _.isNumber(position[1]);
            });

            // IMPORTANT NOTE: in geojson, positions are denoted as [longitude, latitude] pairs
            var lngs = _.map(cleanPositions, function(lngLat) { return lngLat[0]; });
            var lats = _.map(cleanPositions, function(lngLat) { return lngLat[1]; });

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

          minLng = 180;
          maxLng = -180;
          minLat = 90;
          maxLat = -90;
          boundsArray = [
            [maxLat, maxLng],
            [minLat, minLng]
          ];

          if (_.isDefined(geojsonData)) {

            if (geojsonData.type !== 'FeatureCollection') {
              throw new Error('Cannot calculate geojson bounds: geojsonData is not of type <FeatureCollection>.');
            }

            _.each(geojsonData.features, function(feature) {
              coordinates = feature.geometry.coordinates;

              switch (feature.geometry.type) {

                // Polygon or MultiLineString coordinates
                // = arrays of position arrays
                case 'Polygon':
                case 'MultiLineString':
                  _.each(coordinates, function(positionArrays) {
                    buildPositionArray(positionArrays);
                  });
                  break;

                // MultiPolygon coordinates = an array of Polygon coordinate arrays
                case 'MultiPolygon':
                  _.each(coordinates, function(polygonCoordinates) {
                    _.each(polygonCoordinates, function(positionArrays) {
                      buildPositionArray(positionArrays);
                    });
                  });
                  break;

                // LineString coordinates = position array
                case 'LineString':
                  buildPositionArray(coordinates);
                  break;
              }

            });

            boundsArray = [
              [maxLat, maxLng],
              [minLat, minLng]
            ];

          }

          var computedBounds = L.latLngBounds([
            boundsArray[1][0],
            boundsArray[1][1]
          ], [
            boundsArray[0][0],
            boundsArray[0][1]
          ]);
          var initialBounds = computedBounds;

          if (_.isDefined(savedExtent)) {
            initialBounds = LeafletHelpersService.buildBounds(savedExtent);
          } else if (_.isDefined(defaultExtent)) {
            var defaultBounds = LeafletHelpersService.buildBounds(defaultExtent);

            if (!defaultBounds.contains(computedBounds)) {
              initialBounds = defaultBounds;
            }
          }

          // We need to explicitly pass an options object with
          // animate set to false because (in some cases) Leaflet
          // will default to an empty object if none is explicitly
          // provided and then check the value of a non-existent
          // animate property, causing a TypeError and halting
          // execution.
          map.fitBounds(
            initialBounds,
            { animate: false }
          );

        }

        /***************************
        * Handle dataset filtering *
        ***************************/

        // Determines whether or not the given layer
        // is selected.
        function isLayerSelected(layer) {
          var selectedPropertyName = 'feature.properties.{0}'.
            format(Constants.SELECTED_PROPERTY_NAME);

          return _.get(layer, selectedPropertyName);
        }

        // Send the toggle filter event up the scope to the parent, where it can
        // be handled by the model.
        function setDatasetFilter(feature) {
          feature.properties[Constants.SELECTED_PROPERTY_NAME] = true;
          scope.$emit('dataset-filter:choropleth');
          scope.$emit('toggle-dataset-filter:choropleth', feature);
        }

        function clearDatasetFilter(feature) {
          feature.properties[Constants.SELECTED_PROPERTY_NAME] = false;
          scope.$emit('dataset-filter-clear:choropleth');
          scope.$emit('toggle-dataset-filter:choropleth', feature);
        }

        // Display the bottom-left clear selection box
        function showSelectionBox() {
          var boxValue = selectedFeature.properties[Constants.HUMAN_READABLE_PROPERTY_NAME];

          // The max-width of the selection box is the width of the map minus
          // the left/right padding we want on each side.
          var maxWidth = element.width() -
            Constants.CHOROPLETH_SELECTION_BOX_LEFT -
            Constants.CHOROPLETH_SELECTION_BOX_RIGHT;

          selectionBoxValue.
            text(boxValue).
            css('max-width', maxWidth);

          selectionBox.show();
        }

        // Hide the bottom-left clear selection box
        function hideSelectionBox() {
          selectionBox.hide();
        }

        /*********************************************************
        * Highlight features (helper functions for mouse events) *
        *********************************************************/

        function addHighlight(e) {
          var layer = e.target;

          if (!isLayerSelected(layer)) {
            layer.setStyle({
              weight: Constants.CHOROPLETH_HIGHLIGHT_WIDTH
            });

            // IE HACK (CORE-3566): IE exhibits (not fully-characterized) pointer madness if you bring a layer
            // containing a MultiPolygon which actually contains more than one polygon to the
            // front in a featureMouseOver. The rough cause is that the paths corresponding to this
            // layer get removed and re-added elsewhere in the dom while the mouseover is getting handled.
            // The symptoms of this are IE spewing mouseout events all over the place on each mousemove.
            if (!L.Browser.ie) {
              layer.bringToFront();
            }
          }
        }

        function removeHighlight(e) {
          var layer = e.target;

          if (!isLayerSelected(layer)) {
            layer.setStyle({
              weight: Constants.CHOROPLETH_DEFAULT_WIDTH
            });
            layer.bringToBack();
          }
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
          lastClick = now;
          if (delay < doubleClickThreshold) {
            if (!_.isNull(lastClickTimeout)) {

              // If this is actually a double click, cancel the timeout which selects
              // the feature and zoom in instead.
              $timeout.cancel(lastClickTimeout);
              map.setView(e.latlng, map.getZoom() + 1);
            }
          } else {
            lastClickTimeout = $timeout(function() {
              if (isLayerSelected(e.target)) {
                clearDatasetFilter(e.target.feature);
              } else {
                setDatasetFilter(e.target.feature);
              }
            }, singleClickSuppressionThreshold);
          }
        }

        /*************************
        * Handle flyout behavior *
        *************************/

        function formatValue(value) {
          if (!_.isFinite(value)) {
            return Constants.NULL_VALUE_LABEL;
          }

          var rowDisplayUnit = value !== 1 ?
            scope.rowDisplayUnit.pluralize() :
            scope.rowDisplayUnit;

          return '{0} {1}'.format(FormatService.formatNumber(value), rowDisplayUnit);
        }

        function renderFlyout(ignored, element) {

          var feature;
          var featureHumanReadableName;

          var unfilteredValue;
          var filteredValue;
          var unfilteredValueIsValid;
          var filteredValueIsValid;

          var isFiltered;
          var isSelected;

          var flyoutContent;
          var flyoutSpanClass;
          var dragging = $(element).parents('.card').hasClass('dragged');

          // To ensure that only one choropleth instance will ever draw
          // a flyout at a given point in time, we check to see if the
          // directive's private scope includes a non-null currentFeature.
          // This is set to a non-null value when a feature controlled by
          // the choropleth raises a mousemove event, and reset to null
          // when a feature controlled by the choropleth raises a mouseout
          // event. (See onFeatureMouseMove and onFeatureMouseOut).
          if (dragging || (_.isNull(currentFeature) && _.isNull(selectedFeature))) {
            return undefined;
          }

          feature = _.isNull(currentFeature) ? selectedFeature : currentFeature;
          featureHumanReadableName = feature.properties[Constants.HUMAN_READABLE_PROPERTY_NAME];

          unfilteredValue = feature.properties[Constants.UNFILTERED_VALUE_PROPERTY_NAME];
          filteredValue = feature.properties[Constants.FILTERED_VALUE_PROPERTY_NAME];
          unfilteredValueIsValid = _.isFinite(unfilteredValue);
          filteredValueIsValid = _.isFinite(filteredValue);

          if (unfilteredValueIsValid && !filteredValueIsValid) {
            filteredValue = 0;
            filteredValueIsValid = true;
          }

          isFiltered = scope.isFiltered;
          isSelected = feature.properties[Constants.SELECTED_PROPERTY_NAME];

          unfilteredValue = formatValue(unfilteredValue);
          filteredValue = formatValue(filteredValue);

          flyoutContent = [
             '<div class="flyout-title">{0}</div>',
             '<div class="flyout-row">',
               '<span class="flyout-cell">{1}</span>',
               '<span class="flyout-cell">{2}</span>',
             '</div>'
          ];

          if (isFiltered || isSelected) {

            flyoutSpanClass = 'emphasis';
            flyoutContent.push(
              '<div class="flyout-row">',
                '<span class="flyout-cell {3}">{4}</span>',
                '<span class="flyout-cell {3}">{5}</span>',
              '</div>'
            );
          }

          if (isSelected) {

            flyoutSpanClass = 'is-selected';
            flyoutContent.push(
              '<div class="flyout-row">',
                '<span class="flyout-cell">&#8203;</span>',
                '<span class="flyout-cell">&#8203;</span>',
              '</div>',
              '<div class="flyout-row">',
                '<span class="flyout-cell">{6}</span>',
                '<span class="flyout-cell"></span>',
              '</div>'
            );
          }

          return flyoutContent.
            join('').
            format(
              _.escape(featureHumanReadableName),
              I18n.flyout.total,
              _.escape(unfilteredValue),
              flyoutSpanClass,
              I18n.flyout.filteredAmount,
              _.escape(filteredValue),
              I18n.flyout.clearFilterLong
            );

        }

        FlyoutService.register({
          selector: clearSelectionButton.selector,
          render: _.constant('<div class="flyout-title">{0}</div>'.format(I18n.flyout.clearFilter))
        });

        // Register flyouts if 'shouldRegister' is true, else deregister.
        registerFlyout$.subscribe(function(shouldRegister) {
          var selectionBoxSelectors = '{0}, {1}, {2}'.format(
            selectionBox.selector,
            selectionBoxFilterIcon.selector,
            selectionBoxValue.selector
          );


          if (shouldRegister) {

            FlyoutService.register({
              selector: '.leaflet-clickable',
              render: renderFlyout,
              destroySignal: scope.$destroyAsObservable(element),
              trackCursor: true
            });

            FlyoutService.register({
              selector: selectionBoxSelectors,
              render: renderFlyout,
              positionOn: function(target) {
                if (!$(target).parent().is(selectionBox.selector)) {
                  return selectionBox[0];
                }
              },
              destroySignal: scope.$destroyAsObservable(element)
            });

          } else {

            FlyoutService.deregister('.leaflet-clickable', renderFlyout);
            FlyoutService.deregister(selectionBoxSelectors, renderFlyout);

          }
        });

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

        if (Constants.DISABLE_LEAFLET_ZOOM_ANIMATION) {
          options.zoomAnimation = false;
        }

        map = L.map(element.find('.choropleth-map-container')[0], options);

        // emit a zoom event, so tests can check it
        map.on('zoomstart zoomend', function(e) {
          scope.$emit(e.type, e.target);
        });

        LeafletVisualizationHelpersService.emitExtentEventsFromMap(scope, map);

        // Keep track of the geojson layers so that we can remove them cleanly.
        // Every redraw of the map forces us to remove the layer entirely because
        // there is no way to mutate already-rendered geojson objects.
        geojsonBaseLayer = null;

        // Watch for first render so we know whether or not to update the center/bounds.
        // (We don't update the center or the bounds if the choropleth has already been
        // rendered so that we can retain potential panning and zooming done by the user.
        var firstRender = true;

        // Keep track of click details so that we can zoom on double-click but
        // still selects on single clicks.
        singleClickSuppressionThreshold = 200;
        doubleClickThreshold = 400;
        lastClick = 0;
        lastClickTimeout = null;

        // Keep track of the currently-hovered-over and currently-selected features
        // so we can render flyouts outside of Leaflet.
        currentFeature = null;
        selectedFeature = null;

        /*********************************
        * React to changes in bound data *
        *********************************/

        var tileLayer = baseLayerUrl$.
          map(function(url) {
            if (_.isUndefined(url)) {
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
            var layerOptions = {
              attribution: '',
              detectRetina: false,
              opacity: opacity,
              unloadInvisibleTiles: true
            };
            return L.tileLayer(url, layerOptions);
          }).
          publish();

        // Only subscribe once everything is wired up,
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

        var dimensions$ = element.observeDimensions().
          throttle(500, Rx.Scheduler.timeout).
          filter(function(dimensions) {
            return dimensions.width > 0 && dimensions.height > 0;
          });

        Rx.Observable.subscribeLatest(
          dimensions$,
          geojsonAggregateData$,
          defaultExtent$,
          savedExtent$,
          function(dimensions, geojsonAggregateData, defaultExtent, savedExtent) {

            if (_.isDefined(geojsonAggregateData)) {

              scope.$emit('render:start', {
                source: 'choropleth_{0}'.format(scope.$id),
                timestamp: _.now()
              });

              // Critical to invalidate size prior to updating bounds
              // Otherwise, leaflet will fit the bounds to an incorrectly sized viewport.
              // This manifests itself as the map being zoomed all of the way out.
              map.invalidateSize();

              // Only update bounds on the first render so we can persist
              // users' panning and zooming.
              if (firstRender) {
                updateBounds(geojsonAggregateData, defaultExtent, savedExtent);
                firstRender = false;
              }

              // First, hide the clear selection box on re-render
              hideSelectionBox();

              var coloring = legend.update(geojsonAggregateData, dimensions);

              var geojsonOptions = {
                onEachFeature: function(feature, layer) {
                  layer.on({
                    mouseover: onFeatureMouseOver,
                    mouseout: onFeatureMouseOut,
                    mousemove: onFeatureMouseMove,
                    click: onFeatureClick
                  });

                  // Then, if a layer is selected, show a clear selection box for it
                  if (isLayerSelected(layer)) {
                    selectedFeature = feature;
                    showSelectionBox();
                  }
                },
                style: visualizationUtils.getStyleFn(coloring)
              };

              setGeojsonData(geojsonAggregateData, geojsonOptions);

              // Yield execution to the browser to render, then notify that render is complete
              $timeout(function() {
                scope.$emit('render:complete', {
                  source: 'choropleth_{0}'.format(scope.$id),
                  timestamp: _.now()
                });
              });
            }
          });

        // After creating the selection box, bind a click event to it.
        selectionBox.on('click', function() {
          clearDatasetFilter(selectedFeature);
        });

        // Leaflet needs to be told to clean up after itself.
        scope.$destroyAsObservable(element).subscribe(function() {
          map.remove();
        });
      }
    };
  }

  angular.
    module('dataCards.directives').
      directive('choropleth', choropleth);

})();

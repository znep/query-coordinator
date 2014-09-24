(function() {
  // TODO: Have constants use constantsjs in services
  // Later: render shouldn't take in scope, 'cuz it shouldn't be stateful
  'use strict';

  // TODO(jerjou): this should be in css
  var MARGIN_BOTTOM = 16;
  var TICK_SIZE = 3;
  var NUMBER_OF_TICKS = 3;
  var FLYOUT_DATE_FORMAT = {
    DAY: 'D MMMM YYYY',
    MONTH: 'MMMM YYYY',
    YEAR: 'YYYY',
    DECADE: 'YYYYs'
  };

  var TICK_DATE_FORMAT = {
    DAY: 'D MMM',
    MONTH: 'MMM \'YY',
    YEAR: 'YYYY',
    DECADE: 'YYYY[s]'
  };

  function setChartDimensions(element, scope, dimensions, chartData) {
    var chartWidth = dimensions.width;
    if (chartWidth <= 0) {
      return null;
    }
    // Bad things happen if chartHeight is less than zero.
    var chartHeight = Math.max(dimensions.height - MARGIN_BOTTOM, 0);

    var chartEl = element.find('.timeline-chart-wrapper').find('svg.graph');
    chartEl.height(chartHeight);
    chartEl.width(chartWidth);

    return {
      width: chartWidth,
      height: chartHeight,
      d3: d3.select(chartEl[0]),
      element: chartEl
    };
  }

  function createScales(chartData, chart) {
    var totals = _.pluck(chartData, 'total').
        concat([0]); // We want min/max to be at least/most 0
    var maxValue = d3.max(totals);
    var minValue = d3.min(totals);

    var verticalScale = d3.scale.linear().
        domain([maxValue, minValue]).
        range([chart.height, 0]).
        clamp(true);

    var horizontalScale = d3.time.scale().
        domain([chartData[0].date, chartData[chartData.length-1].date]).
        range([0, chart.width]);

    return {
      max: maxValue,
      min: minValue,
      vert: verticalScale,
      horiz: horizontalScale
    }
  }

  /**
   * Creates a jQuery element displaying the vertical axis ticks.
   */
  function createYAxisTicks(chartScroll, chart, scales) {
    var element = $('<div>').addClass('ticks').css({
      top: chartScroll.position().top,
      width: chart.width,
      height: chart.height
    });
    var niceTicks = scales.vert.ticks(NUMBER_OF_TICKS);
    // This enforces 3 ticks if there are less. Might be brittle.
    if (niceTicks.length < NUMBER_OF_TICKS) {
      var newTicks = scales.vert.ticks(NUMBER_OF_TICKS + 2);
      niceTicks = [
        d3.mean(newTicks.slice(0, 2)),
        newTicks[2],
        d3.mean(newTicks.slice(-2))
      ];
    }

    _.each(_.uniq([0].concat(niceTicks)), function(tick) {
      element.append($('<div>').css('top', Math.floor(
        chart.height - scales.vert(tick))).text($.toHumaneNumber(tick)));
    });
    return element;
  };

  // Functions for highlighting segments and labels
  function showLabel(label) {
    label.addClass('active');
    if (label.hasClass('hidden')) {
      label.closest('.labels').addClass('dim');
    }
  }

  function revertLabel(label, scope) {
    label.removeClass('active');
    if (!scope.hasFilters() && label.hasClass('hidden')) {
      label.closest('.labels').removeClass('dim');
    }
  }

  /**
   * When you hover over a data segment, the label should highlight. When you highlight
   * over a label, the data segments in its range should highlight.
   */
  function setupHighlighting(container, state, scope) {
    // Highlight the relevant data when you mouse over a label.
    container.on('mouseenter', '.label', function(e) {
      var target = $(this);
      // Highlight (ie set class 'hover' on) all the columns above this label
      var labelDateStart;
      var labelDateEnd;
      if (target.hasClass('highlighted')) {
        labelDateStart = scope.filters[0].start;
        labelDateEnd = scope.filters[0].end;
      } else {
        var datum = d3.select(this).datum();
        labelDateStart = datum.date;
        labelDateEnd = labelDateStart + datum.range;
      }

      // Add class 'hover' to the segments corresponding to this label
      d3.select(container[0]).selectAll('g.segment').classed('hover', function(datum) {
        var date = datum.date;
        return labelDateStart <= date && date < labelDateEnd;
      });

      showLabel(target);

    // Highlight the label relevant to this segment
    }).on('mouseenter', 'g.segment', function(e) {
      if ($(this).hasClass('highlighted') || state.selectionActive) {
        return;
      }
      var data = d3.select(this).datum();
      var segmentDate = data.date;
      // Find the correct label for this date and set it to active
      d3.select(container[0]).selectAll('.labels .label').each(function (datum) {
        var label = $(this);
        var labelDateStart = datum.date;
        var labelDateEnd = labelDateStart + datum.range;

        if (labelDateStart <= segmentDate && segmentDate < labelDateEnd) {
          showLabel(label);
        }
      });

    // Remove all the highlighting
    }).on('mouseleave', 'g.segment,.label', function(e) {
      // Unhighlight ALL the things!
      revertLabel(container.find('.labels .label.active'), scope);
      d3.select(container[0]).selectAll('g.segment.hover').classed('hover', false);
    });

    scope.$on('timeline-chart:filter-cleared', function() {
      container.find('.labels').toggleClass('dim', scope.hasFilters());
    });
  }


  /**
   * The <div timeline-chart /> directive.
   * Turns the tagged element into a timeline chart.
   */
  function timelineChartDirective($timeout, AngularRxExtensions) {
    // Keep track of some state
    var state = {
      selectionActive: false // whether we're currently selecting a range
    };
    var renderTimelineChart = function(scope, element, dimensions, filterChanged) {
      var chartData = scope.chartData;
      var showFiltered = scope.showFiltered;
      var expanded = scope.expanded;
      var precision = scope.precision;
      var rowDisplayUnit = scope.rowDisplayUnit;
      var filters = scope.filters;

      // We sometimes want to highlight a subset of the data
      var filterStart;
      var filterEnd;
      if ($.isPresent(filters)) {
        filterStart = filters[0].start;
        filterEnd = filters[0].end;
      }

      // Draw the chart
      var chart = setChartDimensions(element, scope, dimensions, chartData);
      if (null === chart) {
        return;
      }
      // Create d3 scales for mapping the data to the chart
      var scales = createScales(chartData, chart);

      var chartScroll = element.find('.chart-scroll').css({
        width: chart.width,
        'padding-bottom': MARGIN_BOTTOM
      });


      // y-axis
      element.children('.ticks').remove();
      element.prepend(createYAxisTicks(chartScroll, chart, scales));

      // Create the time axis (X)
      // First the labels
      var domain = _.map(scales.horiz.domain(), function(date) {
        return moment(date);
      });
      // Figure out the time granularity
      var labelUnit = 'decade';
      if (moment(domain[0]).add('months', 2).isAfter(domain[1])) {
        labelUnit = 'day';
      } else if (moment(domain[0]).add('years', 2).isAfter(domain[1])) {
        labelUnit = 'month';
      } else if (moment(domain[0]).add('years', 20).isAfter(domain[1])) {
        labelUnit = 'year';
      }

      var tickDates;
      var tickRange;

      if (labelUnit === 'decade') {
        tickDates = scales.horiz.ticks(d3.time.year, 10);
        tickRange = moment.duration(10, 'year');
      } else {
        tickDates = scales.horiz.ticks(d3.time[labelUnit], 1);
        tickRange = moment.duration(1, labelUnit);
      }

      // Grab the data for each tick
      var labelData = [];
      // For each tickDate, find the first datum in chartData that's that date.
      // Since tickDate and chartData are both ordered, keep a pointer into chartData, and
      // pick up where we left off, when searching for the next tickDate.
      var chartPointer = 0;
      for (var i = 0, len = tickDates.length; i < len; i++) {
        for (var chartLen = chartData.length; chartPointer < chartLen; chartPointer++) {
          if (chartData[chartPointer].date.isSame(tickDates[i], labelUnit)) {
            // Found it. Save it, and break to look for the next tick
            chartData[chartPointer].range = tickRange;
            labelData.push(chartData[chartPointer]);
            break;
          }
        }
      }

      var segmentDuration = moment.duration(1, precision);
      var segmentWidth = scales.horiz(
        moment(scales.horiz.domain()[0]).add(segmentDuration));

      var updateTicks = function(tickSelection) {
        tickSelection.classed('tick-dark', scales.min < 0 && scales.max > 0);
        var ticks = tickSelection.selectAll('rect.tick').
          data(labelData);

        // TODO: investigate making these ticks consistent with eg our bar graph ticks
        // (ie lines rather than rectangles)
        var tickEnter = ticks.enter().append('rect').
           attr('class', 'tick').
           attr('height', TICK_SIZE).
           attr('width', TICK_SIZE);

        ticks.attr('x', function(datum) {
            return scales.horiz(datum.date) - TICK_SIZE / 2 - segmentWidth / 2;
          }).attr('y', chart.height - TICK_SIZE);

        ticks.exit().remove();
      };
      chart.d3.select('g.xticks').call(updateTicks);

      /**
       * Adds labels and sets their text and stuff.
       */
      var updateLabels = function() {
        var labels = element.find('.labels');
        var labelDivSelection = d3.select(labels[0]).
            selectAll('.label').data(labelData);

        labelDivSelection.enter().
          append('div').classed('label', true).
          append('div').classed('text', true);

        var labelPos = function(datum, label) {
          return scales.horiz(moment(datum.date) + datum.range / 2) -
            (($(label).width() + segmentWidth) / 2);
        };

        labelDivSelection.selectAll('.text').
          text(function(datum, i, j) {
            return moment(datum.date).format(TICK_DATE_FORMAT[labelUnit.toUpperCase()]);
          });
        labelDivSelection.
          style('left', function(datum, i, j) {
              return labelPos(datum, this) + 'px';
          }).
          classed('edge-label', function(datum, i) {
            var left = labelPos(datum, this);
            var right = left + $(this).outerWidth();
            return (right > chart.width || (i === 0 && left < 0));
          });

        // Space out the labels appropriately
        var maxWidth = 0;
        _.each(labelDivSelection[0], function(el, i) {
          if (el.offsetWidth > maxWidth) {
            maxWidth = el.offsetWidth;
          }
        });
        // We show only the first out of every `period` label - eg 1 out of every 3
        var tickSpacing = scales.horiz(labelData[1].date)
                        - scales.horiz(labelData[0].date);
        var period = Math.ceil(maxWidth / tickSpacing);
        labelDivSelection.classed('hidden', function(datum, i) {
          return i % period;
        });

        labelDivSelection.exit().remove();

        updateHighlightedLabel();
      };

      var updateHighlightedLabel = function() {
        var highlightedLabel = element.find('.labels .label.highlighted');
        if (filterStart && filterEnd) {
          // TOOD: creating document fragment ourselves might be faster here
          if (_.isEmpty(highlightedLabel)) {
            highlightedLabel = $('<div class="label highlighted">' +
                '<div class="text"></div>' +
                '<div class="cancel"> ×</div>' +
                '</div>');
            element.find('.labels').append(highlightedLabel);
          }

          var range = _.sortBy([filterStart, filterEnd]);
          var rangeStart = range[0];
          var rangeEnd = range[1];

          d3.select(highlightedLabel[0]).datum({date: rangeStart});

          var neverRound = true;

          // One segment at start of <precision>. Ex: 1 month
          var isStartOfSegment = rangeStart.clone().startOf(precision).isSame(rangeStart);
          var isOneSegmentWide = rangeEnd.diff(rangeStart, precision, neverRound) === 1;
          // One label unit. Ex: 1 year
          var isStartOfLabelSegment = rangeStart.clone().
              startOf(labelUnit).isSame(rangeStart);
          var isOneLabelSegmentWide = rangeEnd.diff(
            rangeStart, labelUnit, neverRound) === 1;

          var format;
          var text;
          if (isStartOfSegment && isOneSegmentWide) {
            format = TICK_DATE_FORMAT[precision];
            text = rangeStart.format(format);
          } else if (isStartOfLabelSegment && isOneLabelSegmentWide) {
            format = TICK_DATE_FORMAT[labelUnit.toUpperCase()];
            text = rangeStart.format(format);
          // Show as a range
          } else {
            format = TICK_DATE_FORMAT[precision];
            text = rangeStart.format(format) + ' - ' +
              rangeEnd.clone().subtract(1, precision).format(format)
          }
          highlightedLabel.find('.text').text(text);

          var centeringLabelLeft = Math.floor(
            (scales.horiz(rangeStart) + scales.horiz(rangeEnd)) / 2  -
            highlightedLabel.outerWidth() / 2
          );
          var maxLeft = chart.width - highlightedLabel.outerWidth();
          if (centeringLabelLeft < 0) {
            centeringLabelLeft = 0;
          } else if (centeringLabelLeft > maxLeft) {
            centeringLabelLeft = maxLeft;
          }
          highlightedLabel.css('left', centeringLabelLeft);
        } else {
          highlightedLabel.remove();
        }
      };

      var updateDragHandles = function() {
        var segments = chart.d3.selectAll('g.draghandle').
          data(_.compact(_.sortBy([filterStart, filterEnd])));

        var segmentEnter = segments.enter().append('g').
          attr('class', function(datum, i) {
            return 'draghandle ' + (i === 0 ? 'start' : 'end');
          });
        segmentEnter.append('line').attr('y1', 0);
        segmentEnter.append('rect').attr('x', -2).attr('width', 5);
        var handlePath = d3.svg.line().
          x(function(d) {
            return d[0];
          }).
          y(function(d) {
            return d[1];
          });
        var points = [
          [0, 0],
          [10, 0],
          [10, 8],
          [0, 16]
        ];
        segmentEnter.append('path').attr('d', function(d, i) {
          var orientedPoints;
          if (i === 0) {
            orientedPoints = _.map(points, function(point) {
              return [point[0] * -1, point[1]];
            });
          } else {
            orientedPoints = points;
          }
          return handlePath(orientedPoints) + 'Z';
        });
        segments.attr('transform', function(d) {
          return 'translate({0}, 0)'.format(
            Math.floor(scales.horiz(d - segmentDuration / 2)));
        });
        segments.selectAll('line').attr('y2', chart.height);
        segments.selectAll('rect').attr('height', chart.height);

        segments.exit().remove();

        updateLabels();
      };

      updateDragHandles();

      var clearFilter = function() {
        filterStart = null;
        filterEnd = null;
        scope.$emit('timeline-chart:filter-cleared');
        updateDragHandles();
      };

      // Dim the x-axis labels if we're filtering at the moment
      // .toggleClass wants an actual boolean value, so force the && expression to be
      // boolean
      element.find('.labels').toggleClass('dim', !!(filterStart && filterEnd));

      // Now render the data

      // Used to convert an array of xy values into a path.
      // The Math.floor fixes white lines caused by subpixel rendering.
      var lineSegment = d3.svg.line().
        x(function(d, i) {
          return Math.floor(d.x);
        }).y(function(d, i) {
          return Math.floor(d.y);
        });

      // Extract point and midpoints on either side
      var lineSegmentCoords = function(chartDataIndex, points) {
        var superIndex = chartDataIndex * 2;

        return points.slice(_.max([0, superIndex - 1]), superIndex + 2);
      };

      // Returns d3 path function for a line segment.
      var dLineSegment = function(points) {
        return function(d, i) {
          return lineSegment(lineSegmentCoords(i, points));
        };
      };

      // Returns d3 path function for a fill segment.
      var dFillSegment = function(points, secondPoints) {
        return function(d, i) {
          var coords = lineSegmentCoords(i, points);
          if (secondPoints) {
            var filtered = lineSegmentCoords(i, secondPoints);

            return lineSegment(coords.concat(filtered.reverse()));
          } else {
            var xs = _.pluck(coords, 'x');
            var height = chart.height - scales.vert(0);
            var bottomCoords = _.map([_.max(xs), _.min(xs)], function(x) {
              return { x: x, y: height };
            });
            return lineSegment(coords.concat(bottomCoords));
          }
        };
      };

      // Since the timeline is rendered in sections, we have to calculate the midpoints.
      function pointsToRender(field) {
        var pointCoords = [];
        _.each(chartData, function(datum, i) {
          pointCoords.push({
            x: scales.horiz(datum.date),
            y: chart.height - scales.vert(datum[field])
          });
        });
        var midCoords = [];
        _.each(pointCoords, function(coord, i) {
          var next = pointCoords[i+1];
          if (next) {
            midCoords.push({
              x: (coord.x + next.x) / 2,
              y: (coord.y + next.y) / 2
            });
          }
        });
        return _.compact(_.flatten(_.zip(pointCoords, midCoords)));
      }

      var updateLines = function(selection) {
        var segments = selection.selectAll('g.segment').
          data(chartData).
          classed('highlighted', function(datum) {
            return filterStart && filterEnd &&
              filterStart <= datum.date && datum.date < filterEnd;
          });
        var segmentEnter = segments.enter().append('g').
          attr('class', 'segment');

        segmentEnter.append('path').
          attr('class', 'fill unfiltered');
        segmentEnter.append('path').
          attr('class', 'fill filtered');

        segmentEnter.append('path').
          attr('class', 'line unfiltered');
        segmentEnter.append('path').
          attr('class', 'line filtered');

        segmentEnter.append('rect').
          attr('class', 'spacer').
          attr('y', 0);


        var transition = function(select) {
          if (filterChanged) {
            return select.transition();
          } else {
            return select;
          }
        };

        var totalPoints = pointsToRender('total');
        var filteredPoints;
        if (showFiltered) {
          filteredPoints = pointsToRender('filtered');
        } else {
          filteredPoints = totalPoints;
        }

        transition(selection.selectAll('g.segment path.line.filtered'))
          .attr('d', dLineSegment(filteredPoints));

        transition(selection.selectAll('g.segment path.line.unfiltered')).
          attr('d', dLineSegment(totalPoints));

        transition(selection.selectAll('g.segment path.fill.filtered'))
          .attr('d', dFillSegment(filteredPoints));

        transition(selection.selectAll('g.segment path.fill.unfiltered')).
          attr('d', dFillSegment(filteredPoints, totalPoints));

        transition(selection.selectAll('g.segment rect.spacer')).
          attr('x', function(datum, i) {
            return Math.floor(scales.horiz(datum.date - segmentDuration / 2));
          }).
          attr('width', Math.floor(segmentWidth)).
          attr('height', chart.height);
      };

      chart.d3.select('g.container').call(updateLines);


      // Flyouts
      chartScroll.undelegate();

      var cardMargin = parseInt(element.closest('.card').css('padding-right'), 10) || 15;
      // Common options for flyouts
      var flyoutOpts = {
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
      };
      chartScroll.flyout($.extend({
        selector: 'g.draghandle',
        html: 'Drag to change filter range'
      }, flyoutOpts));

      chartScroll.flyout($.extend({
        selector: '.labels .label.highlighted .cancel',
        html: 'Clear filter range'
      }, flyoutOpts));

      // This is set to true when the user is selecting a region, and back to false when
      // they finish. We care, because we want the label highlighting behavior to be
      // different during a selection than normal.
      state.selectionActive = false;

      chartScroll.flyout($.extend({
        selector: '.label',
        positionOn: function(target, head, options) {
          var labelDateStart;
          var labelDateEnd;
          if (target.hasClass('highlighted')) {
            // Position the flyout centered above the highlighted region
            labelDateStart = filterStart;
            labelDateEnd = filterEnd;
          } else {
            // Position the flyout centered above the label's region
            var datum = d3.select(target[0]).datum();
            labelDateStart = datum.date;
            labelDateEnd = labelDateStart + datum.range;
          }

          // Find the center segment to position over
          // Find all the segments encompassed by this label
          options.segments = d3.selectAll(element.find('g.segment')).filter(
            function(datum) {
              var date = datum.date;
              return labelDateStart <= date && date < labelDateEnd;
            });

          var center = Math.floor(options.segments[0].length / 2);
          return $(options.segments[0][center]).find('path.fill.unfiltered');
        },
        title: function(target, head, options) {
          return target.find('.text').text();
        },
        table: function(target, head, options, $flyout) {
          var total = 0;
          var filtered = 0;

          // Use the filtered segments list made in positionOn to sum
          options.segments.each(function(data) {
            total += data.total;
            filtered += data.filtered;
          });
          var unit = rowDisplayUnit ? ' ' + rowDisplayUnit.pluralize() : '';
          var rows = [
            ['Total', $.toHumaneNumber(total) + unit]
          ];
          if (showFiltered) {
            $flyout.addClass('filtered');
            rows.push(['Filtered Amount', $.toHumaneNumber(filtered) + unit]);
          }
          return rows;
        }
      }, flyoutOpts));
      chartScroll.flyout($.extend({
        selector: 'g.segment',
        positionOn: function(target, head, options) {
          return target.find('path.fill.unfiltered');
        },
        title: function(target, head, options) {
          var targetDate = d3.select(target[0]).datum().date;
          return moment(targetDate).format(FLYOUT_DATE_FORMAT[precision]);
        },
        // Construct the data to display
        table: function(target, head, options, $flyout) {
          var data = d3.select(target[0]).datum();
          var unit = rowDisplayUnit ? ' ' + rowDisplayUnit.pluralize() : '';
          var rows = [
            ['Total', $.toHumaneNumber(data.total) + unit]
          ];
          if (showFiltered) {
            $flyout.addClass('filtered');
            rows.push(['Filtered Amount', $.toHumaneNumber(data.filtered) + unit]);
          }
          return rows;
        }
      }, flyoutOpts));

      var setupClickHandler = function() {
        var dragActive = false;
        var moved = false;
        var isFilteredTarget = false;
        var isClearable = false;

        chartScroll.on('mousedown', 'g.segment, .labels .label', function(event) {
          if (event.which > 1) {
            // Don't capture right-clicks
            return;
          }
          var clickedDatum = d3.select(event.currentTarget).datum();
          filterStart = clickedDatum.date;
          var duration = $(event.currentTarget).is('.label') ?
              clickedDatum.range : segmentDuration;
          filterEnd = moment(clickedDatum.date).add(duration);

          isFilteredTarget = $(event.currentTarget).is('.highlighted');
          isClearable = $(event.currentTarget).is('.label') ||
                        element.find('g.segment.highlighted').length === 1;
          moved = false;
          state.selectionActive = true;

          element.addClass('selecting');
          event.preventDefault();
        }).on('mousedown', 'g.draghandle', function(event) {
          dragActive = $(event.currentTarget).is('.start') ? 'start' : 'end';
          isClearable = true;
          moved = false;

          element.addClass('selecting');
          event.preventDefault();
        }).on('mousemove', 'g.segment, .labels .label:not(.highlighted)',
          function(event) {
            if (state.selectionActive || dragActive) {
              var clickedDatum = d3.select(event.currentTarget).datum();
              var duration = $(event.currentTarget).is('.label') ?
                  clickedDatum.range : segmentDuration;
              var newEnd = clickedDatum.date;
              moved = true;

              if (state.selectionActive) {
                if (newEnd >= filterStart) {
                  filterEnd = moment(newEnd).add(duration);
                } else {
                  if (filterEnd >= filterStart) {
                    filterStart = moment(filterStart).add(duration);
                  }
                  filterEnd = newEnd;
                }
              } else if (dragActive) {
                if (dragActive === 'start') {
                  filterStart = newEnd;
                } else {
                  filterEnd = moment(newEnd).add(duration);
                }
              }

              // Clamp the range
              var domain = scales.horiz.domain();
              var domainStart = moment(domain[0]);
              var domainEnd = moment(domain[1]).add(segmentDuration);
              if (filterEnd > domainEnd) {
                filterEnd = domainEnd;
              }
              if (filterEnd < domainStart) {
                filterEnd = domainStart;
              }
              if (filterStart > domainEnd) {
                filterStart = domainEnd;
              }
              if (filterStart < domainStart) {
                filterStart = domainStart;
              }
              updateDragHandles();
            }
          });

        if (scope.mouseUpHandler) {
          $(window).off('mouseup.TimelineChart', scope.mouseUpHandler);
        }
        scope.mouseUpHandler = function(event) {
          if (dragActive || state.selectionActive) {
            element.removeClass('selecting');
            // If clicked on a selected segment and the user hasn't moved, clear the
            // filter.
            if ((dragActive || isFilteredTarget) && isClearable && moved === false) {
              clearFilter();
            } else {
              state.selectionActive = false;
              dragActive = false;
              var sorted = _.sortBy([filterStart, filterEnd]);
              filterStart = sorted[0];
              filterEnd = sorted[1];
              scope.$emit('timeline-chart:filter-changed', sorted);
            }
            chart.d3.select('g.container').call(updateLines);
          }
        };
        $(window).on('mouseup.TimelineChart', scope.mouseUpHandler);
      };
      setupClickHandler();
    };

    return {
      templateUrl: '/angular_templates/dataCards/timelineChart.html',
      restrict: 'A',
      scope: {
        chartData: '=',
        showFiltered: '=',
        expanded: '=',
        precision: '=',
        rowDisplayUnit: '=',
        filters: '='
      },
      link: function(scope, element, attrs) {
        AngularRxExtensions.install(scope);

        var lastFilter = false;
        var lastData = false;

        scope.hasFilters = function() {
          return (this.filters && this.filters.length && this.filters[0].start &&
                  this.filters[0].end);
        };

        setupHighlighting(element, state, scope);

        Rx.Observable.subscribeLatest(
          element.closest('.card-visualization').observeDimensions(),
          scope.observe('chartData'),
          scope.observe('precision'),
          scope.observe('showFiltered'),
          scope.observe('expanded'),
          scope.observe('rowDisplayUnit'),
          scope.observe('filters'),
          function(cardVisualizationDimensions, chartData, precision, showFiltered) {
            if (!_.isDefined(chartData) || !_.isDefined(precision)) {
              return;
            }
            var timestamp = _.now();
            scope.$emit('render:start', 'timelineChart_{0}'.format(scope.$id), timestamp);

            renderTimelineChart(
              scope, element, cardVisualizationDimensions,
              lastData && ( lastFilter != showFiltered || lastData != chartData )
            );

            lastFilter = showFiltered;
            lastData = chartData;
            $timeout(function() {
              scope.$emit('render:complete', 'timelineChart_{0}'.format(scope.$id),
                          timestamp);
            }, 0, false)
          }
        );
        // Clean up jQuery on card destruction to stop memory leaks.
        scope.$on('$destroy', function() {
          element.find('.chart-scroll').undelegate();
          $(window).off('mouseup.TimelineChart', scope.mouseUpHandler);
        });
      }
    };
  };

  angular.
    module('socrataCommon.directives').
    directive('timelineChart', timelineChartDirective);
})();

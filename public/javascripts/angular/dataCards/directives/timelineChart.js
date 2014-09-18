(function() {
  // TODO: Have constants use constantsjs in services
  // Later: render shouldn't take in scope, 'cuz it shouldn't be stateful
  'use strict';

  // TODO(jerjou): this should be in css
  var MARGIN_BOTTOM = 0;
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

  /**
   * The <div timeline-chart /> directive.
   * Turns the tagged element into a timeline chart.
   */
  function timelineChartDirective($timeout, AngularRxExtensions) {
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

      // MARK
      var tickDates;
      var tickRange;

      if (labelUnit === 'decade') {
        tickDates = scales.horiz.ticks(d3.time.year, 10);
        tickRange = moment.duration(10, 'year');
      } else {
        tickDates = scales.horiz.ticks(d3.time[labelUnit], 1);
        tickRange = moment.duration(1, labelUnit);
      }

      // TODO: faster way to do this? ie pick out the datums that correspond to the ticks
      // Grab the data for each tick
      var labelData = _.map(tickDates, function(date) {
        return _.find(chartData, function(datum) {
          return datum.date.isSame(date, labelUnit);
        });
      });

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

        ticks.attr('x', function(d) {
            return scales.horiz(d.date) - TICK_SIZE / 2 - segmentWidth / 2;
          }).attr('y', chart.height - TICK_SIZE);

        ticks.exit().remove();
      };
      chart.d3.select('g.xticks').call(updateTicks);

      /**
       * Adds labels and sets their text and stuff.
       */
      var updateLabels = function() {
        var labelDivSelection = d3.select(element[0]).
            select('.labels').selectAll('.label').data(labelData);

        labelDivSelection.enter().
          append('div').classed('label', true).
          append('div').classed('text', true);

        var labelPos = function(time, label) {
          return scales.horiz(moment(time) + tickRange / 2) -
            $(label).width() / 2 - segmentWidth / 2;
        };

        labelDivSelection.selectAll('.text').
          text(function(d, i, j) {
            return moment(d.date).format(TICK_DATE_FORMAT[labelUnit.toUpperCase()]);
          });
        labelDivSelection.
          style('left', function(d, i, j) {
              return labelPos(d.date, this) + 'px';
          }).
          classed('dim', function(d, i) {
            return filterStart && filterEnd;
          }).
          classed('edge-label', function(d, i) {
            var left = labelPos(d.date, this);
            var right = left + $(this).outerWidth();
            return (right > chart.width || (i === 0 && left < 0));
          }).
          style('opacity', function(d, i) {
            var left = labelPos(d.date, this);
            var right = left + $(this).outerWidth();
            if (right > chart.width) {
              return 0;
            }
            if (i === 0) {
              if (left < 0) {
                return 0;
              }
            } else {
              var prevDiv = element.find('.label').eq(i-1);
              var prevLeft = labelPos(d3.select(prevDiv[0]).datum().date, this);
              if (prevDiv.css('opacity') > 0 &&
                  (prevLeft + prevDiv.outerWidth() > left)) {
                return 0;
              }
            }
            return 1;
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
          var isStartOfLabelSegment = rangeStart.clone().startOf(labelUnit).isSame(rangeStart);
          var isOneLabelSegmentWide = rangeEnd.diff(rangeStart, labelUnit, neverRound) === 1;

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
          attr('class', function(d, i) {
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
          return 'translate({0}, 0)'.format(Math.floor(scales.horiz(d - segmentDuration / 2)));
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
        _.each(chartData, function(d, i) {
          pointCoords.push({
            x: scales.horiz(d.date),
            y: chart.height - scales.vert(d[field])
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
          classed('highlighted', function(d) {
            return filterStart && filterEnd &&
              filterStart <= d.date && d.date < filterEnd;
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
          attr('x', function(d, i) {
            return Math.floor(scales.horiz(d.date - segmentDuration / 2));
          }).
          attr('width', Math.floor(segmentWidth)).
          attr('height', chart.height);
      };

      chart.d3.select('g.container').call(updateLines);


      // Flyouts
      chartScroll.undelegate();

      var cardMargin = parseInt(element.closest('.card').css('padding-right'), 10) || 15;
      chartScroll.flyout({
        selector: 'g.draghandle',
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
        html: 'Drag to change filter range'
      });

      chartScroll.flyout({
        selector: '.labels .label.highlighted .cancel',
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
        html: 'Clear filter range'
      });

      // This is set to true when the user is selecting a region, and back to false when
      // they finish. We care, because we want the label highlighting behavior to be
      // different during a selection than normal.
      var selectionActive = false;

      chartScroll.flyout({
        selector: 'g.container g.segment, .labels .label',
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
        positionOn: function(target, head, options) {
          options.isLabel = target.is('.label');
          options.isHighlighted = target.is('.highlighted');
          options.originalTarget = target;
          if (options.isLabel) {
            // TODO(jerjou): break this out, since it has nothing to do with the flyout
            // Highlight (ie set class 'hover' on) all the columns above this label
            var labelDateStart;
            var labelDateEnd;
            if (options.isHighlighted) {
              labelDateStart = filterStart;
              labelDateEnd = filterEnd;
            } else {
              labelDateStart = d3.select(target[0]).datum().date;
              labelDateEnd = labelDateStart + tickRange;
            }

            options.segments = [];
            // Add class 'hover' to the segments corresponding to this label
            d3.selectAll(element.find('g.segment')).filter(function(d) {
              var date = d.date;
              return labelDateStart <= date && date < labelDateEnd;
            }).classed('hover', function() {
              options.segments.push(this);
              return true;
            });
            var center = Math.floor(options.segments.length / 2);

            return $(options.segments[center]).find('path.fill.unfiltered');
          } else {
            options.datum = d3.select(target[0]).datum();
            var targetDate = options.datum.date;
            var segmentIndex = _.indexOf(_.pluck(chartData, 'date'), targetDate);

            return chartScroll.find('path.fill.unfiltered').eq(segmentIndex);
          }
        },
        title: function(target, head, options) {
          if (options.isLabel) {
            return options.originalTarget.find('.text').text();
          } else {
            var targetDate = d3.select(target[0]).datum().date;

            return moment(targetDate).format(FLYOUT_DATE_FORMAT[precision]);
          }
        },
        table: function(target, head, options, $flyout) {
          var total = 0;
          var filtered = 0;
          if (options.isLabel) {
            d3.selectAll(options.segments).each(function(data) {
              total += data.total;
              filtered += data.filtered;
            });
          } else {
            var data = d3.select(target[0]).datum();
            total = data.total;
            filtered = data.filtered;
          }
          var unit = '';
          if (rowDisplayUnit) {
            unit = ' ' + rowDisplayUnit.pluralize();
          }
          var rows = [
            ['Total', $.toHumaneNumber(total) + unit]
          ];
          if (showFiltered) {
            $flyout.addClass('filtered');
            rows.push(['Filtered Amount', $.toHumaneNumber(filtered) + unit]);
          }
          return rows;
        },
        onOpen: function(target, head, options, $flyout) {
          var toggleLabel = function($label) {
            $label.addClass('active');
            if (!$label.hasClass('edge-label') && $label.css('opacity') < 1) {
              $label.
                data('labelWasHidden', true).
                css({
                  opacity: 1,
                  zIndex: 10
                });
            }
          };
          var data = d3.select(target[0]).datum();
          var flyoutDate = data.date;
          if (options.isLabel) {
            toggleLabel($(options.originalTarget));
          } else if (!(options.isHighlighted || selectionActive)) {
            // Find the correct label for this date and set it to active
            d3.selectAll(element).selectAll('.labels .label').each(function (d) {
              var label = $(this);
              var labelDateStart = d.date;
              var labelDateEnd = labelDateStart + tickRange;

              if (labelDateStart <= flyoutDate && flyoutDate < labelDateEnd) {
                toggleLabel(label);
              } else if (label.data('labelWasHidden')) {
                label.
                  data('labelWasHidden', false).
                  css({
                    opacity: 0,
                    zIndex: ''
                  });
              }
            });
          }
        },
        onClose: function() {
          var label = element.find('.labels .label.active');
          label.removeClass('active');
          if (label.data('labelWasHidden')) {
            label.data('labelWasHidden', false).
              css({
                opacity: 0,
                zIndex: ''
              });
          }
          d3.selectAll(element).selectAll('g.segment.hover').classed('hover', false);
        }
      });

      var setupClickHandler = function() {
        var dragActive = false;
        var moved = false;
        var isFilteredTarget = false;
        var isClearable = false;

        chartScroll.on('mousedown', 'g.segment, .labels .label', function(event) {
          var clickedDatum = d3.select(event.currentTarget).datum();
          filterStart = clickedDatum.date;
          var duration = $(event.currentTarget).is('.label') ? tickRange : segmentDuration;
          filterEnd = moment(clickedDatum.date).add(duration);

          isFilteredTarget = $(event.currentTarget).is('.highlighted');
          isClearable = $(event.currentTarget).is('.label') ||
                        element.find('g.segment.highlighted').length === 1;
          moved = false;
          selectionActive = true;

          element.addClass('selecting');
          event.preventDefault();
        }).on('mousedown', 'g.draghandle', function(event) {
          dragActive = $(event.currentTarget).is('.start') ? 'start' : 'end';
          isClearable = true;
          moved = false;

          element.addClass('selecting');
          event.preventDefault();
        }).on('mousemove', 'g.segment, .labels .label:not(.highlighted)', function(event) {
          if (selectionActive || dragActive) {
            var duration = $(event.currentTarget).is('.label') ? tickRange : segmentDuration;
            var clickedDatum = d3.select(event.currentTarget).datum();
            var newEnd = clickedDatum.date;
            moved = true;

            if (selectionActive) {
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
          if (dragActive || selectionActive) {
            element.removeClass('selecting');
            // If clicked on a selected segment and the user hasn't moved, clear the filter.
            if ((dragActive || isFilteredTarget) && isClearable && moved === false) {
              clearFilter();
            } else {
              selectionActive = false;
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

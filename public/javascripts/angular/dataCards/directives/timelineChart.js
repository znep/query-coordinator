(function() {
  'use strict';

  function timelineChartDirective($timeout, AngularRxExtensions) {

    var flyoutDateFormat = {
      DAY: 'D MMMM YYYY',
      MONTH: 'MMMM YYYY',
      YEAR: 'YYYY',
      DECADE: 'YYYYs'
    };

    var tickDateFormat = {
      DAY: 'D MMM',
      MONTH: 'MMM \'YY',
      YEAR: 'YYYY',
      DECADE: 'YYYY[s]'
    };

    var renderTimelineChart = function(scope, element, chartData, showFiltered, dimensions, expanded, precision, rowDisplayUnit, filterChanged, filters) {

      var bottomMargin = 16;
      var xTickSize = 3;
      var filterStart;
      var filterEnd;

      if ($.isPresent(filters)) {
        filterStart = filters[0].start;
        filterEnd = filters[0].end;
      }

      var $chartWrapper = element.find('.timeline-chart-wrapper');
      var $chart = $chartWrapper.find('svg.graph');
      var $chartScroll = element.find('.chart-scroll');
      var d3Selection = d3.select($chart.get(0));
      var $labels = element.find('.labels');
      var labelSelection = d3.select($labels[0]).selectAll('.label');
      var chartWidth = dimensions.width;
      var containerWidth = 0;

      if (chartWidth <= 0) {
        return;
      }

      // Bad things happen if chartHeight is less than zero.
      var chartHeight = Math.max(dimensions.height - bottomMargin, 0);
      var verticalScale = d3.scale.linear().range([chartHeight, 0]);
      var horizontalScale = null;

      var computeChartDimensions = function(rangeInterval) {
        horizontalScale = d3.time.scale().
          domain([chartData[0].date, chartData[chartData.length - 1].date]).
          range([0, rangeInterval]);
        containerWidth = horizontalScale(horizontalScale.domain()[1]);
      };

      computeChartDimensions(chartWidth);

      $chart.css('height', chartHeight);
      $chartScroll.
        css('width', chartWidth).
        css('padding-bottom', bottomMargin);

      var totals = _.pluck(chartData, 'total');
      var maxValue = d3.max(totals);
      var minValue = d3.min(totals);
      if (_.isUndefined(maxValue) || maxValue < 0) maxValue = 0;
      if (_.isUndefined(minValue) || minValue > 0) minValue = 0;
      verticalScale.domain([maxValue, minValue]);
      var ticks = function() {
        var numberOfTicks = 3;
        var element;

        element = $('<div>').addClass('ticks').
          css('top', $chartScroll.position().top).
          css('width', chartWidth);
        var niceTicks = verticalScale.ticks(numberOfTicks);
        // This enforces 3 ticks if there are less. Might be brittle.
        if (niceTicks.length < numberOfTicks) {
          var newTicks = verticalScale.ticks(numberOfTicks + 2);
          var avg = function(arr) {
            return _.reduce(arr, function(memo, num) {
              return memo + num;
            }, 0) / arr.length;
          };
          niceTicks = [
            avg(newTicks.slice(0, 2)),
            newTicks[2],
            avg(newTicks.slice(-2))
          ];
        }

        _.each(_.uniq([0].concat(niceTicks)), function(tick) {
          element.append($('<div>').css('top', Math.floor(chartHeight - verticalScale(tick))).text($.toHumaneNumber(tick)));
        });
        element.css('height', chartHeight);
        return element;
      };

      var domain = _.map(horizontalScale.domain(), function(date) {
        return moment(date);
      });

      var labelUnit;
      if (moment(domain[0]).add('months', 2).isAfter(domain[1])) {
        labelUnit = 'day';
      } else if (moment(domain[0]).add('years', 2).isAfter(domain[1])) {
        labelUnit = 'month';
      } else if (moment(domain[0]).add('years', 20).isAfter(domain[1])) {
        labelUnit = 'year';
      } else {
        labelUnit = 'decade';
      }

      var defaultLabelData;
      var tickRange;

      if (labelUnit === 'decade') {
        defaultLabelData = horizontalScale.ticks(d3.time.year, 10);
        tickRange = moment.duration(10, 'year');
      } else {
        defaultLabelData = horizontalScale.ticks(d3.time[labelUnit], 1);
        tickRange = moment.duration(1, labelUnit);
      }

      var segmentDuration = moment.duration(1, precision);
      var segmentWidth = horizontalScale(
        moment(horizontalScale.domain()[0]).add(segmentDuration));

      var dateFormat = tickDateFormat[labelUnit.toUpperCase()];

      var specialLabelData = _.pluck(_.filter(chartData, _.property('special')), 'date');

      var labelData = _.map(_.union(defaultLabelData, specialLabelData), function(date) {
        return _.find(chartData, function(point) {
          return point.date.isSame(date, labelUnit);
        });
      });


      var updateLabels = function(labelSelection) {

        var labelDivSelection = labelSelection.data(labelData);
        var labelDivSelectionEnter = labelDivSelection.enter().
          append('div').
          classed('label', true);


        labelDivSelectionEnter.append('div').classed('text', true);

        var labelPos = function(time, label) {
          return horizontalScale(moment(time) + tickRange / 2) -
            $(label).width() / 2 - segmentWidth / 2;
        };

        labelDivSelection.
          selectAll('.text').
          text(function(d, i, j) {
            return moment(d.date).format(dateFormat);
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
            return (right > containerWidth || (i === 0 && left < 0));
          }).
          style('opacity', function(d, i) {
            var left = labelPos(d.date, this);
            var right = left + $(this).outerWidth();
            if (right > containerWidth) {
              return 0;
            }
            if (i === 0) {
              if (left < 0) {
                return 0;
              }
            } else {
              var prevDiv = element.find('.label').eq(i - 1);
              var prevLeft = labelPos(d3.select(prevDiv[0]).datum().date, this);
              if (prevDiv.css('opacity') > 0 && (prevLeft + prevDiv.outerWidth() > left)) {
                return 0;
              }
            }
            return 1;
          });

        labelDivSelection.exit().remove();
      };

      var clampHeight = function(height) {
        return height > chartHeight ? chartHeight : height;
      };

      var horizontalSegmentPosition = function(d) {
        return horizontalScale(d.date);
      };

      var updateTicks = function(tickSelection) {
        tickSelection.classed('tick-dark', minValue < 0 && maxValue > 0);
        var ticks = tickSelection.selectAll('rect.tick').
          data(labelData);

        var tickEnter = ticks.enter().append('rect').
          attr('class', 'tick').
          attr('height', xTickSize).
          attr('width', xTickSize);

        ticks.attr('x', function(d) {
          return horizontalScale(d.date) - xTickSize / 2 - segmentWidth / 2;
        }).attr('y', chartHeight - xTickSize);

        ticks.exit().remove();
      };


      element.children('.ticks').remove();
      element.prepend(ticks);


      // Used to convert an array of xy values into a path.
      // The Math.floor fixes white lines caused by subpixel rendering.
      var lineSegment = d3.svg.line().
        x(function(d, i) {
          return Math.floor(d.x);
        }).y(function(d, i) {
          return Math.floor(d.y);
        });

      // Since the timeline is rendered in sections, we have to calculate the midpoints.
      function pointsToRender(field) {
        var pointCoords = [];
        _.each(chartData, function(d, i) {
          pointCoords.push({
            x: horizontalSegmentPosition(d),
            y: chartHeight - clampHeight(verticalScale(d[field]))
          });
        });
        var midCoords = [];
        _.each(pointCoords, function(coord, i) {
          var next = pointCoords[i + 1];
          if (next) {
            midCoords.push({
              x: (coord.x + next.x) / 2,
              y: (coord.y + next.y) / 2
            });
          }
        });
        return _.compact(_.flatten(_.zip(pointCoords, midCoords)));
      }

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
            var height = chartHeight - clampHeight(verticalScale(0));
            var bottomCoords = _.map([_.max(xs), _.min(xs)], function(x) {
              return { x: x, y: height };
            });
            return lineSegment(coords.concat(bottomCoords));
          }
        };
      };

      var updateLines = function(selection) {
        var segments = selection.selectAll('g.segment').
          data(chartData).
          classed('special', function(d) {
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
            return Math.floor(horizontalScale(d.date - segmentDuration / 2));
          }).
          attr('width', Math.floor(segmentWidth)).
          attr('height', chartHeight);

        $chart.width(containerWidth);
      };

      d3Selection.select('g.container').call(updateLines);

      d3Selection.select('g.xticks').call(updateTicks);

      $chartScroll.undelegate();

      var cardMargin = parseInt(element.closest('.card').css('padding-right'), 10) || 15;
      $chartScroll.flyout({
        selector: 'g.draghandle',
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
        html: 'Drag to change filter range'
      });

      $chartScroll.flyout({
        selector: '.labels .label.special .cancel',
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
        html: 'Clear filter range'
      });

      $chartScroll.flyout({
        selector: 'g.container g.segment, .labels .label',
        parent: document.body,
        direction: 'top',
        inset: {
          vertical: -4
        },
        margin: cardMargin,
        positionOn: function($target, $head, options) {
          options.isLabel = $target.is('.label');
          options.isSpecial = $target.is('.special'); // special == 'highlighted'
          options.originalTarget = $target;
          if (options.isLabel) {
            var labelDateStart;
            var labelDateEnd;
            if (options.isSpecial) {
              labelDateStart = filterStart;
              labelDateEnd = filterEnd;
            } else {
              labelDateStart = d3.select($target[0]).datum().date;
              labelDateEnd = labelDateStart + tickRange;
            }
            options.segments = [];
            _.each(element.find('g.segment'), function(segment) {
              var date = d3.select(segment).datum().date;
              if (labelDateStart <= date && date < labelDateEnd) {
                options.segments.push(segment);
                d3.select(segment).classed('hover', true);
              }
            });
            var center = Math.floor(options.segments.length / 2);

            return $(options.segments[center]).find('path.fill.unfiltered');
          } else {
            options.datum = d3.select($target[0]).datum();
            var targetDate = options.datum.date;
            var segmentIndex = _.indexOf(_.pluck(chartData, 'date'), targetDate);

            return $chartScroll.find('path.fill.unfiltered').eq(segmentIndex);
          }
        },
        title: function($target, $head, options) {
          if (options.isLabel) {
            return options.originalTarget.find('.text').text();
          } else {
            var targetDate = d3.select($target[0]).datum().date;

            return moment(targetDate).format(flyoutDateFormat[precision]);
          }
        },
        table: function($target, $head, options, $flyout) {
          var total = 0;
          var filtered = 0;
          if (options.isLabel) {
            _.each(options.segments, function(segment) {
              var data = d3.select(segment).datum();
              total += data.total;
              filtered += data.filtered;
            });
          } else {
            var data = d3.select($target[0]).datum();
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
        onOpen: function($target, $head, options, $flyout) {
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
          var data = d3.select($target[0]).datum();
          var flyoutDate = data.date;
          if (options.isLabel) {
            toggleLabel($(options.originalTarget));
          } else if (!options.isSpecial) {
            _.each(element.find('.labels .label'), function(label) {
              var $label = $(label);
              var labelDateStart = d3.select(label).datum().date;
              var labelDateEnd = labelDateStart + tickRange;
              var left;
              if (labelDateStart <= flyoutDate && flyoutDate < labelDateEnd) {
                toggleLabel($label);
              } else if ($label.data('labelWasHidden')) {
                $label.
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
          var $label = element.find('.labels .label.active');
          $label.removeClass('active');
          if ($label.data('labelWasHidden')) {
            $label.data('labelWasHidden', false).
              css({
                opacity: 0,
                zIndex: ''
              });
          }
          _.each(element.find('g.segment.hover'), function(segment) {
            d3.select(segment).classed('hover', false);
          });
        }
      });

      var updateSpecialLabel = function() {
        labelSelection.call(updateLabels);

        var specialLabel = element.find('.labels .label.special');
        if (filterStart && filterEnd) {
          if (_.isEmpty(specialLabel)) {
            specialLabel = $('<div class="label special">' +
              '<div class="text"></div>' +
              '<div class="cancel"> ×</div>' +
              '</div>');
            element.find('.labels').append(specialLabel);
          }

          var range = _.sortBy([filterStart, filterEnd]);
          var rangeStart = range[0];
          var rangeEnd = range[1];

          d3.select(specialLabel[0]).datum({date: rangeStart});

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
            format = tickDateFormat[precision];
            text = rangeStart.format(format);
          } else if (isStartOfLabelSegment && isOneLabelSegmentWide) {
            format = tickDateFormat[labelUnit.toUpperCase()];
            text = rangeStart.format(format);
            // Show as a range
          } else {
            format = tickDateFormat[precision];
            text = rangeStart.format(format) + ' - ' +
              rangeEnd.clone().subtract(1, precision).format(format)
          }
          specialLabel.find('.text').text(text);

          var centeringLabelLeft = Math.floor(
              (horizontalScale(rangeStart) + horizontalScale(rangeEnd)) / 2 -
              specialLabel.outerWidth() / 2
          );
          var maxLeft = chartWidth - specialLabel.outerWidth();
          if (centeringLabelLeft < 0) {
            centeringLabelLeft = 0;
          } else if (centeringLabelLeft > maxLeft) {
            centeringLabelLeft = maxLeft;
          }
          specialLabel.css('left', centeringLabelLeft);
        } else {
          specialLabel.remove();
        }
      };

      var updateDragHandles = function() {
        var segments = d3Selection.selectAll('g.draghandle').
          data(_.compact(_.sortBy([filterStart, filterEnd])));

        var segmentEnter = segments.enter().append('g').
          attr('class', function(d, i) {
            return 'draghandle ' + (i === 0 ? 'start' : 'end');
          });
        segmentEnter.append('line').attr('y1', 0);
        segmentEnter.append('rect').attr('x', -2).attr('width', 5);
        var handlePath = d3.svg.line().
          x(function(d) {
            return d[0]
          }).
          y(function(d) {
            return d[1]
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
          return 'translate({0}, 0)'.format(Math.floor(horizontalScale(d - segmentDuration / 2)));
        });
        segments.selectAll('line').attr('y2', chartHeight);
        segments.selectAll('rect').attr('height', chartHeight);

        segments.exit().remove();

        updateSpecialLabel();
      };

      updateDragHandles();

      var clearFilter = function() {
        filterStart = null;
        filterEnd = null;
        scope.$apply(function() {
          scope.$emit('timeline-chart:filter-cleared');
        });
        updateDragHandles();
      };

      var setupClickHandler = function() {
        var selectionActive = false;
        var dragActive = false;
        var moved = false;
        var isFilteredTarget = false;
        var isClearable = false;

        $chartScroll.delegate('g.segment, .labels .label', 'mousedown', function(event) {
          var clickedDatum = d3.select(event.currentTarget).datum();
          filterStart = clickedDatum.date;
          var duration = $(event.currentTarget).is('.label') ? tickRange : segmentDuration;
          filterEnd = moment(clickedDatum.date).add(duration);

          isFilteredTarget = $(event.currentTarget).is('.special');
          isClearable = $(event.currentTarget).is('.label') ||
            element.find('g.segment.special').length === 1;
          moved = false;
          selectionActive = true;

          element.addClass('selecting');
          event.preventDefault();
        }).delegate('g.draghandle', 'mousedown', function(event) {
          dragActive = $(event.currentTarget).is('.start') ? 'start' : 'end';
          isClearable = true;
          moved = false;

          element.addClass('selecting');
          event.preventDefault();
        }).delegate('g.segment, .labels .label:not(.special)', 'mousemove', function(event) {
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
            var domain = horizontalScale.domain();
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
              scope.$apply(function() {
                scope.$emit('timeline-chart:filter-changed', sorted);
              });
            }
            d3Selection.select('g.container').call(updateLines);
          }
        };
        $(window).on('mouseup.TimelineChart', scope.mouseUpHandler);
      };
      setupClickHandler();
    };

    return {
      template: '<div class="chart-scroll">' +
        '<div class="timeline-chart-wrapper" ng-class="{filtered: showFiltered}">' +
        '<svg class="graph">' +
        '<g class="container"></g>' +
        '<g class="xticks"></g>' +
        '</svg>' +
        '</div>' +
        '<div class="labels"></div>' +
        '</div>',
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

        if (element.closest('.card-visualization').length === 0) {
          throw new Error('[timelineChart] timeline-chart is missing a .card-visualization (grand)parent.');
        }

        var lastFilter = false;
        var lastData = false;

        Rx.Observable.subscribeLatest(
          element.closest('.card-visualization').observeDimensions(),
          scope.observe('chartData'),
          scope.observe('showFiltered'),
          scope.observe('expanded'),
          scope.observe('precision'),
          scope.observe('rowDisplayUnit'),
          scope.observe('filters'),
          function(cardVisualizationDimensions, chartData, showFiltered, expanded, precision, rowDisplayUnit, filters) {
            if (!chartData || !precision) return;
            var timestamp = new Date().getTime();
            scope.$emit('render:start', 'timelineChart_{0}'.format(scope.$id), timestamp);
            renderTimelineChart(
              scope,
              element,
              chartData,
              showFiltered,
              cardVisualizationDimensions,
              expanded,
              precision,
              rowDisplayUnit,
                lastData && ( lastFilter != showFiltered || lastData != chartData ),
              filters
            );
            lastFilter = showFiltered;
            lastData = chartData;
            $timeout(function() {
              scope.$emit('render:complete', 'timelineChart_{0}'.format(scope.$id), timestamp);
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

  }

  angular.
    module('socrataCommon.directives').
    directive('timelineChart', timelineChartDirective);
})();

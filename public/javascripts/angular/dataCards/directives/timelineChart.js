angular.module('socrataCommon.directives').directive('timelineChart', function($parse, AngularRxExtensions) {
  "use strict";

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

  var renderTimelineChart = function(element, chartData, showFiltered, dimensions, expanded, precision, rowDisplayUnit, filterChanged) {

    var bottomMargin = 16;
    var xTickSize = 3;

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

    var chartHeight = dimensions.height - bottomMargin;
    var verticalScale = d3.scale.linear().range([chartHeight, 0]);
    var horizontalScale = null;

    var computeChartDimensions = function(rangeInterval) {
      horizontalScale = d3.time.scale().
        domain([chartData[0].date, chartData[chartData.length-1].date]).
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
        element.append($('<div>').css('top', Math.floor(chartHeight - verticalScale(tick))).text($.toHumaneNumber(tick, 1)));
      });
      element.css('height', chartHeight);
      return element;
    };

    var domain = _.map(horizontalScale.domain(), function(date) {
      return moment(date);
    });

    if (moment(domain[0]).add('months', 2).isAfter(domain[1])) {
      var labelUnit = 'day';
    } else if (moment(domain[0]).add('years', 2).isAfter(domain[1])) {
      var labelUnit = 'month';
    } else if (moment(domain[0]).add('years', 20).isAfter(domain[1])) {
      var labelUnit = 'year';
    } else {
      var labelUnit = 'decade';
    }

    if (labelUnit === 'decade') {
      var defaultLabelData = horizontalScale.ticks(d3.time.year, 10);
      var tickRange = moment.duration(10, 'year');
    } else {
      var defaultLabelData = horizontalScale.ticks(d3.time[labelUnit], 1);
      var tickRange = moment.duration(1, labelUnit);
    }

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
        return (horizontalScale(moment(time) + tickRange/2) - $(label).width()/2);
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
          return specialLabelData.length > 0 && !d.special;
        }).
        style('display', function(d, i) {
          var right = labelPos(d.date, this) + $(this).width();
          if (right > containerWidth) {
            return 'none';
          }
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
          return horizontalScale(d.date) - xTickSize/2;
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
        var next = pointCoords[i+1];
        if (next) {
          midCoords.push({
            x: (coord.x + next.x)/2,
            y: (coord.y + next.y)/2
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
        if (secondPoints && points !== secondPoints) {
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
      var segmentDuration = moment.duration(1, precision);
      var segmentWidth = horizontalScale(
        moment(horizontalScale.domain()[0]).add(segmentDuration));
      var segments = selection.selectAll("g.segment").
        data(chartData);
      var segmentEnter = segments.enter().append("g").
        attr("class", "segment");

      segmentEnter.append("path").
        attr("class", "fill unfiltered");
      segmentEnter.append("path").
        attr("class", "fill filtered");

      segmentEnter.append("path").
        attr("class", "line unfiltered");
      segmentEnter.append("path").
        attr("class", "line filtered");

      segmentEnter.append("rect").
        attr("class", "spacer").
        attr("y", 0);


      var transition = function(select) {
        if (filterChanged) {
          return select.transition();
        } else {
          return select;
        }
      };

      var totalPoints = pointsToRender('total');
      if (showFiltered) {
        var filteredPoints = pointsToRender('filtered');
      } else {
        var filteredPoints = totalPoints;
      }

      transition(selection.selectAll("g.segment path.line.filtered")).
        attr("d", dLineSegment(filteredPoints));

      transition(selection.selectAll("g.segment path.line.unfiltered")).
        attr("d", dLineSegment(totalPoints));

      transition(selection.selectAll("g.segment path.fill.filtered")).
        attr("d", dFillSegment(filteredPoints));

      transition(selection.selectAll("g.segment path.fill.unfiltered")).
        attr("d", dFillSegment(filteredPoints, totalPoints));

      transition(selection.selectAll("g.segment rect.spacer")).
        attr("x", function(d, i) {
          return Math.floor(horizontalScale(d.date - segmentDuration / 2));
        }).
        attr("width", function(d, i) {
          return Math.floor(segmentWidth);
        }).
        attr("height", function() {
          return chartHeight;
        });

      $chart.width(containerWidth);
    };

    d3Selection.select('g.container').call(updateLines);

    d3Selection.select('g.xticks').call(updateTicks);

    labelSelection.call(updateLabels);

    $chartScroll.flyout({
      selector: 'g.container g.segment, .labels .label',
      parent: document.body,
      direction: 'top',
      inset: {
        vertical: -4
      },
      positionOn: function($target, $head, options) {
        var targetDate = d3.select($target[0]).datum().date;
        var segmentIndex = _.indexOf(_.pluck(chartData, 'date'), targetDate);
        return $chartScroll.find('path.fill.unfiltered').eq(segmentIndex);
      },
      title: function($target, $head, options) {
        var targetDate = d3.select($target[0]).datum().date;
        return moment(targetDate).format(flyoutDateFormat[precision]);
      },
      table: function($target, $head, options, $flyout) {
        var data = d3.select($target[0]).datum();
        var unit = '';
        if (rowDisplayUnit) {
          unit = ' ' + rowDisplayUnit.pluralize();
        }
        var rows = [["Total", $.toHumaneNumber(data.total, 1) + unit]];
        if (showFiltered) {
          $flyout.addClass("filtered");
          rows.push(["Filtered Amount", $.toHumaneNumber(data.filtered, 1) + unit]);
        }
        return rows;
      },
      onOpen: function($target, $head, options, $flyout) {
        var data = d3.select($target[0]).datum();
        var flyoutDate = data.date;
        _.each(element.find('.labels .label'), function(label) {
          var labelDateStart = d3.select(label).datum().date;
          var labelDateEnd = labelDateStart + tickRange;
          if (labelDateStart <= flyoutDate && flyoutDate < labelDateEnd) {
            $(label).addClass('active');
          }
        });
      },
      onClose: function() {
        element.find('.labels .label.active').removeClass('active');
      }
    });
  };

  return {
    template:
      '<div class="chart-scroll">' +
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
      rowDisplayUnit: '='
    },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      if (element.closest('.card-visualization').length === 0) {
        throw new Error("[timelineChart] timeline-chart is missing a .card-visualization (grand)parent.");
      }

      $(element.delegate('g.segment', 'click', function(event) {
        var clickedDatum = d3.select(event.currentTarget).datum();
        scope.$apply(function() {
          scope.$emit('timeline-chart:datum-clicked', clickedDatum);
        });
      }));

      var lastFilter = false;
      var lastData = false;

      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions(),
        scope.observe('chartData'),
        scope.observe('showFiltered'),
        scope.observe('expanded'),
        scope.observe('precision'),
        scope.observe('rowDisplayUnit'),
        function(cardVisualizationDimensions, chartData, showFiltered, expanded, precision, rowDisplayUnit) {
          if (!chartData || !precision) return;
          renderTimelineChart(
            element,
            chartData,
            showFiltered,
            cardVisualizationDimensions,
            expanded,
            precision,
            rowDisplayUnit,
            lastData && ( lastFilter != showFiltered || lastData != chartData )
          );
          lastFilter = showFiltered;
          lastData = chartData;
        }
      );
    }
  };

});

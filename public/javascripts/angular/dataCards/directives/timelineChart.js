angular.module('socrataCommon.directives').directive('timelineChart', function($parse, AngularRxExtensions) {

  var flyoutDateFormat = {
    DAY: 'D MMMM \'YY',
    MONTH: 'MMMM \'YY',
    YEAR: 'YYYY'
  };

  var tickDateFormat = {
    DAY: 'D MMM',
    MONTH: 'MMM \'YY',
    YEAR: 'YYYY',
    DECADE: 'YYYY[s]'
  };

  var renderTimelineChart = function(element, chartData, showFiltered, dimensions, expanded, precision, filterChanged) {

    var bottomMargin = 16;
    var xTickSize = 3;

    var $chartWrapper = element.find('.timeline-chart-wrapper');
    var $chart = $chartWrapper.find('svg.graph');
    var $chartScroll = element.find('.chart-scroll');
    var d3Selection = d3.select($chart.get(0));
    var $labels = element.find('.labels');
    var labelSelection = d3.select($labels[0]).selectAll('.label');
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
        function avg(arr) {
          return _.reduce(arr, function(memo, num){
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
      var defaultLabelData = horizontalScale.ticks(d3.time.day, 1);
      var tickRange = moment.duration(1, 'day');
      var dateFormat = tickDateFormat.DAY;
    } else if (moment(domain[0]).add('years', 2).isAfter(domain[1])) {
      var defaultLabelData = horizontalScale.ticks(d3.time.month, 1);
      var tickRange = moment.duration(1, 'month');
      var dateFormat = tickDateFormat.MONTH;
    } else if (moment(domain[0]).add('years', 20).isAfter(domain[1])) {
      var defaultLabelData = horizontalScale.ticks(d3.time.year, 1);
      var tickRange = moment.duration(1, 'year');
      var dateFormat = tickDateFormat.YEAR;
    } else {
      var defaultLabelData = horizontalScale.ticks(d3.time.year, 10);
      var tickRange = moment.duration(10, 'years');
      var dateFormat = tickDateFormat.DECADE;
    }

    var specialLabelData = _.pluck(_.filter(chartData, _.property('special')), 'date');

    var labelData = _.union(defaultLabelData, specialLabelData);


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
            return moment(d).format(dateFormat);
          });
      labelDivSelection.
        style('left', function(d, i, j) {
            return labelPos(d, this) + 'px';
        }).
        classed('dim', function(d, i) {
          return specialLabelData.length > 0 && !d.special;
        }).
        style('display', function(d, i) {
          var right = labelPos(d, this) + $(this).width();
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
        data(labelData)

      var tickEnter = ticks.enter().append('rect').
         attr('class', 'tick').
         attr('height', xTickSize).
         attr('width', xTickSize);

      ticks.attr('x', function(d) {
          return horizontalScale(d) - xTickSize/2;
        }).attr('y', function(d) {
          return chartHeight - xTickSize;
        });

      ticks.exit().remove();
    };


    element.children('.ticks').remove();
    element.prepend(ticks);

    // The Math.floor fixes white lines caused by subpixel rendering.
    var lineSegment = d3.svg.line().
      x(function(d, i) {
        return Math.floor(d.x);
      }).y(function(d, i) {
        return Math.floor(d.y);
      });

    var lineSegmentCoords = function(chartDataIndex, field) {
      var coords = [];
      function avg(a, b) {
        return { x: (a.x + b.x)/2, y: (a.y + b.y)/2 };
      };

      if (chartDataIndex == 0) {
        var data = [null].concat(chartData.slice(0, 2));
      } else {
        var data = chartData.slice(chartDataIndex - 1, chartDataIndex + 2);
      }
      _.each(data, function(c, i) {
        if (c) {
          if (!showFiltered) {
            var val = c['total'];
          } else {
            var val = c[field];
          }
          var pos = {
            x: horizontalSegmentPosition(c),
            y: chartHeight - clampHeight(verticalScale(val))
          }
          if (i == 0 || i == 1) {
            coords.push(pos);
          }
          if (i == 1 && coords.length == 2) {
            coords[0] = avg(coords[0], pos)
          }
          if (i == 2) {
            coords.push(avg(coords.slice(-1)[0], pos));
          }
        }
      });

      return coords;
    };
    var dLineSegment = function(field) {
      return function(d, i) {
        return lineSegment(lineSegmentCoords(i, field));
      };
    };
    var dFillSegment = function(field) {
      return function(d, i) {
        var coords = lineSegmentCoords(i, field);
        if (field == 'total') {
          var filtered = lineSegmentCoords(i, 'filtered');
          return lineSegment(coords.concat(filtered.reverse()))
        } else {
          var xs = _.pluck(coords, 'x');
          var bottomCoords = _.map([_.max(xs), _.min(xs)], function(x) {
            return { x: x, y: chartHeight - clampHeight(verticalScale(0)) };
          });
          return lineSegment(coords.concat(bottomCoords));
        }
      }
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

      transition(selection.selectAll("g.segment path.line.filtered")).
        attr("d", dLineSegment('filtered'));

      transition(selection.selectAll("g.segment path.line.unfiltered")).
        attr("d", dLineSegment('total'));

      transition(selection.selectAll("g.segment path.fill.filtered")).
        attr("d", dFillSegment('filtered'));

      transition(selection.selectAll("g.segment path.fill.unfiltered")).
        attr("d", dFillSegment('total'));

      transition(selection.selectAll("g.segment rect.spacer")).
        attr("x", function(d, i) {
          return horizontalScale(d.date - segmentDuration / 2);
        }).
        attr("width", function(d, i) {
          return segmentWidth;
        }).
        attr("height", function() {
          return chartHeight;
        })

      $chart.width(containerWidth);
    };

    d3Selection.select('g.container').call(updateLines);

    d3Selection.select('g.xticks').call(updateTicks);

    labelSelection.call(updateLabels);

    element.find('g.container').flyout({
      selector: 'g.segment',
      parent: document.body,
      direction: 'top',
      inset: {
        vertical: -4
      },
      title: function($target, $head, options) {
        $target[0] = $target.find("path.fill.unfiltered")[0];
        return moment($target[0].__data__.date).format(flyoutDateFormat[precision]);
      },
      table: function($target, $head, options, $flyout) {
        var data = $target.context.__data__;
        rows = [["Total", $.toHumaneNumber(data.total, 1)]];
        if (showFiltered) {
          $flyout.addClass("filtered");
          rows.push(["Filtered Amount", $.toHumaneNumber(data.filtered, 1)]);
        }
        return rows;
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
      precision: '='
    },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      if (element.closest('.card-visualization').length == 0) {
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
        function(cardVisualizationDimensions, chartData, showFiltered, expanded, precision) {
          if (!chartData || !precision) return;
          renderTimelineChart(
            element,
            chartData,
            showFiltered,
            cardVisualizationDimensions,
            expanded,
            precision,
            lastData && ( lastFilter != showFiltered || lastData != chartData )
          );
          lastFilter = showFiltered;
          lastData = chartData;
        }
      )
    }
  }

});

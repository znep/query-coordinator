angular.module('socrataCommon.directives').directive('columnChart', function($parse, AngularRxExtensions) {

  var renderColumnChart = function(element, chartData, showFiltered, dimensions, expanded) {  

    if (!dimensions.width || !dimensions.height) {
      throw new Error("[columnChart] column-chart is missing a .card-visualization (grand)parent.");
    }

    var numberOfBars = chartData.length;

    var barPadding = 0.25;
    var topMargin = 0; // Set to zero so .card-text could control padding b/t text & visualization
    var bottomMargin = 132;
    var tipHeight = 10;
    var tipWidth = 10;
    var tooltipWidth = 123;
    var tooltipYOffset = 9999; // invisible (max) height of tooltip above tallest bar; hack to make tooltip appear above chart/card-text
    var horizontalScrollbarHeight = 15; // used to keep horizontal scrollbar within .card-visualization upon expand
    var numberOfDefaultLabels = expanded ? chartData.length : 3;
    var undefinedPlaceholder = '(Undefined)';

    var $chart = element.find('.column-chart-wrapper');
    var $chartScroll = element.find('.chart-scroll');
    var d3Selection = d3.select($chart.get(0));
    var barGroupSelection = d3Selection.selectAll('.bar-group').data(chartData, _.property('name'));
    var hoverTriggerSelection = d3Selection.selectAll('.bar.hover-trigger').data(chartData, _.property('name'));
    var labelSelection = d3.select(element.find('.labels')[0]).selectAll('.label');
    var chartWidth = dimensions.width;
    var chartTruncated = false;
    var truncationMarker = element.find('.truncation-marker');
    var truncationMarkerWidth = truncationMarker.width();

    if (chartWidth <= 0) {
      return;
    }

    // Compute chart margins
    if (expanded) {
      var maxLength = _.max(chartData.map(function(item) {
        // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
        return $.capitalizeWithDefault(item.name, undefinedPlaceholder).visualLength('0.5rem');
      }));
      bottomMargin = (maxLength + $.relativeToPx('1.0rem')) / Math.sqrt(2);
    } else {
      bottomMargin = $.relativeToPx(numberOfDefaultLabels + 1 + 'rem');
      // do not compensate for chart scrollbar if not expanded (scrollbar would not exist)
      horizontalScrollbarHeight = 0;
    }

    var chartHeight = dimensions.height - topMargin - bottomMargin - horizontalScrollbarHeight;
    var verticalScale = d3.scale.linear().range([chartHeight, 0]);
    var verticalOffset = topMargin + chartHeight;
    var horizontalScale = null;
    var rightOffset = 0;
    var rangeBand = 0;
    var leftOffset = null;

    var computeChartDimensions = function() {
      horizontalScale = d3.scale.ordinal().rangeRoundBands(
        [0, chartWidth], barPadding).domain(_.pluck(chartData, 'name')
      );
      rightOffset = horizontalScale.range()[numberOfBars - 1];
      rangeBand = horizontalScale.rangeBand();
    };

    computeChartDimensions();

    // If the bar width is too narrow, compute the acceptable minimum width and rescale the chart
    if (rangeBand < 8) {
      chartWidth = Math.floor(8 * numberOfBars * 1.5);
      computeChartDimensions();
      chartTruncated = true;
      chartWidth = Math.floor(dimensions.width);
    }

    var rangeExtent = horizontalScale.rangeExtent();
    var chartLeftEdge = rangeExtent[0];
    var chartRightEdge = rangeExtent[1];
    var rangeMagnitude = chartRightEdge - chartLeftEdge;


    leftOffset = horizontalScale.range()[0];

    $chart.css('height', chartHeight + topMargin + 1).
      css('width', chartWidth);
    $chartScroll.
      css('padding-top', 0).
      css('padding-bottom', bottomMargin).
      css('top', 'initial');

    var maxValue = _.isEmpty(chartData) ? 0 : chartData[0].total;
    verticalScale.domain([maxValue, 0]);

    var ticks = function() {
      var numberOfTicks = 3;
      var element;

      element = $('<div>').addClass('ticks')
        .css('top', $chartScroll.position().top + topMargin)
        .css('width', chartWidth);
      _.each(_.uniq([0].concat(verticalScale.ticks(numberOfTicks))), function(tick) {
        element.append($('<div>').css('top', chartHeight - verticalScale(tick)).text($.toHumaneNumber(tick, 1)));
      });
      element.css('height', chartHeight + topMargin);
      return element;
    };

    var enterTooltip = function(datum, i) {
      var content = $('<div class="datum">');

      content.append($('<div class="name">'));
      content.append($('<div class="value-unfiltered">').
        append($('<div class="value">')).
        append($('<div class="label">Total</div>'))
      );
      content.append($('<div class="value-filtered">').
        append($('<div class="value">')).
        append($('<div class="label">Current filter</div>'))
      );
      var $tooltip = $('<div class="tooltip">');
      var $tip = $('<span>');

      $tooltip.append(content);

      $tip.addClass('tip');
      $tooltip.append($tip);

      return $tooltip.get(0);
    };

    var updateTooltip = function(selection) {
      var tipOffset = rangeBand / 2 - tipWidth / 2;

      selection.
        classed('filtered', showFiltered).
        each(function(d) {
          var $tooltip = $(this);
          var $tip = $tooltip.find('.tip');
          var rightEdge = 0;
          if (showFiltered) {
            $tooltip.css('bottom', verticalScale(d.filtered) + tipHeight);
            rightEdge = horizontalScale(d.name) + tooltipWidth - chartWidth;
          } else {
            $tooltip.css('bottom', verticalScale(d.total) + tipHeight);
            rightEdge = horizontalScale(d.name) + tooltipWidth - chartWidth;
          }

          if (rightEdge > 0) {
            $tooltip.css('left', -1 * rightEdge);
            $tip.css('left', tipOffset + rightEdge);
          }
          else {
            $tip.css('left', Math.max(0, tipOffset));
          }

          $tooltip.find('.name').text($.capitalizeWithDefault(d.name, undefinedPlaceholder));
          $tooltip.find('.value-unfiltered .value').text($.commaify(d.total));
          $tooltip.find('.value-filtered .value').text($.commaify(d.filtered));
        });
    };

    var updateLabels = function(labelSelection) {
      // Labels come in two sets of column names:
      // * Default labels. When the chart is unexpanded, this consists of the
      //   first three column names in the data.
      //   When the chart is expanded, this contains all the column names in the data.
      // * Special labels. Contains the names of columns which are special.
      //
      // The displayed set of labels is the union of these two sets.

      var defaultLabelData = _.first(chartData, numberOfDefaultLabels);

      var specialLabelData = _.filter(chartData, _.property('special'));
      if (specialLabelData.length > 1) { throw new Error('Multiple special labels not supported yet in column chart'); }

      var labelData = _.union(defaultLabelData, specialLabelData);

      function isOnlyInSpecial(datum, index) {
        return datum.special && index >= numberOfDefaultLabels;
      }

      var labelOrientationsByIndex = [];
      function preComputeLabelOrientation(datum, index) {
        var leftHanded = false;

        if (!expanded) {
          var widthOfText = $(this).find('.text').width();
          var proposedLeftOfText = horizontalScale(datum.name);

          var spaceAvailableOnRight = rangeMagnitude - (proposedLeftOfText - chartLeftEdge);
          var spaceAvailableOnLeft = proposedLeftOfText - chartLeftEdge;

          var spaceRemainingOnRight = spaceAvailableOnRight - widthOfText;

          leftHanded = spaceRemainingOnRight <= 0 && spaceAvailableOnLeft > spaceAvailableOnRight;
        }

        labelOrientationsByIndex[index] = leftHanded;

      }
      function labelOrientationLeft(datum, index) {
        return labelOrientationsByIndex[index];
      }
      function labelOrientationRight(datum, index) {
        return !labelOrientationsByIndex[index];
      }

      var centering = leftOffset - rangeBand / 2;
      var verticalPositionOfSpecialLabelRem = 2;

      var labelDivSelection = labelSelection.data(labelData, _.property('name'));
      var labelDivSelectionEnter = labelDivSelection.enter().
        append('div').
          classed('label', true);

      labelDivSelectionEnter.append('div').classed('text', true);
      labelDivSelectionEnter.append('div').classed('callout', true);

      labelDivSelection.
        selectAll('.text').
          style('top', function(d, i, j) {
            if (isOnlyInSpecial(d, j)) {
              return verticalPositionOfSpecialLabelRem - 0.5 + 'rem';
            } else {
              return defaultLabelData.length - 0.5 - Math.min(j, numberOfDefaultLabels - 1)+ 'rem';
            }
          }).
          text(function(d, i, j) {
            return $.capitalizeWithDefault(d.name, undefinedPlaceholder);
          });

      // These widths relate to the visualLength() method call in the maxLength calculation above.
      if (expanded) {
        labelDivSelection.
          selectAll('.text').style('width', function(d, i, j) {
            if ($('.description-expanded-wrapper').height() > 20) {
              return '10.5rem';
            } else {
              return '8.5rem';
            }
          });
      }

      labelDivSelection.
        selectAll('.callout').
          style('height', function(d, i, j) {
            if (expanded) {
              return ''; // Expanded charts have auto-height labels.
            } else {
              if (isOnlyInSpecial(d, j)) {
                return verticalPositionOfSpecialLabelRem + 'rem';
              } else {
                return (defaultLabelData.length - j) + 'rem';
              }
            }
          });

      // To properly compute text sizes, temporarily remove label handedness, then call computeLabelOrientation.
      labelDivSelection.
        classed('orientation-left', false).
        classed('orientation-right', false).
        each(preComputeLabelOrientation);

      labelDivSelection.
        classed('orientation-left', labelOrientationLeft).
        classed('orientation-right', labelOrientationRight).
        style('left', function(d, i) {
          if ($(this).hasClass('orientation-left')) {
            return '0';
          } else {
            return (horizontalScale(d.name) - centering - 1) + 'px';
          }
        }).
        style('right', function(d, i) {
          if ($(this).hasClass('orientation-left')) {
            return (chartRightEdge - (horizontalScale(d.name) - centering - 1)) + 'px';
          } else {
            return '0';
          }
        }).
        classed('dim', function(d, i) {
          return specialLabelData.length > 0 && !d.special;
        });

      labelDivSelection.exit().remove();
    };

    var clampHeight = function(height) {
      return height > chartHeight ? chartHeight : height;
    };

    var horizontalBarPosition = function(d) {
      return horizontalScale(d.name) - leftOffset;
    };

    var updateBars = function(selection) {
      // Bars are composed of a bar group and two bars (total and filtered).

      // ENTER PROCESSING

      // Create bar groups.
      selection.enter().
        append('div').
          classed('bar-group', true);

      // Create 2 bars, total and filtered. Filtered bars default to 0 height if there is no data for them.
      var bars = selection.selectAll('.bar').data(function(d) {
        return [d.total, d.filtered || 0];
      });

      // Bars are just a div.
      bars.enter().
        append('div');

      // UPDATE PROCESSING
      // Update the position of the groups.
      selection.
        style('left', function(d) { return horizontalBarPosition(d) + 'px'; }).
        classed('special', function(d) { return d.special; }).
        classed('active', function(d) { return horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; });

      // Update the position of the individual bars.
      bars.
        style('width', rangeBand + 'px').
        style('height', function(d) { return clampHeight(verticalScale(d)) + 'px'; }).
        style('top', function(d) { return verticalOffset - clampHeight(verticalScale(d)) + 1 + 'px'; }).
        attr('class', function(d, i) {
          return 'bar ' + (i==0 ? 'unfiltered' : 'filtered');
        });

      // EXIT PROCESSING
      bars.exit().remove();
      selection.exit().remove();
    };

    var mouseoverHoverTriggerBars = function(selection) {
      selection.style('top', topMargin + tooltipYOffset + 'px');
      $chartScroll.
        css('padding-top', tooltipYOffset).
        css('top', -tooltipYOffset);
      element.find('.ticks').css('top', $chartScroll.position().top + topMargin + tooltipYOffset);
    };

    var updateHoverTriggerBars = function(selection) {
      // Hover trigger bars overlay the entire vertical space of the chart, and contain a tooltip.

      // ENTER PROCESSING
      // Hover trigger bars are just a div.
      selection.enter().
        append('div').
          attr('class', 'bar hover-trigger');

      // Create the tooltips.
      var tooltips = selection.selectAll('.tooltip').data(function(d) { return [d]; });
      tooltips.
        enter().
          append(enterTooltip);

      // UPDATE PROCESSING
      selection.
        style('width', rangeBand + 'px').
        style('left', function(d) { return horizontalScale(d.name) - leftOffset + 'px'; }).
        style('top', function() { return topMargin + 'px'; }).
        style('height', function() { return chartHeight + 'px'; }).
        classed('active', function(d) { return horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; }).
        on('mouseover', function() {
          // fix tooltip with magical padding
          mouseoverHoverTriggerBars(selection);
        }).
        on('mouseout', function() {
          // remove magical padding tooltip fix
          selection.style('top', topMargin + 'px');
          $chartScroll.
            css('padding-top', 0).
            css('top', 'initial');
          element.find('.ticks').css('top', $chartScroll.position().top + topMargin);
        });

      tooltips.call(updateTooltip);

      // EXIT PROCESSING
      selection.exit().remove();
    };

    element.children('.ticks').remove();
    element.prepend(ticks);

    barGroupSelection.call(updateBars);
    hoverTriggerSelection.call(updateHoverTriggerBars);
    labelSelection.call(updateLabels);

    if (chartTruncated) {
      truncationMarker.css('display', 'block');
    } else {
      truncationMarker.css('display', 'none');
    }
    // if re-render was caused by clicking on bar,
    // (i.e., when render is called while hovering over .column-chart-wrapper)
    // then keep tooltip visible
    if (element.find('.column-chart-wrapper:hover').length > 0) {
      hoverTriggerSelection.call(mouseoverHoverTriggerBars);
    }
  };

  return {
    template:
      '<div class="chart-scroll">' +
        '<div class="column-chart-wrapper" ng-class="{filtered: showFiltered}">' +
          '<div class="truncation-marker">&raquo;</div>' +
          '<div class="tooltip"><div>Click to expand</div><span class="tip"></span></div>' +
        '</div>' +
        '<div class="labels"></div>' +
      '</div>',
    restrict: 'A',
    scope: {
      chartData: '=',
      showFiltered: '=',
      expanded: '='
    },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      $(element.parent().delegate('.truncation-marker', 'click', function(event) {
        scope.$apply(function() {
          scope.$emit('column-chart:truncation-marker-clicked', event);
        });
      }));

      $(element.parent().delegate('.bar.hover-trigger, .labels .label', 'click', function(event) {
        var clickedDatum = d3.select(event.currentTarget).datum();
        scope.$apply(function() {
          scope.$emit('column-chart:datum-clicked', clickedDatum);
        });
      }));

      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions(),
        scope.observe('chartData'),
        scope.observe('showFiltered'),
        scope.observe('expanded'),
        function(cardVisualizationDimensions, chartData, showFiltered, expanded) {
          if (!chartData) return;
          renderColumnChart(
            element,
            chartData,
            showFiltered,
            cardVisualizationDimensions,
            expanded
          );
        }
      )
    }
  }

});

angular.module('socrataCommon.directives').directive('columnChart', function($parse, $timeout, AngularRxExtensions, FlyoutService) {
  'use strict';

  var renderColumnChart = function(element, chartData, showFiltered, dimensions, expanded, rowDisplayUnit) {

    var numberOfBars = chartData.length;

    var barPadding = 0.25;
    var topMargin = 0; // Set to zero so .card-text could control padding b/t text & visualization
    var bottomMargin; // Calculated based on label text length
    var tipHeight = 10;
    var horizontalScrollbarHeight = 15; // used to keep horizontal scrollbar within .card-visualization upon expand
    var numberOfDefaultLabels = expanded ? chartData.length : 3;
    var undefinedPlaceholder = '(No value)';
    var maximumBottomMargin = 140;
    var minSmallCardBarWidth = 8;
    var maxSmallCardBarWidth = 30;
    var minExpandedCardBarWidth = 15;
    var maxExpandedCardBarWidth = 40;

    var $chart = element.find('.column-chart-wrapper');
    var $chartScroll = element.find('.chart-scroll');
    var d3Selection = d3.select($chart.get(0));
    var barGroupSelection = d3Selection.selectAll('.bar-group').data(chartData, _.property('name'));
    var $labels = element.find('.labels');
    var labelSelection = d3.select($labels[0]).selectAll('.label');
    var chartWidth = dimensions.width;
    var chartTruncated = false;
    var $truncationMarker = element.find('.truncation-marker');
    var truncationMarkerWidth = $truncationMarker.width();

    if (chartWidth <= 0) {
      return;
    }

    // Compute chart margins
    if (expanded) {
      var maxLength = _.max(chartData.map(function(item) {
        // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
        return $.capitalizeWithDefault(item.name, undefinedPlaceholder).visualLength('1rem');
      }));
      var maxLabelWidth;
      if ($('.description-expanded-wrapper').height() <= 20) {
        maxLabelWidth = 10.5;
      } else {
        maxLabelWidth = 8.5;
      }
      bottomMargin = Math.floor(Math.min(
        maxLength + $.relativeToPx('1rem'),
        $.relativeToPx(maxLabelWidth + 1 + 'rem')
      ) / Math.sqrt(2));
    } else {
      bottomMargin = $.relativeToPx(numberOfDefaultLabels + 1 + 'rem');
      // do not compensate for chart scrollbar if not expanded (scrollbar would not exist)
      horizontalScrollbarHeight = 0;
    }
    // Clamp the bottom margin to a reasonable maximum since long labels are ellipsified.
    bottomMargin = bottomMargin > maximumBottomMargin ? maximumBottomMargin : bottomMargin;

    var chartHeight = Math.max(0, dimensions.height - topMargin - bottomMargin - horizontalScrollbarHeight);

    var allData = _.pluck(chartData, 'total').concat(
      showFiltered ? _.pluck(chartData, 'filtered') : []
    );

    function makeDomainIncludeZero(domain) {
      var min = domain[0], max = domain[1];
      if (min > 0) { return [ 0, max ]; }
      if (max < 0) { return [ min, 0]; }
      return domain;
    }

    var domain = makeDomainIncludeZero(d3.extent(allData));

    var verticalScale = d3.scale.linear().domain(domain).range([0, chartHeight]).clamp(false);
    var y0 = verticalScale(0);
    var horizontalScale = null;
    var rightOffset = 0;
    var rangeBand = 0;
    var minBarWidth = 0;
    var maxBarWidth = 0;

    if (expanded) {
      minBarWidth = minExpandedCardBarWidth;
      maxBarWidth = maxExpandedCardBarWidth;
    } else {
      minBarWidth = minSmallCardBarWidth;
      maxBarWidth = maxSmallCardBarWidth;
    }

    var computeChartDimensions = function(rangeInterval) {
      horizontalScale = d3.scale.ordinal().rangeBands(
        [0, Math.ceil(rangeInterval)], barPadding).domain(_.pluck(chartData, 'name')
      );
      rightOffset = horizontalScale.range()[numberOfBars - 1];
      rangeBand = Math.ceil(horizontalScale.rangeBand());
    };

    computeChartDimensions(chartWidth);

    /*
    According to the D3 API reference for Ordinal Scales#rangeBands
    (https://github.com/mbostock/d3/wiki/Ordinal-Scales#ordinal_rangeBands):

    for the method, ordinal.rangeBands(barWidth[, barPadding[, outerPadding]]) = rangeInterval

    barPadding corresponds to the amount of space in the rangeInterval as a percentage of rangeInterval (width in px)
    ==> rangeInterval = barPadding * rangeInterval + numberOfBars * barWidth
    ==> (1 - barPadding) * rangeInterval = numberOfBars * barWidth
    ==> rangeInterval = (numberOfBars * barWidth) / (1 - barPadding)

    */

    var rangeInterval;
    if (rangeBand < minBarWidth) {
      // --> desired rangeBand (bar width) is less than accepted minBarWidth
      // use computeChartDimensions to set rangeBand = minBarWidth
      // and update horizontalScale & rightOffset accordingly
      rangeInterval = minBarWidth * numberOfBars / (1 - barPadding);
      computeChartDimensions(rangeInterval);
      if (!expanded) chartTruncated = true;
    } else if (rangeBand > maxBarWidth) {
      // --> desired rangeBand (bar width) is greater than accepted maxBarWidth
      // use computeChartDimensions to set rangeBand = maxBarWidth
      rangeInterval = maxBarWidth * numberOfBars / (1 - barPadding) + maxBarWidth * barPadding;
      computeChartDimensions(rangeInterval);
    }

    var chartLeftOffset = horizontalScale.range()[0];
    var chartRightEdge = dimensions.width - chartLeftOffset;

    $chart.css('height', chartHeight + topMargin + 1);
    $chartScroll.
      css('padding-top', 0).
      css('padding-bottom', bottomMargin).
      css('top', 'initial').
      css('width', chartWidth);

    var ticks = function() {
      var numberOfTicks = 3;
      var element;

      element = $('<div>').addClass('ticks').
        css('top', $chartScroll.position().top + topMargin).
        css('width', chartWidth);
      _.each(_.uniq([0].concat(verticalScale.ticks(numberOfTicks))), function(tick) {
        element.append(
          $('<div>').
            css('top', chartHeight - verticalScale(tick)).
            toggleClass('origin', tick === 0).
            text($.toHumaneNumber(tick))
        );
      });
      element.css('height', chartHeight + topMargin);
      return element;
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

          var rangeMagnitude = chartRightEdge - chartLeftOffset;
          var spaceAvailableOnRight = rangeMagnitude - (proposedLeftOfText - chartLeftOffset);
          var spaceAvailableOnLeft = proposedLeftOfText - chartLeftOffset;

          var spaceRemainingOnRight = spaceAvailableOnRight - widthOfText;

          leftHanded = spaceRemainingOnRight <= 10 && spaceAvailableOnLeft > spaceAvailableOnRight;
        }

        labelOrientationsByIndex[index] = leftHanded;

      }
      function labelOrientationLeft(datum, index) {
        return labelOrientationsByIndex[index];
      }
      function labelOrientationRight(datum, index) {
        return !labelOrientationsByIndex[index];
      }

      var centering = chartLeftOffset - rangeBand / 2;
      var verticalPositionOfSpecialLabelRem = 2;

      var labelDivSelection = labelSelection.data(labelData, _.property('name'));
      var labelDivSelectionEnter = labelDivSelection.
        enter().
        append('div').
        classed('label', true);

      labelDivSelectionEnter.append('div').classed('text', true).append('span');
      labelDivSelectionEnter.append('div').classed('callout', true);

      labelDivSelection.
        selectAll('.text').
          style('top', function(d, i, j) {
            if (expanded) {
              return '';
            } else if (isOnlyInSpecial(d, j)) {
              return verticalPositionOfSpecialLabelRem - 0.5 + 'rem';
            } else {
              return defaultLabelData.length - 0.5 - Math.min(j, numberOfDefaultLabels - 1)+ 'rem';
            }
          }).
          classed('undefined', function(d) {
            return $.capitalizeWithDefault(d.name, undefinedPlaceholder) === undefinedPlaceholder;
          }).
          select('span').
            text(function(d) {
              return $.capitalizeWithDefault(d.name, undefinedPlaceholder);
            });

      // These widths relate to the visualLength() method call in the maxLength calculation above.
      if (expanded) {
        labelDivSelection.
          selectAll('.text').style('width', maxLabelWidth + 'rem');
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

      // To properly compute text sizes, temporarily remove label handedness, then call preComputeLabelOrientation.
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
            if (chartTruncated) {
              // If the chart is truncated, chartRightEdge will report the full width
              // of the chart as if it were not. We can get the actual width of the
              // chart through the DOM instead.
              return (parseInt($(element[0]).width(), 10) - (horizontalScale(d.name) - centering - 1)) + 'px';
            } else {
              return (chartRightEdge - (horizontalScale(d.name) - centering - 1)) + 'px';
            }
          } else {
            return '0';
          }
        }).
        classed('dim', function(d, i) {
          return specialLabelData.length > 0 && !d.special;
        });

      labelDivSelection.exit().remove();
    };

    var horizontalBarPosition = function(d) {
      return horizontalScale(d.name) - chartLeftOffset;
    };

    var updateBars = function(selection) {
      // Bars are composed of a bar group and two bars (total and filtered).

      // ENTER PROCESSING

      // Create bar groups.
      selection.enter().
        append('div').
          classed('bar-group', true);

      // Create 2 bars, total and filtered. Filtered bars default to 0 height if there is no data for them.
      // The smaller bar needs to go on top of the other. However, if the bar on top is also the total (can
      // happen for aggregations other than count), the top bar needs to be semitransparent.
      // This function transforms each piece of data (containing filtered and total amounts) into
      // an ordered pair of objects representing a bar. The order is significant and ultimately determines the 
      // order of the bars in the dom.
      // Each object in the pair looks like:
      // {
      //    isTotal: [boolean, is this bar representing the total value?],
      //    value: [number, the numerical value this bar should represent]
      // }
      function makeBarData(d) {
        // If we're not showing the filtered value, just render it zero height.
        var filtered = showFiltered ? d.filtered : 0;


        // Figure out if the totals bar is on top. This controls styling.
        var totalIsOnTop;
        if (d.total * filtered < 0) {
          // Opposite signs. Setting total on top by convention (makes styles easier).
          totalIsOnTop = true;
        } else {
          // Same sign.
          totalIsOnTop = Math.abs(d.total) >= Math.abs(filtered);
        }

        if (totalIsOnTop) {
          return [
            {
              isTotal: true,
              value: d.total
            },
            {
              isTotal: false,
              value: filtered
            }
          ];
        } else {
          return [
            {
              isTotal: false,
              value: filtered
            },
            {
              isTotal: true,
              value: d.total
            }
          ];
        }
      }
      var bars = selection.selectAll('.bar').data(makeBarData);

      // Bars are just a div.
      bars.enter().
        append('div');

      // UPDATE PROCESSING
      // Update the position of the groups.
      selection.
        attr('data-bar-name', function(d) { return _.instead(d.name, ''); }).
        style('left', function(d) { return horizontalBarPosition(d) + 'px'; }).
        style('width', rangeBand + 'px').
        style('height', function() { return chartHeight + 'px'; }).
        classed('unfiltered-on-top', function(d) {
          // This is really confusing. In CSS, we refer to the total bar as the unfiltered bar.
          // If total bar is last in the dom, then apply this class.
          return makeBarData(d)[1].isTotal;
        }).
        classed('special', function(d) { return d.special; }).
        classed('active', function(d) { return expanded || horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; });

      // Update the position of the individual bars.
      bars.
        style('width', rangeBand + 'px').
        style('height', function (d) {
          return Math.max(
            d.value === 0 ? 0 : 1,  // Always show at least one pixel for non-zero-valued bars.
            Math.abs(verticalScale(d.value) - y0)
          )+ 'px';
        }).
        style('bottom', function(d) {
          return verticalScale(Math.min(0, d.value)) + 'px';
        }).
        classed('bar', true).
        classed('unfiltered', _.property('isTotal')).
        classed('filtered', function(d) { return !d.isTotal; });

      // EXIT PROCESSING
      bars.exit().remove();
      selection.exit().remove();
    };

    $chartScroll.children('.ticks').remove();
    $chartScroll.prepend(ticks);

    barGroupSelection.call(updateBars);
    labelSelection.call(updateLabels);

    $chartScroll.flyout({
      selector: '.bar-group.active, .labels .label .text',
      parent: document.body,
      direction: 'top',
      inset: {
        vertical: -4
      },
      positionOn: function($target, $head, options) {
        var name = d3.select($target[0]).datum().name;
        name = _.instead(name, '');
        if (Modernizr.pointerevents) {
          return element.find('[data-bar-name="{0}"].bar-group .bar.unfiltered'.format(name));
        } else {
          return element.find('[data-bar-name="{0}"].bar-group'.format(name));
        }
      },
      title: function($target, $head, options) {
        var data = d3.select($target[0]).datum();
        return $.capitalizeWithDefault(data.name, undefinedPlaceholder);
      },
      table: function($target, $head, options, $flyout) {
        var data = d3.select($target[0]).datum();
        var unit = '';
        if (rowDisplayUnit) {
          unit = ' ' + rowDisplayUnit.pluralize();
        }
        var rows = [["Total", $.toHumaneNumber(data.total) + unit]];
        if (showFiltered) {
          $flyout.addClass("filtered");
          rows.push(["Filtered Amount", $.toHumaneNumber(data.filtered) + unit]);
        }
        return rows;
      }
    });

    // Set "Click to Expand" truncation marker + its tooltip
    $truncationMarker.css('bottom', $labels.height() - $truncationMarker.height());

    if (chartTruncated) {
      $truncationMarker.css('display', 'block');
    } else {
      $truncationMarker.css('display', 'none');
    }
  };

  return {
    template:
      '<div class="column-chart" ng-class="{ expanded: expanded }">' +
        '<div class="chart-scroll">' +
          '<div class="column-chart-wrapper" ng-class="{filtered: showFiltered}">' +
            '<div class="truncation-marker">&raquo;</div>' +
          '</div>' +
          '<div class="labels"></div>' +
        '</div>' +
      '</div>',
    restrict: 'A',
    scope: {
      chartData: '=',
      showFiltered: '=',
      expanded: '=',
      rowDisplayUnit: '='
    },
    link: function(scope, element, attrs) {

      AngularRxExtensions.install(scope);

      if (_.isEmpty(element.closest('.card-visualization'))) {
        throw new Error("[columnChart] column-chart is missing a .card-visualization (grand)parent.");
      }

      element.parent().delegate('.truncation-marker', 'click', function(event) {
        scope.$apply(function() {
          scope.$emit('column-chart:truncation-marker-clicked', event);
        });
      });

      FlyoutService.register('truncation-marker', function(el) { return '<div class="flyout-title">Click to expand</div>'; });

      element.parent().delegate('.bar-group, .labels .label span', 'click', function(event) {
        var clickedDatum = d3.select(event.currentTarget).datum();
        scope.$apply(function() {
          scope.$emit('column-chart:datum-clicked', clickedDatum);
        });
      });

      Rx.Observable.subscribeLatest(
        element.closest('.card-visualization').observeDimensions().map(function(dimensions) {
          return {
            width: Math.max(dimensions.width, 0),
            height: Math.max(dimensions.height, 0)
          };
        }),
        scope.observe('chartData'),
        scope.observe('showFiltered'),
        scope.observe('expanded'),
        scope.observe('rowDisplayUnit'),
        function(cardVisualizationDimensions, chartData, showFiltered, expanded, rowDisplayUnit) {
          if (!chartData) return;
          scope.$emit('render:start', { source: 'columnChart_{0}'.format(scope.$id), timestamp: _.now() });
          renderColumnChart(
            element,
            chartData,
            showFiltered,
            cardVisualizationDimensions,
            expanded,
            rowDisplayUnit
          );
          // Yield execution to the browser to render, then notify that render is complete
          $timeout(function() {
            scope.$emit('render:complete', { source: 'columnChart_{0}'.format(scope.$id), timestamp: _.now() });
          });
        }
      );
      scope.$on('$destroy', function() {
        element.parent().undelegate();
        element.find('.chart-scroll').undelegate();
      });
    }
  };

});

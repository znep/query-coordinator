angular.module('socrataCommon.directives').directive('columnChart', function($parse, $timeout, AngularRxExtensions, FlyoutService) {
  'use strict';

  var renderColumnChart = function(element, chartData, showFiltered, dimensions, expanded, rowDisplayUnit) {

    var topMargin = 0; // Set to zero so .card-text could control padding b/t text & visualization
    var bottomMargin; // Calculated based on label text length
    var horizontalScrollbarHeight = 15; // used to keep horizontal scrollbar within .card-visualization upon expand
    var numberOfDefaultLabels = expanded ? chartData.length : 3;
    var UNDEFINED_PLACEHOLDER = '(No value)';
    var maximumBottomMargin = 140;

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

    var fixedLabelWidth = computeFixedLabelWidthOrNull(element, expanded);

    var labelValueOrPlaceholder = function labelValueOrPlaceholder(value, placeholder) {
      placeholder = placeholder || UNDEFINED_PLACEHOLDER;
      if ($.isNumeric(value)) { return value; }
      if (_.isBoolean(value)) { value = value.toString(); }
      value = value || '';
      return $.isBlank(value.trim().escapeSpaces()) ? placeholder : value;
    };

    // Compute chart margins
    if (expanded) {
      var maxLength = _.max(chartData.map(function(item) {
        // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
        return labelValueOrPlaceholder(item.name).visualLength('1rem');
      }));
      bottomMargin = Math.floor(Math.min(
        maxLength + $.relativeToPx('1rem'),
        $.relativeToPx(fixedLabelWidth + 1 + 'rem')
      ) / Math.sqrt(2));
    } else {
      bottomMargin = $.relativeToPx(numberOfDefaultLabels + 1 + 'rem');
      // do not compensate for chart scrollbar if not expanded (scrollbar would not exist)
      horizontalScrollbarHeight = 0;
    }
    // Clamp the bottom margin to a reasonable maximum since long labels are ellipsified.
    bottomMargin = bottomMargin > maximumBottomMargin ? maximumBottomMargin : bottomMargin;

    var chartHeight = Math.max(0, dimensions.height - topMargin - bottomMargin - horizontalScrollbarHeight);

    var horizontalScaleDetails = computeHorizontalScale(chartWidth, chartData, expanded);
    var horizontalScale = horizontalScaleDetails.scale;
    chartTruncated = horizontalScaleDetails.truncated;
    var rangeBand = Math.ceil(horizontalScale.rangeBand());

    // If the chart is not expanded, limit our vert scale computation to what's actually
    // visible. We still render the bars outside the viewport to speed up horizontal resizes.
    var chartDataRelevantForVerticalScale = expanded ?
      chartData : _.take(chartData, Math.ceil(chartWidth / rangeBand) + 1);
    var verticalScale = computeVerticalScale(chartHeight, chartDataRelevantForVerticalScale, showFiltered);

    var chartLeftOffset = horizontalScale.range()[0];
    var chartRightEdge = dimensions.width - chartLeftOffset;

    $chart.css('height', chartHeight + topMargin + 1);
    $chartScroll.css({
      'padding-top': 0,
      'padding-bottom': bottomMargin,
      'top': 'initial',
      'width': chartWidth
    });

    var ticks = function() {
      var numberOfTicks = 3;
      var element = $('<div />', {
        'class': 'ticks',
        css: {
          top: $chartScroll.position().top + topMargin,
          width: chartWidth,
          height: chartHeight + topMargin
        }
      });

      var tickMarks = _.map(_.uniq([0].concat(verticalScale.ticks(numberOfTicks))), function(tick) {
        return $('<div/>', {
          'class': tick === 0 ? 'origin' : '',
          css: {
            top: chartHeight - verticalScale(tick)
          },
          text: $.toHumaneNumber(tick)
        });
      });

      element.append(tickMarks);
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

      var defaultLabelData = _.take(chartData, numberOfDefaultLabels);

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
          var labelWidth = $(this).find('.contents').width();
          var proposedLeftOfText = horizontalScale(datum.name);

          var rangeMagnitude = chartRightEdge - chartLeftOffset;
          var spaceAvailableOnRight = rangeMagnitude - (proposedLeftOfText - chartLeftOffset);
          var spaceAvailableOnLeft = proposedLeftOfText - chartLeftOffset;

          var spaceRemainingOnRight = spaceAvailableOnRight - labelWidth;

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
      var labelMargin = 0.75;
      var specialLabelMargin = -0.4;

      var labelDivSelection = labelSelection.data(labelData, _.property('name'));
      var labelDivSelectionEnter = labelDivSelection.
        enter().
        append('div').
        classed('label', true);

      // For new labels, add a contents div containing a span for the filter icon,
      // a span for the label text, and a span for the clear filter icon.
      // The filter icon and close icon are toggled via CSS classes.
      var labelText = labelDivSelectionEnter.append('div').classed('contents', true);
      labelText.append('span').classed('icon-filter', true);
      labelText.append('span').classed('text', true);
      labelText.append('span').classed('icon-close', true);

      labelDivSelectionEnter.append('div').classed('callout', true);

      // Re-bind to child spans (d3 does not do this automatically)
      labelDivSelection.each(function(d) {
        d3.select(this).selectAll('span').datum(d);
      });

      labelDivSelection.
        select('.contents').
          style('top', function(d, i) {
            if (expanded) {
              return '';
            } else if (isOnlyInSpecial(d, i)) {
              return verticalPositionOfSpecialLabelRem + 'rem';
            } else {
              return defaultLabelData.length - 0.5 - Math.min(i, numberOfDefaultLabels - 1) + 'rem';
            }
          }).
          classed('undefined', function(d) {
            return labelValueOrPlaceholder(d.name) === UNDEFINED_PLACEHOLDER;
          }).
          select('.text').
            text(function(d) {
              return labelValueOrPlaceholder(d.name);
            });

      labelDivSelection.
        select('.callout').
          style('height', function(d, i) {
            if (expanded) {
              return ''; // Expanded charts have auto-height labels.
            } else {
              if (isOnlyInSpecial(d, i)) {
                return verticalPositionOfSpecialLabelRem + 'rem';
              } else {
                return (defaultLabelData.length - i - (d.special ? 0.75 : 0)) + 'rem';
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
        }).
        classed('special', _.property('special'));

      labelDivSelection.
        select('.contents').
        style('left', function(d) {
          if (!d.special) return labelMargin + 'rem';

          if (parseInt($(this).parent().css('left'), 10) < $.relativeToPx((-specialLabelMargin) + 'rem')) {
            return '-5px';
          }

          return specialLabelMargin + 'rem';
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
            Math.abs(verticalScale(d.value) - verticalScale(0))
          ) + 'px';
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

    var $ticks = ticks();
    var $columnChart = element.find('.column-chart');
    $columnChart.children('.ticks').remove();
    $columnChart.prepend($ticks);

    barGroupSelection.call(updateBars);
    labelSelection.call(updateLabels);

    // Flyout with bar/filter information
    $chartScroll.flyout({
      selector: '.bar-group.active, .labels .label .contents span:not(.icon-close)',
      parent: document.body,
      direction: 'top',
      inset: {
        vertical: -4
      },
      positionOn: function($target) {
        var name = d3.select($target[0]).datum().name;
        name = _.instead(name, '');
        var barGroup = element.find('[data-bar-name="{0}"].bar-group'.format(name));
        barGroup.addClass('hover');
        $target.one('mouseout', function() {
          barGroup.removeClass('hover');
        });
        $target.one('click', function() {
          $target.trigger('mouseout');
        });
        return Modernizr.pointerevents ?
          element.find('[data-bar-name="{0}"].bar-group .bar.unfiltered'.format(name)) :
          barGroup;
      },
      title: function($target, $head, options) {
        var data = d3.select($target[0]).datum();
        return labelValueOrPlaceholder(data.name);
      },
      table: function($target, $head, options, $flyout) {
        var data = d3.select($target[0]).datum();
        var unit = '';
        if (rowDisplayUnit) {
          unit = ' ' + rowDisplayUnit.pluralize();
        }
        var rows = [["Total", $.toHumaneNumber(data.total) + unit]];
        if (showFiltered) {
          var filteredAmount = $.toHumaneNumber(data.filtered) + unit;
          var spanTemplate = '<span class="{0}">{1}</span>';
          var spanClass = data.special ? 'filtered-row-selected' : 'filtered-row-highlight';
          rows.push([spanTemplate.format(spanClass, 'Filtered Amount:'), spanTemplate.format(spanClass, filteredAmount)]);
        }

        if (data.special) {
          rows.push(['&#8203;', '&#8203;']);
          rows.push(['The page is currently filtered by this value, click to clear it', '']);
        }

        return rows;
      }
    });

    // Flyout for the clear filter icon
    $chartScroll.flyout({
      selector: '.labels .label .contents .icon-close',
      parent: document.body,
      direction: 'top',
      positionOn: function($target) {
        $target.one('click', function() {
          $target.trigger('mouseout');
        });
        return $target;
      },
      html: 'Clear filter'
    });

    // Set "Click to Expand" truncation marker + its tooltip
    $truncationMarker.css({
      bottom: $labels.height() - $truncationMarker.height(),
      display: chartTruncated ? 'block' : 'none'
    });

  };

  function computeDomain(chartData, showFiltered) {
    var allData = _.pluck(chartData, 'total').concat(
      showFiltered ? _.pluck(chartData, 'filtered') : []
    );

    function makeDomainIncludeZero(domain) {
      var min = domain[0];
      var max = domain[1];
      if (min > 0) { return [ 0, max ]; }
      if (max < 0) { return [ min, 0]; }
      return domain;
    }

    return makeDomainIncludeZero(d3.extent(allData));
  }

  function computeVerticalScale(chartHeight, chartData, showFiltered) {
    return d3.scale.linear().domain(computeDomain(chartData, showFiltered)).range([0, chartHeight]);
  }

  function computeHorizontalScale(chartWidth, chartData, expanded) {
    // Horizontal scale configuration
    var barPadding = 0.25;
    var minBarWidth = 0;
    var maxBarWidth = 0;
    var minSmallCardBarWidth = 8;
    var maxSmallCardBarWidth = 30;
    var minExpandedCardBarWidth = 15;
    var maxExpandedCardBarWidth = 40;
    // End configuration

    var horizontalScale;
    var numberOfBars = chartData.length;
    var isChartTruncated = false;
    var rangeBand;

    if (expanded) {
      minBarWidth = minExpandedCardBarWidth;
      maxBarWidth = maxExpandedCardBarWidth;
    } else {
      minBarWidth = minSmallCardBarWidth;
      maxBarWidth = maxSmallCardBarWidth;
    }

    var computeChartDimensionsForRangeInterval = function(rangeInterval) {
      horizontalScale = d3.scale.ordinal().rangeBands(
        [0, Math.ceil(rangeInterval)], barPadding).domain(_.pluck(chartData, 'name')
      );
      rangeBand = Math.ceil(horizontalScale.rangeBand());
    };

    computeChartDimensionsForRangeInterval(chartWidth);

    /*
    According to the D3 API reference for Ordinal Scales#rangeBands
    (https://github.com/mbostock/d3/wiki/Ordinal-Scales#ordinal_rangeBands):

    for the method, ordinal.rangeBands(barWidth[, barPadding[, outerPadding]]) = rangeInterval

    barPadding corresponds to the amount of space in the rangeInterval as a percentage of rangeInterval (width in px)
    ==> rangeInterval = barPadding * rangeInterval + numberOfBars * barWidth
    ==> (1 - barPadding) * rangeInterval = numberOfBars * barWidth
    ==> rangeInterval = (numberOfBars * barWidth) / (1 - barPadding)

    */

    if (rangeBand < minBarWidth) {
      // --> desired rangeBand (bar width) is less than accepted minBarWidth
      // use computeChartDimensionsForRangeInterval to set rangeBand = minBarWidth
      // and update horizontalScale accordingly
      computeChartDimensionsForRangeInterval(minBarWidth * numberOfBars / (1 - barPadding));
      if (!expanded) isChartTruncated = true;
    } else if (rangeBand > maxBarWidth) {
      // --> desired rangeBand (bar width) is greater than accepted maxBarWidth
      // use computeChartDimensionsForRangeInterval to set rangeBand = maxBarWidth
      computeChartDimensionsForRangeInterval(maxBarWidth * numberOfBars / (1 - barPadding) + maxBarWidth * barPadding);
    }

    return {
      scale: horizontalScale,
      truncated: isChartTruncated
    };
  }

  function computeFixedLabelWidthOrNull(element, expanded) {
    if (expanded) {
      if (element.closest('card').find('.description-expanded-wrapper').height() <= 20) {
        return 10.5;
      } else {
        return 8.5;
      }
    }

    return null;
  }

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

      FlyoutService.register(
        'truncation-marker',
        _.constant('<div class="flyout-title">Click to expand</div>'),
        scope.observeDestroy(element)
      );

      element.parent().delegate('.bar-group, .labels .label .contents span', 'click', function(event) {
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
      scope.observeDestroy(element).subscribe(function() {
        element.parent().undelegate();
        element.find('.chart-scroll').undelegate();
      });
    }
  };

});

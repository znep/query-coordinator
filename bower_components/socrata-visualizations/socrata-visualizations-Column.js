(function(window) {

  'use strict';

  if (
    (!window._) ||
    (_.prototype.constructor.toString().match(/lodash/i) === null)
  ) {
    throw new Error('lodash is a required dependency for `socrata-utils.js`.');
  }

  if (!_.has(window, 'socrata.visualizations.Visualization')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata-visualizations-Visualization.js',
          'socrata-visualizations-Column.js'
        )
    );
  }

  function Column(element, config) {

    var _chartElement;
    var _chartWrapper;
    var _chartScroll;
    var _chartLabels;
    var _truncationMarker;

    _.extend(this, new window.socrata.visualizations.Visualization(element, config));

    _renderTemplate(this.element);

    /**
     * Public methods
     */

    this.render = function(data, options) {











    // Cache dimensions and options
    var dimensions = this.element[0].getBoundingClientRect();
    var expanded = options.expanded;
    var rowDisplayUnit = options.rowDisplayUnit;
    var showFiltered = options.showFiltered;

    if (expanded) {
      _chartElement.addClass('expanded');
    } else {
      _chartElement.removeClass('expanded');
    }

    /**
     * Implementation begins here
     */

    var topMargin = 0; // Set to zero so .card-text could control padding b/t text & visualization
    var bottomMargin; // Calculated based on label text length
    var horizontalScrollbarHeight = 15; // used to keep horizontal scrollbar within .card-visualization upon expand
    var numberOfDefaultLabels = expanded ? data.length : 3;
    var UNDEFINED_PLACEHOLDER = '({0})'.format(this.getLocalization('NO_VALUE'));
    var maximumBottomMargin = 140;
    var d3Selection = d3.select(_chartWrapper.get(0));
    var barGroupSelection = d3Selection.selectAll('.bar-group').data(data, _.property('name'));
    var labelSelection = d3.select(_chartLabels[0]).selectAll('.label');
    var chartWidth = dimensions.width;
    var chartTruncated = false;
    var truncationMarkerWidth = _truncationMarker.width();

    if (chartWidth <= 0) {
      return;
    }

    var fixedLabelWidth = _computeFixedLabelWidthOrNull(element, expanded);

    var labelValueOrPlaceholder = function labelValueOrPlaceholder(value, placeholder) {
      placeholder = placeholder || UNDEFINED_PLACEHOLDER;
      if ($.isNumeric(value)) { return value; }
      if (_.isBoolean(value)) { value = value.toString(); }
      value = value || '';
      return $.isBlank(value.trim().escapeSpaces()) ? placeholder : value;
    };



    // Compute chart margins
    if (expanded) {
      var maxLength = _.max(data.map(function(item) {
        // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
        return labelValueOrPlaceholder(item.name).visualLength('1rem');
      }));
      bottomMargin = Math.floor(Math.min(
        maxLength + $.relativeToPx('1rem'),
        $.relativeToPx(fixedLabelWidth + 1 + 'rem')
      ) / Math.sqrt(2));
    } else {
      bottomMargin = $.relativeToPx(numberOfDefaultLabels + 1 + 'rem');

      // Do not compensate for chart scrollbar if not expanded (scrollbar would not exist)
      horizontalScrollbarHeight = 0;
    }
    // Clamp the bottom margin to a reasonable maximum since long labels are ellipsified.
    bottomMargin = bottomMargin > maximumBottomMargin ? maximumBottomMargin : bottomMargin;

    var chartHeight = Math.max(0, dimensions.height - topMargin - bottomMargin - horizontalScrollbarHeight);

    var horizontalScaleDetails = _computeHorizontalScale(chartWidth, data, expanded);
    var horizontalScale = horizontalScaleDetails.scale;
    chartTruncated = horizontalScaleDetails.truncated;
    var rangeBand = Math.ceil(horizontalScale.rangeBand());

    // If the chart is not expanded, limit our vert scale computation to what's actually
    // visible. We still render the bars outside the viewport to speed up horizontal resizes.
    var chartDataRelevantForVerticalScale = expanded ?
      data : _.take(data, Math.ceil(chartWidth / rangeBand) + 1);
    var verticalScale = _computeVerticalScale(chartHeight, chartDataRelevantForVerticalScale, showFiltered);

    var chartLeftOffset = horizontalScale.range()[0];
    var chartRightEdge = dimensions.width - chartLeftOffset;

    _chartWrapper.css('height', chartHeight + topMargin + 1);
    _chartScroll.css({
      'padding-top': 0,
      'padding-bottom': bottomMargin,
      'top': 'initial',
      'width': chartWidth,
      'height': chartHeight + topMargin
    });

    var _renderTicks = function() {

      var numberOfTicks = 3;
      var element = $('<div />', {
        'class': 'ticks',
        css: {
          top: _chartScroll.position().top + topMargin,
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
          text: String(tick)//FormatService.formatNumber(tick)
        });
      });

      element.append(tickMarks);

      return element;
    };

    var updateLabels = function(labelSelection) {

      // Labels come in two sets of column names:
      //  - Default labels. When the chart is unexpanded, this consists of the
      //    first three column names in the data.
      //    When the chart is expanded, this contains all the column names in the data.
      //  - Special labels. Contains the names of columns which are special.
      var defaultLabelData = _.take(data, numberOfDefaultLabels);
      var specialLabelData = _.filter(data, _.property('special'));
      var labelData = _.union(defaultLabelData, specialLabelData);
      var labelOrientationsByIndex = [];

      if (specialLabelData.length > 1) {
        throw new Error('Multiple special labels not supported yet in column chart');
      }

      function isOnlyInSpecial(datum, index) {
        return datum.special && index >= numberOfDefaultLabels;
      }

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

      // Bind data to child spans
      labelDivSelection.each(function(d) {
        d3.select(this).selectAll('span').datum(d);
      });

      labelDivSelection.
        select('.contents').
          style('top', function(d, i) {
            var topOffset;

            if (expanded) {
              topOffset = 0;
            } else if (isOnlyInSpecial(d, i)) {
              topOffset = verticalPositionOfSpecialLabelRem;
            } else {
              topOffset = defaultLabelData.length - 0.5 - Math.min(i, numberOfDefaultLabels - 1);
            }

            return '{0}rem'.format(topOffset);
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

            // Expanded charts have auto-height labels.
            if (expanded) {
              return '';
            } else {
              if (isOnlyInSpecial(d, i)) {
                return verticalPositionOfSpecialLabelRem + 'rem';
              } else {
                return (defaultLabelData.length - i - (d.special ? 0.75 : 0)) + 'rem';
              }
            }
          }).

          // Hide the '.callout' if there is no room for it
          style('display', function(d) {
            var scaleOffset = horizontalScale(d.name) - centering - 1;

            if (scaleOffset >= chartWidth) {
              return 'none';
            }
          });

      // For each label, re-compute their orientations and set all left and
      // right offsets.
      labelDivSelection.
        classed('orientation-left', false).
        classed('orientation-right', false).
        each(preComputeLabelOrientation).
        classed('orientation-left', labelOrientationLeft).
        classed('orientation-right', labelOrientationRight).
        classed('dim', function(d) {
          return specialLabelData.length > 0 && !d.special;
        }).
        classed('special', _.property('special')).
        each(function(d) {

          // Save references to all d3 selections.
          var labelSelection = d3.select(this);
          var labelContentSelection = labelSelection.select('.contents');
          var labelTextSelection = labelContentSelection.select('.text');

          var labelLeftOffset = 0;
          var labelRightOffset = 0;
          var labelContentLeftOffset;
          var labelContentRightOffset;
          var isSelected = d.special;
          var scaleOffset = horizontalScale(d.name) - centering - 1;
          var noRoomForCallout = scaleOffset >= chartWidth && isSelected && !expanded;
          var leftOriented = $(this).hasClass('orientation-left');
          var labelIconPadding = 30;
          var halfWidthOfCloseIcon = ($(this).find('.icon-close').width() / 2) - 1;
          var textMaxWidth;

          // Logic for setting label and content offsets and text max widths.
          if (expanded || !isSelected) {
            labelLeftOffset = scaleOffset;
            labelContentLeftOffset = labelMargin;
          } else if (leftOriented) {
            labelRightOffset = chartRightEdge - scaleOffset;
            labelContentRightOffset = -halfWidthOfCloseIcon;
            textMaxWidth = scaleOffset - labelIconPadding;
          } else {
            labelLeftOffset = scaleOffset;
            labelContentLeftOffset = specialLabelMargin;
            textMaxWidth = chartWidth - scaleOffset - labelIconPadding;
          }

          if (!isSelected && !expanded) {
            textMaxWidth = chartWidth - scaleOffset - labelIconPadding;
          }

          if (noRoomForCallout) {
            labelRightOffset = 0;
            labelContentLeftOffset = 0;
            labelContentRightOffset = 0;
            textMaxWidth = chartWidth - labelIconPadding;
          }

          // Apply styles
          labelSelection.style('left', '{0}px'.format(labelLeftOffset));
          labelSelection.style('right', '{0}px'.format(labelRightOffset));

          if (_.isDefined(labelContentLeftOffset)) {
            labelContentSelection.style('left', '{0}rem'.format(labelContentLeftOffset));
          } else {
            labelContentSelection.style('left', '');
          }

          if (_.isDefined(labelContentRightOffset)) {
            labelContentSelection.style('right', '{0}px'.format(labelContentRightOffset));
          } else {
            labelContentSelection.style('right', '');
          }

          labelTextSelection.style('max-width', '{0}px'.format(textMaxWidth));
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
        attr('data-bar-name', function(d) { return d.name.toString(); }).
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
          if (_.isNaN(d.value)) {
            return 0;
          }
          return Math.max(
            d.value === 0 ? 0 : 1,  // Always show at least one pixel for non-zero-valued bars.
            Math.abs(verticalScale(d.value) - verticalScale(0))
          ) + 'px';
        }).
        style('bottom', function(d) {
          if (_.isNaN(d.value)) {
            return 0;
          }
          return verticalScale(Math.min(0, d.value)) + 'px';
        }).
        classed('bar', true).
        classed('unfiltered', _.property('isTotal')).
        classed('filtered', function(d) { return !d.isTotal; });

      // EXIT PROCESSING
      bars.exit().remove();
      selection.exit().remove();
    };

    barGroupSelection.call(updateBars);
    labelSelection.call(updateLabels);

    _chartElement.children('.ticks').remove();
    _chartElement.prepend(_renderTicks());

    // Set "Click to Expand" truncation marker + its tooltip
    _truncationMarker.css({
      top: chartHeight,
      display: chartTruncated ? 'block' : 'none'
    });




    // Render the content of the column chart flyout by grabbing
    // the parent barGroup element's d3 data and constructing
    // the markup of the flyout.
    // function renderFlyout(target) {
    //   var data;
    //   var unfilteredValue;
    //   var filteredValue;
    //   var flyoutTitle;
    //   var flyoutContent;
    //   var flyoutSpanClass;
    //   var $target = $(target);

    //   // Helper function to properly format flyout values.
    //   var formatFlyoutValue = function(value) {
    //     var formattedValue;

    //     if (_.isFinite(value)) {
    //       if (rowDisplayUnit) {
    //         formattedValue = (value === 1) ?
    //           rowDisplayUnit : rowDisplayUnit.pluralize();
    //         formattedValue = ' ' + formattedValue;
    //       }

    //       formattedValue = FormatService.formatNumber(value) + formattedValue;
    //     } else {
    //       formattedValue = UNDEFINED_PLACEHOLDER;
    //     }

    //     return formattedValue;
    //   };

    //   // If we're hovering over a .bar within
    //   // .bar-group, update the target reference.
    //   if ($target.is('.bar-group.active .bar')) {
    //     target = $target.parent().get(0);
    //   }

    //   // Make sure that target is defined before we
    //   // start using it to grab data and build the
    //   // flyout content.
    //   if (_.isDefined(target)) {

    //     data = d3.select(target).datum();
    //     flyoutTitle = labelValueOrPlaceholder(data.name);
    //     unfilteredValue = formatFlyoutValue(data.total);

    //     flyoutContent = [
    //       '<div class="flyout-title">{0}</div>',
    //       '<div class="flyout-row">',
    //         '<span class="flyout-cell">{1}</span>',
    //         '<span class="flyout-cell">{2}</span>',
    //       '</div>'
    //     ];

    //     // If we are showing filtered data, then
    //     // show the filtered data on the flyout.
    //     if (showFiltered) {

    //       filteredValue = formatFlyoutValue(data.filtered);
    //       flyoutSpanClass = 'emphasis';
    //       flyoutContent.push(
    //         '<div class="flyout-row">',
    //           '<span class="flyout-cell {3}">{4}</span>',
    //           '<span class="flyout-cell {3}">{5}</span>',
    //         '</div>');

    //       // If we are hovering over a bar we are
    //       // currently filtering by, then display a special
    //       // flyout message.
    //       if (data.special) {

    //         flyoutSpanClass = 'is-selected';
    //         flyoutContent.push(
    //           '<div class="flyout-row">',
    //             '<span class="flyout-cell">&#8203;</span>',
    //             '<span class="flyout-cell">&#8203;</span>',
    //           '</div>',
    //           '<div class="flyout-row">',
    //             '<span class="flyout-cell">{6}</span>',
    //             '<span class="flyout-cell"></span>',
    //           '</div>');
    //       }

    //       flyoutContent = flyoutContent.
    //         join('').
    //         format(
    //           _.escape(flyoutTitle),
    //           I18n.flyout.total,
    //           _.escape(unfilteredValue),
    //           flyoutSpanClass,
    //           I18n.flyout.filteredAmount,
    //           _.escape(filteredValue),
    //           I18n.flyout.clearFilterLong
    //         );

    //     } else {

    //       flyoutContent = flyoutContent.
    //         join('').
    //         format(
    //           _.escape(flyoutTitle),
    //           I18n.flyout.total,
    //           _.escape(unfilteredValue)
    //         );

    //     }

    //     return flyoutContent;
    //   }
    // }

    // var flyoutSelectors = [
    //   '.bar-group.active',
    //   '.bar-group.active .bar',
    //   '.labels .label .contents span:not(.icon-close)'
    // ];

    // FlyoutService.register({
    //   selector: flyoutSelectors.join(', '),
    //   render: renderFlyout,
    //   positionOn: function(target) {
    //     var barName;
    //     var barGroup;
    //     var unfilteredValue;
    //     var filteredValue;
    //     var flyoutTarget;

    //     // If we're hovering over a .bar within
    //     // .bar-group, update the target reference.
    //     if ($(target).is('.bar-group.active .bar')) {
    //       target = $(target).parent().get(0);
    //     }

    //     // Select the barGroup using d3 datum().
    //     barName = d3.select(target).
    //       datum().
    //       name.
    //       toString().
    //       replace(/\\/g, '\\\\').
    //       replace(/"/g, '\\\"');
    //     barGroup = $(target).closest(element).
    //       find('.bar-group[data-bar-name="{0}"]'.format(barName)).
    //       get(0);

    //     if (_.isDefined(barGroup)) {

    //       // If the bar is hidden, display the flyout over the label.
    //       if (!$(barGroup).is(':visible')) {
    //         return target;
    //       }

    //       // Add hover effects to the barGroup.
    //       $(barGroup).addClass('hover');
    //       $(target).one('mouseout', function() {
    //         $(barGroup).removeClass('hover');
    //       });

    //       // Save the unfiltered and filtered values.
    //       unfilteredValue = d3.select(barGroup).datum().total;
    //       filteredValue = d3.select(barGroup).datum().filtered;

    //       // Position the flyout over the bar (filtered v. unfiltered)
    //       // with the greater value.
    //       if (filteredValue > unfilteredValue) {
    //         flyoutTarget = $(barGroup).find('.filtered').get(0);
    //       } else {
    //         flyoutTarget = $(barGroup).find('.unfiltered').get(0);
    //       }

    //       return flyoutTarget;
    //     }
    //   },
    //   destroySignal: scope.$destroyAsObservable(element)
    // });

    // FlyoutService.register({
    //   selector: '.labels .label .contents .icon-close',
    //   render: _.constant('<div class="flyout-title">{0}</div>'.format(I18n.flyout.clearFilter)),
    //   destroySignal: scope.$destroyAsObservable(element)
    // });
















    };

    /**
     * Private methods
     */

    function _renderTemplate(element) {

      var truncationMarker = $(
        '<div>',
        {
          'class': 'truncation-marker'
        }
      ).html('&raquo;')

      var chartWrapper = $(
        '<div>',
        {
          'class': 'column-chart-wrapper'
        }
      ).append(truncationMarker);

      var chartLabels = $(
        '<div>',
        {
          'class': 'labels'
        }
      );

      var chartScroll = $(
        '<div>',
        {
          'class': 'chart-scroll'
        }
      ).append([
        chartWrapper,
        chartLabels
      ]);

      var chartElement = $(
        '<div>',
        {
          'class': 'column-chart'
        }
      ).append(chartScroll);

      // Cache element selections
      _chartElement = chartElement;
      _chartWrapper = chartWrapper;
      _chartScroll = chartScroll;
      _chartLabels = chartLabels;
      _truncationMarker = truncationMarker;

      element.append(chartElement);
    }

    function _computeDomain(chartData, showFiltered) {
      var allData = _.pluck(chartData, 'total').concat(
        showFiltered ? _.pluck(chartData, 'filtered') : []
      );

      function _makeDomainIncludeZero(domain) {
        var min = domain[0];
        var max = domain[1];
        if (min > 0) { return [ 0, max ]; }
        if (max < 0) { return [ min, 0]; }
        return domain;
      }

      return _makeDomainIncludeZero(d3.extent(allData));
    }

    function _computeVerticalScale(chartHeight, chartData, showFiltered) {
      return d3.scale.linear().domain(_computeDomain(chartData, showFiltered)).range([0, chartHeight]);
    }

    function _computeHorizontalScale(chartWidth, chartData, expanded) {
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

      var _computeChartDimensionsForRangeInterval = function(rangeInterval) {
        horizontalScale = d3.scale.ordinal().rangeBands(
          [0, Math.ceil(rangeInterval)], barPadding).domain(_.pluck(chartData, 'name')
        );
        rangeBand = Math.ceil(horizontalScale.rangeBand());
      };

      _computeChartDimensionsForRangeInterval(chartWidth);

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
        _computeChartDimensionsForRangeInterval(minBarWidth * numberOfBars / (1 - barPadding));
        if (!expanded) {
          isChartTruncated = true;
        }
      } else if (rangeBand > maxBarWidth) {
        // --> desired rangeBand (bar width) is greater than accepted maxBarWidth
        // use computeChartDimensionsForRangeInterval to set rangeBand = maxBarWidth
        _computeChartDimensionsForRangeInterval(maxBarWidth * numberOfBars / (1 - barPadding) + maxBarWidth * barPadding);
      }

      return {
        scale: horizontalScale,
        truncated: isChartTruncated
      };
    }

    function _computeFixedLabelWidthOrNull(element, expanded) {
      if (expanded) {
        if (element.closest('card').find('.description-expanded-wrapper').height() <= 20) {
          return 10.5;
        } else {
          return 8.5;
        }
      }

      return null;
    }
  }

  window.socrata.visualizations.Column = Column;
})(window);

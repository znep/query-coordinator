(function(window) {

  'use strict';

  if (!_.has(window, 'socrata.visualizations.Visualization')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.Visualization.js',
          'socrata.visualizations.Column.js'
        )
    );
  }


  $.relativeToPx = function(rems) {
    var $div = $(document.createElement('div')).css('width', rems).appendTo(document.body);
    var width = $div.width();

    $div.remove();

    return width;
  };

  function Column(element, config) {

    _.extend(this, new window.socrata.visualizations.Visualization(element, config));

    var self = this;
    var _chartElement;
    var _chartWrapper;
    var _chartScroll;
    var _chartLabels;
    var _truncationMarker;
    var _lastRenderOptions;

    // TODO: Validate columns

    var NAME_INDEX = config.columns.name;
    var UNFILTERED_INDEX = config.columns.unfilteredValue;
    var FILTERED_INDEX = config.columns.filteredValue;
    var SELECTED_INDEX = config.columns.selected;

    _renderTemplate(this.element);

    _attachEvents(this.element);

    /**
     * Public methods
     */

    this.render = function(data, options) {
      _lastRenderOptions = options;
      _renderData(this.element, data, options);
    };

    this.destroy = function() {
      _unattachEvents();
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

    function _attachEvents(element) {

      element.on(
        'click',
        '.bar-group, .labels .label .contents span',
        selectDatum
      );

      element.on(
        'click',
        '.truncation-marker',
        expandVisualization
      );

      element.on(
        'mouseenter, mousemove',
        '.bar-group.active, .bar-group.active .bar, .labels .label .contents span:not(.icon-close)',
        showFlyout
      );

      element.on(
        'mouseleave',
        '.bar-group.active, .bar-group.active .bar, .labels .label .contents span:not(.icon-close)',
        hideFlyout
      );
    }

    function _unattachEvents() {

      element.off(
        'click',
        '.bar-group, .labels .label .contents span',
        selectDatum
      );

      element.off(
        'click',
        '.truncation-marker',
        expandVisualization
      );

      element.off(
        'mouseenter, mousemove',
        '.bar-group.active, .bar-group.active .bar, .labels .label .contents span:not(.icon-close)',
        showFlyout
      );

      element.off(
        'mouseleave',
        '.bar-group.active, .bar-group.active .bar, .labels .label .contents span:not(.icon-close)',
        hideFlyout
      );
    }

    function selectDatum(event) {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
        {
          name: d3.select(event.currentTarget).datum()[NAME_INDEX]
        }
      );
    }

    function expandVisualization(event) {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_OPTIONS',
        {
          expanded: true
        }
      );
    }

    function showFlyout(event) {

      var datum = d3.select(event.currentTarget).datum();

      var payload = {
        element: event.currentTarget,
        title: _labelValueOrPlaceholder(datum[NAME_INDEX]),
        unfilteredValueLabel: self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL'),
        unfilteredValue: datum[UNFILTERED_INDEX],
        labelUnit: _lastRenderOptions.labelUnit
      };

      if (_lastRenderOptions.showFiltered) {

        payload.filteredValueLabel = self.getLocalization('FLYOUT_FILTERED_AMOUNT_LABEL');
        payload.filteredValue = datum[FILTERED_INDEX];

      }

      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        {
          data: payload
        }
      );
    }

    function hideFlyout(event) {

      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        {
          data: null
        }
      );
    }

    /**
     * Visualization renderer and helper functions
     */

    function _renderData(element, data, options) {

      // Cache dimensions and options
      var dimensions = element[0].getBoundingClientRect();
      var expanded = options.expanded;
      var labelUnit = options.labelUnit;
      var showFiltered = options.showFiltered;

      if (dimensions.width <= 0 || dimensions.height <= 0) {
        return;
      }

      if (expanded) {
        _chartElement.addClass('expanded');
      } else {
        _chartElement.removeClass('expanded');
      }

      if (showFiltered) {
        _chartWrapper.addClass('filtered');
      } else {
        _chartWrapper.removeClass('filtered');
      }

      /**
       * Implementation begins here
       */

      var topMargin = 0; // Set to zero so .card-text could control padding b/t text & visualization
      var bottomMargin; // Calculated based on label text length
      var horizontalScrollbarHeight = 0;//15; // used to keep horizontal scrollbar within .card-visualization upon expand
      var numberOfDefaultLabels = expanded ? data.length : 3;
      var maximumBottomMargin = 140;
      var d3Selection = d3.select(_chartWrapper.get(0));
      var barGroupSelection = d3Selection.selectAll('.bar-group').data(data, function(d) { return d[NAME_INDEX]; });
      var labelSelection = d3.select(_chartLabels[0]).selectAll('.label');
      var chartWidth = dimensions.width;
      var chartTruncated = false;
      var truncationMarkerWidth = _truncationMarker.width();
      var fixedLabelWidth = 10.5;

      // Compute chart margins
      if (expanded) {

        var maxLength = _.max(data.map(function(item) {
          // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
          return _labelValueOrPlaceholder(item[NAME_INDEX]).visualLength('1rem');
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
            text: socrata.utils.formatNumber(tick)
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
        //  - Selected labels. Contains the names of columns which are selected.
        var defaultLabelData = _.take(data, numberOfDefaultLabels);
        var selectedLabelData = data.filter(function(datum) { return datum[SELECTED_INDEX] === true; });
        var labelData = _.union(defaultLabelData, selectedLabelData);
        var labelOrientationsByIndex = [];

        if (selectedLabelData.length > 1) {
          throw new Error('Multiple selected labels not supported yet in column chart');
        }

        function isOnlyInSelected(datum, index) {
          return datum[SELECTED_INDEX] && index >= numberOfDefaultLabels;
        }

        function preComputeLabelOrientation(datum, index) {
          var leftHanded = false;

          if (!expanded) {
            var labelWidth = $(this).find('.contents').width();
            var proposedLeftOfText = horizontalScale(datum[NAME_INDEX]);

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
        var verticalPositionOfSelectedLabelRem = 2;
        var labelMargin = 0.75;
        var selectedLabelMargin = -0.4;

        var labelDivSelection = labelSelection.data(
          labelData,
          function (datum) { return datum[NAME_INDEX]; }
        );

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
              } else if (isOnlyInSelected(d, i)) {
                topOffset = verticalPositionOfSelectedLabelRem;
              } else {
                topOffset = defaultLabelData.length - 0.5 - Math.min(i, numberOfDefaultLabels - 1);
              }

              return '{0}rem'.format(topOffset);
            }).
            classed('undefined', function(d) {
              return _labelValueOrPlaceholder(d[NAME_INDEX]) === self.getLocalization('NO_VALUE');
            }).
            select('.text').
              text(function(d) {
                return _labelValueOrPlaceholder(d[NAME_INDEX]);
              });

        labelDivSelection.
          select('.callout').
            style('height', function(d, i) {

              // Expanded charts have auto-height labels.
              if (expanded) {
                return '';
              } else {
                if (isOnlyInSelected(d, i)) {
                  return verticalPositionOfSelectedLabelRem + 'rem';
                } else {
                  return (defaultLabelData.length - i - (d[SELECTED_INDEX] ? 0.75 : 0)) + 'rem';
                }
              }
            }).

            // Hide the '.callout' if there is no room for it
            style('display', function(d) {
              var scaleOffset = horizontalScale(d[NAME_INDEX]) - centering - 1;

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
            return selectedLabelData.length > 0 && !d[SELECTED_INDEX];
          }).
          classed('selected', function(d) { return d[SELECTED_INDEX]; }).
          each(function(d) {

            // Save references to all d3 selections.
            var labelSelection = d3.select(this);
            var labelContentSelection = labelSelection.select('.contents');
            var labelTextSelection = labelContentSelection.select('.text');

            var labelLeftOffset = 0;
            var labelRightOffset = 0;
            var labelContentLeftOffset;
            var labelContentRightOffset;
            var isSelected = d[SELECTED_INDEX];
            var scaleOffset = horizontalScale(d[NAME_INDEX]) - centering - 1;
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
              labelContentLeftOffset = selectedLabelMargin;
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

            if (!_.isUndefined(labelContentLeftOffset)) {
              labelContentSelection.style('left', '{0}rem'.format(labelContentLeftOffset));
            } else {
              labelContentSelection.style('left', '');
            }

            if (!_.isUndefined(labelContentRightOffset)) {
              labelContentSelection.style('right', '{0}px'.format(labelContentRightOffset));
            } else {
              labelContentSelection.style('right', '');
            }

            labelTextSelection.style('max-width', '{0}px'.format(textMaxWidth));
          });

        labelDivSelection.exit().remove();
      };

      var horizontalBarPosition = function(d) {
        return horizontalScale(d[NAME_INDEX]) - chartLeftOffset;
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
          var filtered = showFiltered ? d[FILTERED_INDEX] : 0;

          // Figure out if the totals bar is on top. This controls styling.
          var totalIsOnTop;
          if (d[UNFILTERED_INDEX] * filtered < 0) {
            // Opposite signs. Setting total on top by convention (makes styles easier).
            totalIsOnTop = true;
          } else {
            // Same sign.
            totalIsOnTop = Math.abs(d[UNFILTERED_INDEX]) >= Math.abs(filtered);
          }

          if (totalIsOnTop) {

            return [
              {
                isTotal: true,
                value: d[UNFILTERED_INDEX]
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
                value: d[UNFILTERED_INDEX]
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
          attr('data-bar-name', function(d) { return _labelValueOrPlaceholder(d[NAME_INDEX]); }).
          style('left', function(d) { return horizontalBarPosition(d) + 'px'; }).
          style('width', rangeBand + 'px').
          style('height', function() { return chartHeight + 'px'; }).
          classed('unfiltered-on-top', function(d) {
            // This is really confusing. In CSS, we refer to the total bar as the unfiltered bar.
            // If total bar is last in the dom, then apply this class.
            return makeBarData(d)[1].isTotal;
          }).
          classed('selected', function(d) { return d[SELECTED_INDEX]; }).
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
    }

    function _labelValueOrPlaceholder(value, placeholder) {

      var placeholderText = placeholder || self.getLocalization('NO_VALUE');
      var valueText;

      if ($.isNumeric(value)) {

        return value;

      } else if (_.isNaN(value)) {

        return placeholderText;

      }

      if (_.isBoolean(value)) {

        valueText = value.toString();

      }

      valueText = String(value) || '';

      return socrata.utils.valueIsBlank(valueText.trim().escapeSpaces()) ? placeholderText : valueText;
    }

    function _computeDomain(chartData, showFiltered) {

      var allData = chartData.map(function(d) { return d[UNFILTERED_INDEX]; }).concat(
        showFiltered ? chartData.map(function(d) { return d[UNFILTERED_INDEX]; }) : []
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
          [0, Math.ceil(rangeInterval)], barPadding).domain(chartData.map(function(d) { return d[NAME_INDEX]; })
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
  }

  window.socrata.visualizations.Column = Column;
})(window);

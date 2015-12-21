var $ = require('jquery');
var utils = require('socrata-utils');
var Visualization = require('./Visualization.js');
var _ = require('lodash');
var d3 = require('d3');

// TODO: Figure out how to do this better (and probably not through jQuery).
$.relativeToPx = function(rems) {
  var $div = $(document.createElement('div')).css('width', rems).appendTo(document.body);
  var width = $div.width();

  $div.remove();

  return width;
};

function ColumnChart(element, vif) {

  _.extend(this, new Visualization(element, vif));

  var self = this;

  var _chartElement;
  var _chartWrapper;
  var _chartScroll;
  var _chartLabels;

  var _truncationMarker;
  var _lastRenderOptions;

  var _truncationMarkerSelector = '.truncation-marker';
  var _barGroupAndLabelsSelector = '.bar-group, .labels .label .contents span:not(.icon-close), .labels .label .callout';
  var _nonDefaultSelectedLabelSelector = '.labels .label.selected.non-default';

  // TODO: Validate columns
  var NAME_INDEX = vif.configuration.columns.name;
  var UNFILTERED_INDEX = vif.configuration.columns.unfilteredValue;
  var FILTERED_INDEX = vif.configuration.columns.filteredValue;
  var SELECTED_INDEX = vif.configuration.columns.selected;

  var _interactive = vif.configuration.interactive;

  _renderTemplate(this.element);

  _attachEvents(this.element);

  /**
   * Public methods
   */

  this.render = function(data, options) {
    _lastRenderOptions = options;
    _renderData(_chartElement, data, options);
  };

  this.renderError = function() {
    // TODO: Some helpful error message.
  };

  this.destroy = function() {
    _detachEvents(this.element);
    this.element.find('.column-chart-container').remove();
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
    ).html('&raquo;');

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

    var chartContainer = $(
      '<div>',
      {
        'class': 'column-chart-container'
      }
    ).append(
      chartElement
    );

    self.renderAxisLabels(chartContainer);

    // Cache element selections
    _chartElement = chartElement;
    _chartWrapper = chartWrapper;
    _chartScroll = chartScroll;
    _chartLabels = chartLabels;
    _truncationMarker = truncationMarker;

    element.append(chartContainer);
  }

  function _attachEvents(element) {

    element.on(
      'mouseenter, mousemove',
      _barGroupAndLabelsSelector,
      showFlyout
    );

    element.on(
      'mouseleave',
      _barGroupAndLabelsSelector,
      hideFlyout
    );

    element.on(
      'mouseenter',
      _barGroupAndLabelsSelector,
      addHoverClassToBarGroup
    );

    element.on(
      'mouseleave',
      _barGroupAndLabelsSelector,
      removeHoverClassFromBarGroup
    );

    _chartElement.on(
      'mouseleave',
      removeHoverClassFromBarGroup
    );

    if (_interactive) {

      element.on(
        'click',
        _barGroupAndLabelsSelector,
        selectDatum
      );

      element.on(
        'click',
        _truncationMarkerSelector,
        expandVisualization
      );

      // We respond to mouseup in this case because if the user clicks to
      // clear a selection with a non-default label (i.e. not one of the first
      // three when not expanded), then we should dismiss the highlight.
      // (The 'non-default' class is applied to labels that wouldn't normally
      // be drawn unless a datum is selected)
      element.on(
        'mouseup',
        _nonDefaultSelectedLabelSelector,
        removeHoverClassFromBarGroup
      );
    }
  }

  function _detachEvents(element) {

    element.off(
      'mouseenter, mousemove',
      _barGroupAndLabelsSelector,
      showFlyout
    );

    element.off(
      'mouseleave',
      _barGroupAndLabelsSelector,
      hideFlyout
    );

    element.off(
      'mouseenter',
      _barGroupAndLabelsSelector,
      addHoverClassToBarGroup
    );

    element.off(
      'mouseleave',
      _barGroupAndLabelsSelector,
      removeHoverClassFromBarGroup
    );

    _chartElement.off(
      'mouseleave',
      removeHoverClassFromBarGroup
    );

    if (_interactive) {

      element.off(
        'click',
        _barGroupAndLabelsSelector,
        selectDatum
      );

      element.off(
        'click',
        _truncationMarkerSelector,
        expandVisualization
      );

      element.off(
        'mouseup',
        _nonDefaultSelectedLabelSelector,
        removeHoverClassFromBarGroup
      );
    }
  }

  function selectDatum(event) {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_SELECTION',
      {
        name: d3.select(event.currentTarget).datum()[NAME_INDEX]
      }
    );
  }

  function expandVisualization() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_EXPANSION',
      {
        expanded: true
      }
    );
  }

  function showFlyout(event) {
    var datum = d3.select(event.currentTarget).datum();
    var barGroupName = _toEscapedString(datum[NAME_INDEX]);
    var barGroupElement = _chartWrapper.
      find('.bar-group').
      filter(function(index, element) { return element.getAttribute('data-bar-name') === barGroupName; }).
      find('.unfiltered').
      get(0);
    var unfilteredValueUnit;
    var filteredValueUnit;

    if (datum[UNFILTERED_INDEX] === 1) {

      unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit.one')) ?
        _lastRenderOptions.unit.one :
        vif.unit.one;

    } else {

      unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit.other')) ?
        _lastRenderOptions.unit.other :
        vif.unit.other;

    }

    if (datum[FILTERED_INDEX] === 1) {

      filteredValueUnit = (_.has(_lastRenderOptions, 'unit.one')) ?
        _lastRenderOptions.unit.one :
        vif.unit.one;

    } else {

      filteredValueUnit = (_.has(_lastRenderOptions, 'unit.other')) ?
        _lastRenderOptions.unit.other :
        vif.unit.other;

    }

    var payload = {
      element: barGroupElement,
      title: _labelValueOrPlaceholder(datum[NAME_INDEX]),
      unfilteredValueLabel: self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL'),
      unfilteredValue: '{0} {1}'.format(
        utils.formatNumber(datum[UNFILTERED_INDEX]),
        unfilteredValueUnit
      ),
      selectedNotice: self.getLocalization('FLYOUT_SELECTED_NOTICE'),
      selected: datum[SELECTED_INDEX]
    };

    if (_lastRenderOptions.showFiltered) {

      payload.filteredValueLabel = self.getLocalization('FLYOUT_FILTERED_AMOUNT_LABEL');
      payload.filteredValue = '{0} {1}'.format(
        utils.formatNumber(datum[FILTERED_INDEX]),
        filteredValueUnit
      );
    }

    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
      payload
    );
  }

  function hideFlyout() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
      null
    );
  }

  function addHoverClassToBarGroup(event) {
    var datum = d3.select(event.currentTarget).datum();
    var barName = _toEscapedString(datum[NAME_INDEX]);

    _chartWrapper.
      find('.bar-group').
      filter(function(index, element) { return element.getAttribute('data-bar-name') === barName; }).
      addClass('highlight');
  }

  function removeHoverClassFromBarGroup() {
    _chartWrapper.find('.bar-group').removeClass('highlight');
  }

  /**
   * Visualization renderer and helper functions
   */

  function _renderData(element, data, options) {

    // Cache dimensions and options
    var chartWidth = element.width();
    var chartHeight = element.height();
    var showAllLabels = options.showAllLabels;
    var showFiltered = options.showFiltered;

    if (chartWidth <= 0 || chartHeight <= 0) {
      if (window.console && window.console.warn) {
        console.warn('Aborted rendering column chart: chart width or height is zero.');
      }
      return;
    }

    if (showAllLabels) {
      _chartElement.addClass('show-all-labels');
    } else {
      _chartElement.removeClass('show-all-labels');
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
    var horizontalScrollbarHeight = 15; // used to keep horizontal scrollbar within .card-visualization
    var numberOfDefaultLabels = showAllLabels ? data.length : 3;
    var maximumBottomMargin = 140;
    var d3Selection = d3.select(_chartWrapper.get(0));
    // The `_.property(NAME_INDEX)` below is equivalent to `function(d) { return d[NAME_INDEX]; }`
    var barGroupSelection = d3Selection.selectAll('.bar-group').data(data, _.property(NAME_INDEX));
    var labelSelection = d3.select(_chartLabels[0]).selectAll('.label');
    var chartTruncated = false;
    var truncationMarkerWidth = _truncationMarker.width();
    var fixedLabelWidth = 15.5;

    var horizontalScaleDetails = _computeHorizontalScale(chartWidth, data, showAllLabels);
    var horizontalScale = horizontalScaleDetails.scale;
    chartTruncated = horizontalScaleDetails.truncated;
    var rangeBand = Math.ceil(horizontalScale.rangeBand());
    var chartScrollTop = _chartScroll.offset().top - element.offset().top;

    // Compute chart margins
    if (showAllLabels) {

      var maxLength = _.max(data.map(function(item) {
        // The size passed to visualLength() below relates to the width of the div.text in the updateLabels().
        return _labelValueOrPlaceholder(item[NAME_INDEX]).visualLength('1rem');
      }));
      bottomMargin = Math.floor(Math.min(
        maxLength + $.relativeToPx('1rem'),
        $.relativeToPx(fixedLabelWidth + 1 + 'rem')
      ) / Math.sqrt(2));

      chartTruncated = false;

    } else {

      bottomMargin = $.relativeToPx(numberOfDefaultLabels + 1 + 'rem');

      // Do not compensate for chart scrollbar if only showing 3 labels (scrollbar would not exist)
      horizontalScrollbarHeight = 0;
    }

    // Clamp the bottom margin to a reasonable maximum since long labels are ellipsified.
    bottomMargin = bottomMargin > maximumBottomMargin ? maximumBottomMargin : bottomMargin;

    var innerHeight = Math.max(0, chartHeight - topMargin - bottomMargin - horizontalScrollbarHeight);

    // If not all labels are visible, limit our vert scale computation to what's actually
    // visible. We still render the bars outside the viewport to speed up horizontal resizes.
    var chartDataRelevantForVerticalScale = showAllLabels ?
      data : _.take(data, Math.ceil(chartWidth / rangeBand) + 1);
    var verticalScale = _computeVerticalScale(innerHeight, chartDataRelevantForVerticalScale, showFiltered);

    var chartLeftOffset = horizontalScale.range()[0];
    var chartRightEdge = chartWidth - chartLeftOffset;

    _chartWrapper.css('height', innerHeight + topMargin + 1);
    _chartScroll.css({
      'padding-top': 0,
      'padding-bottom': bottomMargin,
      'top': 'initial',
      'width': chartWidth,
      'height': innerHeight + topMargin + horizontalScrollbarHeight
    });

    var _renderTicks = function() {

      // The `+ 3` term accounts for the border-width.
      var tickHeight = parseInt(element.css('font-size'), 10) + 3;

      var numberOfTicks = 3;

      var tickMarks = _.uniq([0].concat(verticalScale.ticks(numberOfTicks))).map(function(tickValue) {

        var tick = $('<div>', {
          'class': tickValue === 0 ? 'tick origin' : 'tick',
          text: socrata.utils.formatNumber(tickValue)
        });

        var tickTopOffset = innerHeight - verticalScale(tickValue);
        if (tickTopOffset <= tickHeight) {
          tick.addClass('below');
          tickTopOffset += tickHeight;
        }

        tick.attr('style', 'top: {0}px'.format(tickTopOffset));

        return tick;
      });

      var ticksStyle = 'top: {0}px; width: {1}px; height: {2}px;'.format(
        chartScrollTop + topMargin,
        chartWidth,
        innerHeight + topMargin
      );

      return $('<div>', {
        'class': 'ticks',
        'style': ticksStyle
      }).append(tickMarks);
    };

    var updateLabels = function(labelSelection) {

      /**
       * Labels come in two sets of column names:
       *
       * - Default labels. If showAllLabels is true, this consists of one
       *   label per bar. Otherwise, only 3 labels are shown.
       *
       * - Selected labels. Contains the names of columns which are selected.
       */
      var defaultLabelData = _.take(data, numberOfDefaultLabels);
      var selectedLabelData = data.filter(
        function(datum) {
          return datum[SELECTED_INDEX] === true;
        }
      );
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

        if (!showAllLabels) {

          var labelWidth = $(this).find('.contents').width();
          var proposedLeftOfText = horizontalScale(datum[NAME_INDEX]);

          var rangeMagnitude = (chartRightEdge - chartLeftOffset);

          var spaceAvailableOnLeft = (proposedLeftOfText - chartLeftOffset);

          var spaceAvailableOnRight = rangeMagnitude -
            proposedLeftOfText -
            chartLeftOffset;

          var spaceRemainingOnRight = (spaceAvailableOnRight - labelWidth);

          leftHanded = (spaceRemainingOnRight <= 10) &&
            (spaceAvailableOnLeft > spaceAvailableOnRight);
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
      var labelMargin = showAllLabels ? 0 : 0.75;
      var selectedLabelMargin = -0.4;
      // The `_.property(NAME_INDEX)` below is equivalent to `function(d) { return d[NAME_INDEX]; }`
      var labelDivSelection = labelSelection.data(labelData, _.property(NAME_INDEX));

      var labelDivSelectionEnter = labelDivSelection.
        enter().
        append('div').
        classed('label', true).
        classed('non-default', isOnlyInSelected).
        attr('data-bar-name', function(d) {
          return _toEscapedString(_labelValueOrPlaceholder(d[NAME_INDEX]));
        });

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

            if (showAllLabels) {
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

            // Slanted labels have auto height.
            if (showAllLabels) {
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

          var $this = $(this);

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
          var noRoomForCallout = scaleOffset >= chartWidth && isSelected && !showAllLabels;
          var leftOriented = $this.hasClass('orientation-left');
          var labelIconPadding = 30;
          var halfWidthOfCloseIcon;
          var textMaxWidth;
          var labelSelectionStyle;
          var desiredLabelContentLeft = '';
          var desiredLabelContentRight = '';
          var labelTextSelectionStyle;

          // Logic for setting label and content offsets and text max widths.
          if (showAllLabels || !isSelected) {
            labelLeftOffset = scaleOffset;
            labelContentLeftOffset = labelMargin;
          } else if (leftOriented) {
            halfWidthOfCloseIcon = ($this.find('.icon-close').width() / 2) - 1;
            labelRightOffset = chartRightEdge - scaleOffset;
            labelContentRightOffset = -halfWidthOfCloseIcon;
            textMaxWidth = scaleOffset - labelIconPadding;
          } else {
            labelLeftOffset = scaleOffset;
            labelContentLeftOffset = selectedLabelMargin;
            textMaxWidth = chartWidth - scaleOffset - labelIconPadding;
          }

          if (!isSelected && !showAllLabels) {
            textMaxWidth = chartWidth - scaleOffset - labelIconPadding;
          }

          if (noRoomForCallout) {
            labelRightOffset = 0;
            labelContentLeftOffset = 0;
            labelContentRightOffset = 0;
            textMaxWidth = chartWidth - labelIconPadding;
          }

          // Apply styles
          labelSelectionStyle = 'left: {0}px; right: {1}px;'.format(labelLeftOffset, labelRightOffset);
          if (labelSelection.attr('style') !== labelSelectionStyle) {
            labelSelection.attr('style', labelSelectionStyle);
          }

          if (!_.isUndefined(labelContentLeftOffset)) {
            desiredLabelContentLeft = '{0}rem'.format(labelContentLeftOffset);
          }

          if (!_.isUndefined(labelContentRightOffset)) {
            desiredLabelContentRight = '{0}px'.format(labelContentRightOffset);
          }

          // Calls to .style() in this section were costing about 150ms per render,
          // even if nothing changed about the style.
          // We need to avoid even calling .style() if nothing changed. We accomplish
          // this by storing details of the last-rendered style in data attributes,
          // which are fast to read.
          if (labelContentSelection.attr('data-left') !== desiredLabelContentLeft) {
            labelContentSelection.style('left', desiredLabelContentLeft);
            labelContentSelection.attr('data-left', desiredLabelContentLeft);
          }
          if (labelContentSelection.attr('data-right') !== desiredLabelContentRight) {
            labelContentSelection.style('right', desiredLabelContentRight);
            labelContentSelection.attr('data-right', desiredLabelContentRight);
          }

          labelTextSelectionStyle = 'max-width: {0}px;'.format(textMaxWidth);

          if (labelTextSelection.attr('style') !== labelTextSelectionStyle) {
            labelTextSelection.attr('style', labelTextSelectionStyle);
          }
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
        attr('data-bar-name', function(d) {
          return _toEscapedString(_labelValueOrPlaceholder(d[NAME_INDEX]));
        }).
        style('left', function(d) { return horizontalBarPosition(d) + 'px'; }).
        style('width', rangeBand + 'px').
        style('height', function() { return innerHeight + 'px'; }).
        classed('unfiltered-on-top', function(d) {
          // This is really confusing. In CSS, we refer to the total bar as the unfiltered bar.
          // If total bar is last in the dom, then apply this class.
          return makeBarData(d)[1].isTotal;
        }).
        classed('selected', function(d) { return d[SELECTED_INDEX]; }).
        classed('active', function(d) { return showAllLabels || horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; });

      // Update the position of the individual bars.
      bars.
        style('width', rangeBand + 'px').
        style('height', function(d) {

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
      top: innerHeight,
      display: chartTruncated ? 'block' : 'none'
    });
  }

  // To string and escape backslashes and quotes
  function _toEscapedString(value) {
    return String(value).
      replace(/\\/g, '\\\\').
      replace(/"/g, '\\\"');
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

    return socrata.utils.valueIsBlank(valueText.trim().escapeSpaces()) ?
      placeholderText :
      valueText;
  }

  function _computeDomain(chartData, showFiltered) {

    var allData = chartData.map(function(d) { return d[UNFILTERED_INDEX]; }).concat(
      (showFiltered) ?
        chartData.map(function(d) { return d[FILTERED_INDEX]; }) :
        []
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

  function _computeVerticalScale(innerHeight, chartData, showFiltered) {
    return d3.scale.linear().domain(_computeDomain(chartData, showFiltered)).range([0, innerHeight]);
  }

  function _computeHorizontalScale(chartWidth, chartData, showAllLabels) {

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

    if (showAllLabels) {
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

    /**
     * According to the D3 API reference for Ordinal Scales#rangeBands
     * (https://github.com/mbostock/d3/wiki/Ordinal-Scales#ordinal_rangeBands):
     *
     * For the method `ordinal.rangeBands(barWidth[, barPadding[, outerPadding]]) = rangeInterval`
     * `barPadding` corresponds to the amount of space in the `rangeInterval` as a percentage of
     * `rangeInterval` (width in px):
     *
     * => rangeInterval = barPadding * rangeInterval + numberOfBars * barWidth
     * => (1 - barPadding) * rangeInterval = numberOfBars * barWidth
     * => rangeInterval = (numberOfBars * barWidth) / (1 - barPadding)
     */
    if (rangeBand < minBarWidth) {
      // --> desired rangeBand (bar width) is less than accepted minBarWidth
      // use computeChartDimensionsForRangeInterval to set rangeBand = minBarWidth
      // and update horizontalScale accordingly
      _computeChartDimensionsForRangeInterval(minBarWidth * numberOfBars / (1 - barPadding));
      isChartTruncated = true;
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

module.exports = ColumnChart;

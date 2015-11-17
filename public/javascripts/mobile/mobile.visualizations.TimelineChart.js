(function(root) {
  'use strict';

  var utils = root.socrata.utils;

  var Constants = {
    'TIMELINE_CHART_MARGIN': {
      'TOP': 0,
      'RIGHT': 0,
      'BOTTOM': 30,
      'LEFT': 0
    },
    'TIMELINE_CHART_NUMBER_OF_TICKS': 3,
    'TIMELINE_CHART_TICK_SIZE': 3,
    'TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN': 50,
    'TIMELINE_CHART_GUTTER': 15,
    'TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET': 11,
    'TIMELINE_CHART_DRAG_HANDLE_WIDTH': 24,
    'TIMELINE_CHART_MIN_LABEL_WIDTH': 150,
    'TIMELINE_CHART_REQUIRED_LABEL_WIDTH': 50
  };

  var DateHelpers = {
    serializeFloatingTimestamp: utils.serializeFloatingTimestamp,
    deserializeFloatingTimestamp: utils.deserializeFloatingTimestamp,
    decrementDateByHalfInterval: function(date, interval) {

      var newDate;

      switch (interval.toUpperCase()) {
        case 'DECADE':
          newDate = moment(date).subtract(5, 'year').toDate();
          break;
        case 'YEAR':
          newDate = moment(date).subtract(6, 'month').toDate();
          break;
        case 'MONTH':
          newDate = moment(date).subtract(15, 'day').toDate();
          break;
        case 'DAY':
          newDate = moment(date).subtract(12, 'hour').toDate();
          break;
        default:
          throw new Error(
            'Cannot decrement date by dataset precision: invalid interval "{0}"'.
            format(interval)
          );
      }

      return newDate;
    },

    incrementDateByHalfInterval: function(date, interval) {

      var newDate;

      switch (interval.toUpperCase()) {
        case 'DECADE':
          newDate = moment(date).add(5, 'year').toDate();
          break;
        case 'YEAR':
          newDate = moment(date).add(6, 'month').toDate();
          break;
        case 'MONTH':
          newDate = moment(date).add(15, 'day').toDate();
          break;
        case 'DAY':
          newDate = moment(date).add(12, 'hour').toDate();
          break;
        default:
          throw new Error(
            'Cannot increment date by dataset precision: invalid interval "{0}"'.
            format(interval)
          );
      }

      return newDate;

    }
  };

  if (!_.has(root, 'socrata.visualizations.Visualization')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.Visualization.js',
          'socrata.visualizations.TimelineChart.js'
        )
    );
  }

  if (!_.has(root, 'd3')) {
    throw new Error('d3 is a required dependency for `socrata.visualizations.TimelineChart.js`.');
  }

  /*
  KNOWN BUGS

  1. The heuristic by which we decide when to display only some labels is
     pretty neat.

  TERMINOLOGY

  'selection' is the yellow region when the visualization is being filtered.
  'highlight' is the white region that follows the cursor.
  'filter' is the mechanism by which queries are altered.
  */

  function TimelineChart(element, vif) {

    _.extend(this, new root.socrata.visualizations.Visualization(element, vif));

    var self = this;

    utils.assertHasProperty(vif, 'configuration');

    var _chartContainer;
    var _chartElement;
    var _chartWrapper;
    var _chartScroll;
    var _chartLabels;
    var _chartTopAxisLabel;
    var _chartRightAxisLabel;
    var _chartBottomAxisLabel;
    var _chartLeftAxisLabel;

    var _lastRenderOptions;

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
      _unattachEvents(this.element);
    };

    /**
     * Private methods
     */

    function _renderTemplate(element, axisLabels) {

      function divWithClass(clsName) {
        return $(
          '<div>',
          {
            'class': clsName
          }
        );
      }

      function $xml(namespace, nodeName, attributeMap) {
        var xmlNode = document.createElementNS(namespace, nodeName);
        _.each(attributeMap, function(value, key) {
          xmlNode.setAttributeNS(null, key, value);
        });
        return $(xmlNode);
      }

      function $svg(nodeName, attributeMap) {
        return $xml('http://www.w3.org/2000/svg', nodeName, attributeMap);
      }

      function svgWithClass(clsName) {
        return $svg(
          'svg',
          {
            'class': clsName
          }
        ).append(
          $svg('g')
        );
      }

      var yTicks = divWithClass('y-ticks');
      var xTicks = divWithClass('x-ticks');
      var datumLabel = divWithClass('datum-label');
      var timelineUnfilteredMask = divWithClass('timeline-chart-unfiltered-mask').
        append(svgWithClass('timeline-chart-unfiltered-visualization'));
      var timelineFilteredMask = divWithClass('timeline-chart-filtered-mask').
        append(svgWithClass('timeline-chart-filtered-visualization'));
      var timelineSelectionMask = divWithClass('timeline-chart-selection-mask').
        append(svgWithClass('timeline-chart-selection'));

      var leftSelectionLine = $svg(
        'line',
        {
          'y1': '0',
          'y2': '100%'
        }
      );
      var leftSelectionTriangle = $svg(
        'path',
        {
          'd': 'M0,0L-10,0L-10,8L0,16Z'
        }
      );
      var leftSelectionRect = $svg(
        'rect',
        {
          'class': 'selection-marker',
          'data-selection-target': 'left',
          'x': '-24',
          'width': '24',
          'height': '100%'
        }
      );

      var leftSelectionGroup = $svg(
        'g'
      ).append([
        leftSelectionLine,
        leftSelectionTriangle,
        leftSelectionRect
      ]);

      var leftSelectionSvg = $svg('svg').append(leftSelectionGroup);
      var leftSelectionMarker = divWithClass('timeline-chart-left-selection-marker').
        append(leftSelectionSvg);

      var rightSelectionLine = $svg(
        'line',
        {
          'y1': '0',
          'y2': '100%'
        }
      );
      var rightSelectionTriangle = $svg(
        'path',
        {
          'd': 'M0,0L10,0L10,8L0,16Z'
        }
      );
      var rightSelectionRect = $svg(
        'rect',
        {
          'class': 'selection-marker',
          'data-selection-target': 'right',
          'x': '0',
          'width': '24',
          'height': '100%'
        }
      );

      var rightSelectionGroup = $svg(
        'g',
        {
          'transform': 'translate(0,0)'
        }
      ).append([
        rightSelectionLine,
        rightSelectionTriangle,
        rightSelectionRect
      ]);

      var rightSelectionSvg = $svg('svg').append(rightSelectionGroup);
      var rightSelectionMarker = divWithClass('timeline-chart-right-selection-marker').
        append(rightSelectionSvg);

      var timelineHighlightContainer = svgWithClass('timeline-chart-highlight-container');
      var timelineHighlightTarget = divWithClass('timeline-chart-highlight-target');
      var timelineClearSelectionLabel = $(
        '<span>',
        {
          'class': 'timeline-chart-clear-selection-label'
        }
      );

      var chartWrapper = $(
        '<div>',
        {
          'class': 'timeline-chart-wrapper'
        }
      ).append([
        yTicks,
        xTicks,
        datumLabel,
        timelineUnfilteredMask,
        timelineFilteredMask,
        timelineSelectionMask,
        leftSelectionMarker,
        rightSelectionMarker,
        timelineHighlightContainer,
        timelineHighlightTarget,
        timelineClearSelectionLabel
      ]);

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
          'class': 'timeline-chart'
        }
      ).append(chartScroll);

      var chartContainer = $(
        '<div>',
        {
          'class': 'timeline-chart-container'
        }
      ).append(
        chartElement
      );

      self.renderAxisLabels(chartContainer);

      // Cache element selections
      _chartContainer = chartContainer;
      _chartElement = chartElement;
      _chartWrapper = chartWrapper;
      _chartScroll = chartScroll;
      _chartLabels = chartLabels;

      element.append(chartContainer);
    }

    function _attachEvents(element) {
      element.on(
        'click',
        '.timeline-chart',
        showFlyout
      );
    }

    function _unattachEvents(element) {
      element.off(
        'click',
        '.timeline-chart',
        showFlyout
      );
    }

    /**
     * Visualization renderer and helper functions
     */

    function showFlyout(event) {
      mouseHasMoved(event, false);
      var flyoutTarget = _chartElement.find('.timeline-chart-flyout-target');

      if (flyoutTarget.length === 0) {
        return;
      }

      var $target = $(event.target);
      var isInterval = $target.
        is(flyoutIntervalTopSelectors.concat([flyoutIntervalPathSelector]).join(', '));
      var datumIsDefined = !(_.isUndefined(currentDatum) || _.isNull(currentDatum));

      var payload = {
        element: flyoutTarget.get(0),
        unfilteredValueLabel: self.getLocalization('FLYOUT_UNFILTERED_AMOUNT_LABEL')
      };

      var formatStrings = {
        DECADE: 'YYYYs',
        YEAR: 'YYYY',
        MONTH: 'MMMM YYYY',
        DAY: 'D MMMM YYYY'
      };

      var renderUnit = function(value, rules) {
        utils.assertHasProperty(rules, 'other');
        if (_.isNull(value)) {
          return 'No value';
        }

        value = Number(value);
        utils.assert(!_.isNaN(value));

        var resolve = function(rule) {
          return '{0} {1}'.format(utils.formatNumber(value), rule);
        };

        if (value === 1 && rules.one) {
          return resolve(rules.one);
        } else {
          return resolve(rules.other);
        }
      };

      var unfilteredValueUnit = (_.has(_lastRenderOptions, 'unit')) ?
        _lastRenderOptions.unit :
        vif.unit;

      if (isInterval) {
        payload.title = $target.attr('data-flyout-label');
        var unfilteredValue = $target.attr('data-aggregate-unfiltered');
        payload.unfilteredValue = renderUnit(unfilteredValue, unfilteredValueUnit);
        //var filteredValue = $target.attr('data-aggregate-filtered');
        //payload.filteredValue = _.isUndefined(filteredValue) ? null : parseFloat(filteredValue);
      } else if (datumIsDefined) {
        payload.title = currentDatum.hasOwnProperty('flyoutLabel') ?
          currentDatum.flyoutLabel :
          moment(currentDatum.date).format(formatStrings[datasetPrecision]);
        payload.unfilteredValue = renderUnit(currentDatum.unfiltered, unfilteredValueUnit);
        //payload.filteredValue = currentDatum.filtered;
      };

      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        payload
      );
    }

    function hideFlyout(event) {
      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        null
      );
    }

    // Cache a bunch of stuff that is useful in a lot of places that don't
    // need to be wrapped in Rx mojo.
    var cachedChartDimensions = null;
    var cachedChartData = null;
    var cachedRowDisplayUnit = null;

    // Keep track of whether or not the mouse position is within this
    // instance of a timeline chart's visualization area (the chart itself
    // and the x-axis labels beneath it).
    var mousePositionWithinChartElement = false;
    var mousePositionWithinChartDisplay = false;
    var mousePositionWithinChartLabels = true;

    // These two values are in pixels.
    var visualizedDatumWidth = 0;
    var halfVisualizedDatumWidth = 0;

    // currentDatum is used to persist information about the highlighted
    // region between the filterChartData and flyout rendering functions.
    var currentDatum = null;

    // datasetPrecision is used in multiple places in order to test and
    // modify dates, but we only really have a notion of it within the
    // context of Rx reactions; for this reason it's cached globally.
    var datasetPrecision = null;

    var labelPrecision = null;

    // The X and Y scales that d3 uses are global to the directive so
    // that we can use the same ones between the renderChart and
    // renderChartHighlight functions.
    // They are initialized to null so that we don't accidentally try
    // to render a highlight before a chart is rendered.
    var d3XScale = null;
    var d3YScale = null;

    // The following cached jQuery/d3 selectors are used throughout the
    // directive.
    var $body = $('body');
    var $chartElement = _chartElement.find('.timeline-chart-wrapper');
    var $highlightTargetElement = _chartElement.find('.timeline-chart-highlight-target');
    var $chartSelectionElement = _chartElement.find('.timeline-chart-selection');
    var $leftSelectionMarker = _chartElement.find('.timeline-chart-left-selection-marker');
    var $rightSelectionMarker = _chartElement.find('.timeline-chart-right-selection-marker');
    var $clearSelectionLabel = _chartElement.find('.timeline-chart-clear-selection-label');
    var $datumLabel = _chartElement.find('.datum-label');
    var d3ChartElement = d3.select($chartElement[0]);

    // Keep track of the start and end of the selection.
    var selectionStartDate = null;
    var selectionEndDate = null;

    var selectionIsCurrentlyRendered = false;

    // Keep track of whether or not this instance of a timeline chart is in
    // the 'dragging' state so that we can selectively listen for mouseup
    // and apply the 'goalpost' selection area.
    var currentlyDragging = false;
    
    var allChartLabelsShown = true;

    var flyoutIntervalPathSelector = '.datum-label';
    var flyoutIntervalTopSelectors = [
      '.x-tick-label',
      '.timeline-chart-clear-selection-label'
    ];

    function _renderData(element, data, options) {

      // Cache dimensions and options
      var chartWidth = element.width();
      var chartHeight = element.height();
      var showAllLabels = options.showAllLabels;
      var showFiltered = options.showFiltered;
      var precision = options.precision;
      var unit = options.unit;

      if (chartWidth <= 0 || chartHeight <= 0) {
        if (window.console && window.console.warn) {
          console.warn('Aborted rendering column chart: chart width or height is zero.');
        }
        return;
      }

      utils.assert(precision);

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


      // These rendering functions are generated by a helper due to their
      // high degree of similarity. The functions are decoupled so that we
      // can independently update and manipulate the filtered values as
      // selections are made.
      var renderChartUnfilteredValues = generateChartValueRenderer({
        valueTransformer: function(values) {
          return [transformValuesForRendering(values)];
        },
        ySelector: function(d) { return d3YScale(d.unfiltered); },
        svgSelector: 'svg.timeline-chart-unfiltered-visualization',
        areaClass: 'context',
        lineClass: 'context-trace'
      });

      var renderChartFilteredValues = generateChartValueRenderer({
        valueTransformer: function(values) {
          if (selectionIsCurrentlyRendered) {
            return [];
          } else {
            return [transformValuesForRendering(values)];
          }
        },
        ySelector: function(d) { return d3YScale(d.filtered); },
        svgSelector: 'svg.timeline-chart-filtered-visualization',
        areaClass: 'shaded',
        lineClass: 'shaded-trace'
      });

      // We use these two values to 'dirty check' changes
      // to selectionStartDate and selectionEndDate and
      // conditionally NOOP in the selection rendering
      // code if what would be rendered has not changed.
      var renderedSelectionStartDate = null;
      var renderedSelectionEndDate = null;

      var mouseLeftButtonChangesSubscription;
      var mouseMoveOrLeftButtonChangesSubscription;

      /**
       * Because we want the points representing aggregation values to fall
       * between ticks but the highlight edges and ticks to straddle the
       * points representing aggregation values we need to create synthetic
       * points one-half of a <datasetPrecision> interval at the beginning
       * and end of a series of values we plan to render.
       *
       * If leadingValue and/or trailingValue is falsey then this function
       * will extend the first and/or last actual point's value to these
       * synthetic points.
       *
       * Otherwise (currently only in the case of rendering the chart
       * selection) leadingValue will be used for the value of the leading
       * synthetic point and trailingValue will be used for the value of the
       * trailing synthetic point. This allows the chart selection to mimic
       * d3's interpolation between points so that the selection's contour
       * tracks that of the unfiltered values rendered behind it rather than
       * extending levelly from the first and last actual selection values.
       *
       * @param {Array} values - The array of values to transform.
       * @param {Number} leadingValue - The optional value to use for the
       *                                leading half-<datasetPrecision>
       *                                point.
       * @param {Number} trailingValue - The optional value to use for the
       *                                 trailing half-<datasetPrecision>
       *                                 point.
       * @return {Array} An array containing the query response data with
       *                 additional points one-half of a dataset precision
       *                 unit before the first and after the last datum in
       *                 order for the visualization to span the full
       *                 available width while also placing individual points
       *                 between ticks.
       */
      function transformValuesForRendering(
        values,
        leadingValue,
        trailingValue) {

        var outputValues = [];
        var i;

        for (i = 0; i < values.length; i++) {
          var datum = _.pick(values[i], ['date', 'filtered', 'unfiltered']);
          var prevDatum = values[i - 1];
          var nextDatum = values[i + 1];
          var dateNudge;

          /**
           * If this datum is the first value or if there is a discontinuity
           * to the left of this datum, add a synthetic half-step left.
           */
          if (_.isUndefined(prevDatum) || _.isNull(prevDatum.unfiltered)) {
            dateNudge = DateHelpers.decrementDateByHalfInterval(
              datum.date,
              datasetPrecision
            );
            outputValues.push(_.extend(_.clone(datum), { date: dateNudge }));
          }

          /**
           * Always add the datum.
           */
          outputValues.push(datum);

          /**
           * If this datum is the last value or if there is a discontinuity
           * to the right of this datum, add a synthetic half-step right.
           */
          if (_.isUndefined(nextDatum) || _.isNull(nextDatum.unfiltered)) {
            dateNudge = DateHelpers.incrementDateByHalfInterval(
              datum.date,
              datasetPrecision
            );
            outputValues.push(_.extend(_.clone(datum), { date: dateNudge }));
          }
        }

        /**
         * Override the leading and trailing values if requested.
         */
        if (leadingValue) {
          _.first(outputValues).filtered = leadingValue;
          _.first(outputValues).unfiltered = leadingValue;
        }

        if (trailingValue) {
          _.last(outputValues).filtered = trailingValue;
          _.last(outputValues).unfiltered = trailingValue;
        }

        return outputValues;
      }




      /**
       * Similar to formatDateLabel but for ranges instead of discrete dates.
       *
       * @param {Date} startDate
       * @param {Date} endDate
       * @return {String} The formatteddate.
       */
      function formatDateRangeLabel(startDate, endDate) {

        function numberOfMonthsDifferent(date1, date2) {
          return moment(date2).diff(moment(date1), 'months', false);
        }

        function datesAreExactlyOneMonthDifferent(date1, date2) {
          var exactlyOneMonthDifferent = true;

          if (date2.getFullYear() !== date1.getFullYear() ||
            date2.getMonth() - 1 !== date1.getMonth() ||
            date2.getDate() !== date1.getDate()) {

            exactlyOneMonthDifferent = false;
          }
          return exactlyOneMonthDifferent;
        }

        // This is the expected behavior: an interval of exactly two months
        // should read 'Jan - Feb'.
        var adjustedEndDate = DateHelpers.decrementDateByHalfInterval(endDate, datasetPrecision);
        var difference;
        var dateFormatPrecision;
        var showRange = true;
        var formattedStartDate;
        var formattedEndDate;
        var label;

        switch (labelPrecision) {

          case 'DECADE':
            difference = endDate.getFullYear() - startDate.getFullYear();
            // We should not show a range if only a single year is selected.
            // Similarly, we should show exact years if the selection does
            // not fall on exact decade-by-decade boundaries. Otherwise, we
            // should show a decade-specific range, e.g. '1930s - 1940s'.
            if (difference === 10 && (startDate.getFullYear() % 10 === 0)) {
              showRange = false;
            } else if (startDate.getFullYear() % 10 !== 0 || endDate.getFullYear() % 10 !== 0) {
              dateFormatPrecision = 'YEAR';
            }
            break;

          case 'YEAR':
            difference = numberOfMonthsDifferent(startDate, endDate);
            // We should still show the month-to-month label even if
            // the interval is exactly one year in the case that the
            // start date is not January--otherwise we see a 1-year
            // span that, e.g., starts in June 2000 and ends in June
            // 2001 still listed as '2000'.
            if (difference === 12 && startDate.getMonth() === 0) {
              showRange = false;
            } else {
              dateFormatPrecision = 'MONTH';
            }
            break;

          case 'MONTH':
            if (datesAreExactlyOneMonthDifferent(startDate, endDate) && startDate.getDate() === 1) {
              showRange = false;
            } else {
              dateFormatPrecision = 'DAY';
            }
            break;

          case 'DAY':
            difference = moment.duration(moment(endDate) - moment(startDate)).asDays();
            if (difference <= 1) {
              showRange = false;
            }
            break;

          default:
            break;

        }

        formattedStartDate = formatDateLabel(startDate, false, dateFormatPrecision);
        formattedEndDate = formatDateLabel(adjustedEndDate, false, dateFormatPrecision);

        if (showRange && (formattedStartDate !== formattedEndDate)) {
          label = '{0} - {1}'.format(formattedStartDate, formattedEndDate);
        } else {
          label = formattedStartDate;
        }

        return '{0} <span class="timeline-chart-clear-selection-button">×</span>'.format(label);

      }

      function renderChartSelection() {

        /**
         * This function will select the data points that fall between the
         * selection start and end dates and then create synthetic points one
         * half of a <datasetPrecision> unit before and after the selection.
         * This is to support the behavior that the point representing the
         * value of each interval is drawn in the center of the interval, not
         * on its left edge.
         *
         * The half <datasetPrecision> unit synthetic points must
         * furthermore have values that are interpolated between the first/
         * last actual data points and the points just before or after them,
         * so that the rendered selection mirrors the unfiltered data drawn
         * behind it.
         *
         * In the case that the selection starts at the beginning of the
         * overall data the first data point's value will be used instead.
         *
         * In the case that the selection ends at the end of the overall data
         * the last data point's value will be used instead.
         */
        function deriveSelectionValues(chartData, minDate, maxDate) {

          var lastChartDatum = _.last(chartData.values);
          var prevOutOfBoundsDatum = { filtered: null };
          var nextOutOfBoundsDatum = { filtered: null };
          var firstSelectionDatum = null;
          var lastSelectionDatum = null;
          var firstSelectionValueAmount = false;
          var lastSelectionValueAmount = false;
          var selectionValues = [];

          _.each(chartData.values, function(datum) {

            if (datum.date >= minDate && datum.date <= maxDate) {
              if (_.isNull(firstSelectionDatum)) {
                firstSelectionDatum = datum;
              }
              // Track the current datum as "beyond the end of the selection"
              // instead of "last in selection" because we chop off the last
              // value below!
              nextOutOfBoundsDatum = datum;
              selectionValues.push(datum);
            } else if (datum.date < minDate) {
              prevOutOfBoundsDatum = datum;
            } else if (datum.date > maxDate) {
              return false;
            }
          });

          // Drop the last selection value since they are all incremented
          // by half of a dataset precision unit, and the last value to
          // meet the date range criteria will actually be drawn outside
          // the range indicated by the x-axis ticks.
          // We could accomplish the same thing by looking ahead in the
          // above for loop, but throwing away the last value seemed easier
          // with regard to bounds checking and so forth.
          selectionValues.length = selectionValues.length - 1;

          // Because of the way the data is displayed, it is valid for a
          // selection to begin on the last datum and end on the last datum
          // + 1 <datasetPrecision> unit. Therefore we need to check to see
          // our selection's end date is after the last date in the actual
          // values and append a surrogate value to the filtered array with
          // an appropriate date to show as the end of the x scale.
          if (lastChartDatum.date < maxDate) {
            selectionValues.push(lastChartDatum);
          }

          // Only at this point can we define the true "last" datum.
          lastSelectionDatum = _.last(selectionValues);

          // If there is a non-null value immediately before the start of the
          // selection, then force the first value to be halfway between the
          // first selected datum and the preceding datum in order to keep the
          // line consistent.
          //
          // Otherwise leave firstSelectionValueAmount false and let
          // transformValuesForRendering choose how to extend the selection
          // area (which it will do if firstSelectionValueAmount is falsey).
          if (!_.isNull(prevOutOfBoundsDatum.filtered)) {
            firstSelectionValueAmount = (
              firstSelectionDatum.filtered + prevOutOfBoundsDatum.filtered
            ) / 2;
          }

          // If there is a non-null value immediately after the end of the
          // selection, then force the last value to be halfway between the
          // last selected datum and the following datum in order to keep the
          // line consistent.
          //
          // Otherwise leave lastSelectionValueAmount false and let
          // transformValuesForRendering choose how to extend the selection
          // area (which it will do if lastSelectionValueAmount is falsey).
          if (!_.isNull(nextOutOfBoundsDatum.filtered)) {
            lastSelectionValueAmount = (
              lastSelectionDatum.filtered + nextOutOfBoundsDatum.filtered
            ) / 2;
          }

          return transformValuesForRendering(
            selectionValues,
            firstSelectionValueAmount,
            lastSelectionValueAmount
          );
        }

        var minDate;
        var maxDate;
        var line;
        var area;
        var svgChart;
        var selection;
        var selectionStartPosition;
        var selectionEndPosition;
        var labelWidth;
        var minLabelWidth;
        var labelNegativeXOffset;
        var dateRangeLabel;
        var dateRangeFlyoutLabel;
        var labelLeftOffset;
        var labelRightPosition;
        var selectionDelta;
        var chartWidth;
        var chartHeight;
        var margin;
        var values;
        var transformedMinDate;
        var transformedMaxDate;
        var labelTextAlign;
        var dataAggregate;
        var unfilteredAggregate;
        var filteredAggregate;

        if (_.isNull(d3XScale) || _.isNull(d3YScale)) {
          return;
        }

        if (selectionStartDate < selectionEndDate) {
          minDate = selectionStartDate;
          maxDate = selectionEndDate;
        } else {
          minDate = selectionEndDate;
          maxDate = selectionStartDate;
        }

        if (!_.isNull(minDate) && !_.isNull(maxDate)) {

          // If the effective selection will not change because the selection
          // start and end dates have not changed, quit early.
          if (!_.isNull(renderedSelectionStartDate) &&
              !_.isNull(renderedSelectionEndDate) &&
              selectionStartDate.getTime() === renderedSelectionStartDate.getTime() &&
              selectionEndDate.getTime() === renderedSelectionEndDate.getTime()) {
            // Note that even if we are quitting early we still may need to
            // show the selection (since it may be possible that the same
            // interval was previously rendered but is now just hidden).
            $chartSelectionElement.show();
            return;
          }

          margin = Constants.TIMELINE_CHART_MARGIN;

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.LEFT - margin.RIGHT;
          chartHeight = cachedChartDimensions.height - margin.TOP - margin.BOTTOM;

          values = [
            deriveSelectionValues(cachedChartData, minDate, maxDate)
          ];

          // Reset minDate and maxDate to accurately reflect the 'half-way'
          // interpolated values created by transformValuesForRendering.
          transformedMinDate = _.first(values[0]).date;
          transformedMaxDate = _.last(values[0]).date;

          line = d3.
            svg.
            line().
            defined(function(d) { return !_.isNull(d.filtered); }).
            x(function(d) { return d3XScale(d.date); }).
            y(function(d) { return d3YScale(d.filtered); });

          area = d3.
            svg.
            area().
            defined(line.defined()).
            x(line.x()).
            y0(function(d) { return d3YScale(0); }).
            y1(line.y());

          svgChart = d3ChartElement.
            select('svg.timeline-chart-selection').
            attr('width', cachedChartDimensions.width).
            attr('height', cachedChartDimensions.height).
            select('g').
            attr('transform', 'translate(' + margin.LEFT + ',' + margin.TOP + ')');

          selection = svgChart.
            selectAll('path').
            data(values);

          selection.
            enter().
            append('path');

          selection.
            exit().
            remove();

          selection.
            attr('class', 'selection').
            attr('d', area);

          svgChart.
            append('path').
            data(values).
            attr('class', 'selection-trace').
            attr('d', line);

          selectionStartPosition = Math.floor(d3XScale(transformedMinDate));

          // Subtract one from the scaled and transformed maxDate in order to
          // prevent d3 from giving us a value that is outside the actual
          // element to which we are rendering.
          selectionEndPosition = Math.floor(d3XScale(transformedMaxDate)) - 1;

          $leftSelectionMarker.css(
            {
              left: selectionStartPosition -
                Constants.TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET -
                (Constants.TIMELINE_CHART_DRAG_HANDLE_WIDTH / 2),
              height: cachedChartDimensions.height - margin.TOP - margin.BOTTOM
            }
          );

          $rightSelectionMarker.css(
            {
              left: selectionEndPosition -
                Constants.TIMELINE_CHART_SELECTION_MARKER_NEGATIVE_X_OFFSET +
                (Constants.TIMELINE_CHART_DRAG_HANDLE_WIDTH / 2),
              height: cachedChartDimensions.height - margin.TOP - margin.BOTTOM
            }
          );

          labelWidth = Math.floor(d3XScale(transformedMaxDate) - d3XScale(transformedMinDate));
          minLabelWidth = Constants.TIMELINE_CHART_MIN_LABEL_WIDTH;
          labelNegativeXOffset = 0;

          if (labelWidth < minLabelWidth) {
            labelNegativeXOffset = (minLabelWidth - labelWidth) / 2;
            labelWidth = minLabelWidth;
          }

          dateRangeLabel = formatDateRangeLabel(minDate, maxDate);

          // Bounds-check the position of the label and keep it from
          // overflowing the card bounds
          labelLeftOffset = selectionStartPosition - labelNegativeXOffset;

          if (labelLeftOffset < -(Constants.TIMELINE_CHART_GUTTER)) {
            labelLeftOffset = -(Constants.TIMELINE_CHART_GUTTER);
          }

          labelRightPosition = labelLeftOffset + labelWidth;
          if (labelRightPosition > cachedChartDimensions.width) {
            selectionDelta = labelRightPosition - cachedChartDimensions.width;
            labelLeftOffset = labelLeftOffset -
              selectionDelta + Constants.TIMELINE_CHART_GUTTER;
          }

          labelTextAlign = 'center';

          if (labelLeftOffset < 0) {

            labelTextAlign = 'left';
            labelWidth += labelLeftOffset;
            labelLeftOffset = 0;

          } else if ((labelLeftOffset + labelWidth) > cachedChartDimensions.width) {

            labelWidth += (cachedChartDimensions.width - (labelLeftOffset + labelWidth));
            labelLeftOffset = cachedChartDimensions.width - labelWidth;
            labelTextAlign = 'right';

          }

          // Adding aggregate and label data to the label for flyout.
          dataAggregate = cachedChartData.values.
            filter(function(datum) {
              return datum.date.getTime() >= selectionStartDate.getTime() &&
                     datum.date.getTime() < selectionEndDate.getTime();
            });

          unfilteredAggregate = dataAggregate.
            reduce(function(acc, datum) {
              return acc + datum.unfiltered;
            }, 0);

          filteredAggregate = dataAggregate.
            reduce(function(acc, datum) {
              return acc + datum.filtered;
            }, 0);

          dateRangeFlyoutLabel = '{0} - {1}'.
            format(formatDateLabel(minDate, true), formatDateLabel(maxDate, true));

          $clearSelectionLabel.
            attr('data-start', selectionStartDate).
            attr('data-end', selectionEndDate).
            attr('data-aggregate-unfiltered', unfilteredAggregate).
            attr('data-aggregate-filtered', filteredAggregate).
            attr('data-flyout-label', dateRangeFlyoutLabel).
            html(dateRangeLabel).
            css({
              left: labelLeftOffset,
              width: labelWidth,
              height: Constants.TIMELINE_CHART_MARGIN.BOTTOM,
              textAlign: labelTextAlign,
              top: cachedChartDimensions.height -
                Constants.TIMELINE_CHART_MARGIN.TOP -
                Constants.TIMELINE_CHART_MARGIN.BOTTOM
            });

          $chartSelectionElement.show();

          renderedSelectionStartDate = selectionStartDate;
          renderedSelectionEndDate = selectionEndDate;

        }

      }

      function clearChartSelection() {

        selectionIsCurrentlyRendered = false;
        selectionStartDate = null;
        selectionEndDate = null;
        renderedSelectionStartDate = null;
        renderedSelectionEndDate = null;
        $chartSelectionElement.hide();
        $chartElement.removeClass('selected');

      }

      /**
       * Is probably the most complicated function in the directive
       * simply because of all the special casing that needs to happen for
       * sensible display of axis labels across multiple time intervals.
       */
      function renderChartXAxis() {

        function deriveXAxisLabelPrecision() {

          var domain;
          var xAxisLabelPrecision;

          domain = _.map(d3XScale.domain(), function(date) {
            return moment(date);
          });

          xAxisLabelPrecision = 'DECADE';

          // ...then use the domain to derive a timeline granularity.
          if (moment(domain[0]).add(2, 'months').isAfter(domain[1])) {
            xAxisLabelPrecision = 'DAY';
          } else if (moment(domain[0]).add(2, 'years').isAfter(domain[1])) {
            xAxisLabelPrecision = 'MONTH';
          } else if (moment(domain[0]).add(20, 'years').isAfter(domain[1])) {
            xAxisLabelPrecision = 'YEAR';
          }

          return xAxisLabelPrecision;
        }

        function deriveXAxisLabelDatumStep(labels) {

          var numberOfLabels = labels.length;

          // TIMELINE_CHART_REQUIRED_LABEL_WIDTH is the min
          // width required for labels with month ("Oct 15")
          var labelsWeHaveRoomFor = Math.floor(cachedChartDimensions.width /
            Constants.TIMELINE_CHART_REQUIRED_LABEL_WIDTH);
          var labelEveryN;

          // TODO - write integration tests for the number of labels shown at given screen widths
          // and ensuring that they are interactive.

          // Show every label, every other label, etc...
          if (numberOfLabels <= labelsWeHaveRoomFor) {
            labelEveryN = 1;
          } else if (numberOfLabels / 2 <= labelsWeHaveRoomFor) {
            labelEveryN = 2;
          } else if (numberOfLabels / 3 <= labelsWeHaveRoomFor) {
            labelEveryN = 3;
          } else if (numberOfLabels / 5 <= labelsWeHaveRoomFor) {
            labelEveryN = 5;
          } else {
            labelEveryN = 7;
          }

          return labelEveryN;
        }

        function recordLabel(labels, startDate, endDate, pixelsPerDay, shouldLabel) {
          labels.push({
            startDate: startDate,
            endDate: endDate,
            left: d3XScale(startDate) - halfVisualizedDatumWidth,
            width: moment.duration(moment(endDate) - moment(startDate)).asDays() * pixelsPerDay,
            shouldLabel: shouldLabel
          });
        }

        var pixelsPerDay;
        var jqueryAxisContainer;
        var tickLocations = [];
        var labels = [];
        var thisDate;
        var intervalStartDate = cachedChartData.values[0].date;
        var intervalEndDate = null;
        var maxDatePlusLabelPrecision;
        var shouldLabelEveryN;

        // This is half the width of each tick as defined in the accompanying CSS
        var halfTickWidth = 2;
        var jqueryAxisTick;
        var dataAggregate;
        var unfilteredAggregate;
        var filteredAggregate;
        var labelText;
        var jqueryAxisTickLabel;
        var finalEndDate;

        // Note that labelPrecision is actually global to the directive, but
        // it is set within the context of rendering the x-axis since it
        // seems as reasonable to do so here as anywhere else.
        labelPrecision = deriveXAxisLabelPrecision();

        pixelsPerDay = cachedChartDimensions.width /
          moment.duration(
            moment(cachedChartData.maxDate).add(1, datasetPrecision) -
            moment(cachedChartData.minDate)
          ).asDays();

        // Set up the container for the x-axis ticks.
        jqueryAxisContainer = $('<div>').
          addClass('x-ticks').
          css({
            width: cachedChartDimensions.width,
            height: Constants.TIMELINE_CHART_MARGIN.BOTTOM
          });

        _.each(cachedChartData.values, function(value, i) {

          if (i === 0) {
            return;
          }

          thisDate = value.date;

          switch (labelPrecision) {
            case 'DECADE':
              if (thisDate.getFullYear() % 10 === 0) {
                tickLocations.push(i);
                recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                intervalStartDate = thisDate;
              }
              break;
            case 'YEAR':
              if (thisDate.getMonth() === 0) {
                tickLocations.push(i);
                recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                intervalStartDate = thisDate;
              }
              break;
            case 'MONTH':
              if (thisDate.getDate() === 1) {
                tickLocations.push(i);
                recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
                intervalStartDate = thisDate;
              }
              break;
            case 'DAY':
              tickLocations.push(i);
              recordLabel(labels, intervalStartDate, thisDate, pixelsPerDay, true);
              intervalStartDate = thisDate;
              break;
          }
        });

        intervalEndDate = moment(cachedChartData.maxDate).add(1, datasetPrecision).toDate();

        // If the last date is not a tick, we still need a label to extend
        // from the last tick to the end of the visualization.
        // Additionally, moment has no notion of decades so we need to catch
        // that case and add 10 years instead.
        finalEndDate = _.isEmpty(labels) ? intervalEndDate : _.last(labels).endDate;
        if (labelPrecision === 'DECADE') {
          maxDatePlusLabelPrecision =
            moment(finalEndDate).add(10, 'YEAR').toDate();
        } else {
          maxDatePlusLabelPrecision =
            moment(finalEndDate).add(1, labelPrecision).toDate();
        }

        labels.push({
          startDate: intervalStartDate,
          endDate: intervalEndDate,
          width: cachedChartDimensions.width - d3XScale(intervalStartDate) +
            (2 * halfTickWidth) + halfVisualizedDatumWidth,
          left: d3XScale(intervalStartDate) - halfVisualizedDatumWidth,
          // If the distance from the last tick to the end of the visualization is
          // equal to one labelPrecision unit or if we have no labels, then we
          // should label the interval.  Otherwise, we should draw it but not label it.
          shouldLabel: (maxDatePlusLabelPrecision.getTime() === intervalEndDate.getTime()) ||
            _.isEmpty(labels)
        });

        // Now that we know how many *labels* we can potentially draw, we
        // decide whether or not we can draw all of them or just some.
        shouldLabelEveryN = deriveXAxisLabelDatumStep(labels);

        // Note that allChartLabelsShown is also actually global to the
        // directive and is also set within the context of rendering the
        // x-axis since it seems as reasonable to do so as anywhere else.
        allChartLabelsShown = shouldLabelEveryN === 1;

        // Finally, we filter the group of all labels so that we only
        // label every Nth one.
        labels = labels.filter(function(label, i) {
          return (i % shouldLabelEveryN) === 0;
        });

        if (!allChartLabelsShown) {

          var halfExtendedLabelWidth = (visualizedDatumWidth * Math.floor(shouldLabelEveryN / 2));

          // Revisit each label and increase its width to accommodate the
          // space that would have been consumed by the missing labels.
          // The first one is a special case since it will only be enlarged
          // by half the amount that the others are, since it already sits at
          // the left edge of the labels. The last will be a special case
          // also, but it's easier to just adjust it after the map operation.
          labels.map(function(label) {
            label.left -= halfExtendedLabelWidth;
            label.width += (2 * halfExtendedLabelWidth);
          });

        }

        // Now we go through and draw ticks.
        _.each(tickLocations, function(location) {
          jqueryAxisTick = $('<rect>').
            addClass('x-tick').
            css({
              left: d3XScale(cachedChartData.values[location].date) -
                halfVisualizedDatumWidth - halfTickWidth
            });

          jqueryAxisContainer.append(jqueryAxisTick);
        });

        // Now we to through and draw labels.
        _.each(labels, function(label) {

          // Calculate the data aggregates for this interval so we can
          // stash them as data-attributes and not need to recalculate
          // them whenever the mouse moves over this label.
          dataAggregate = cachedChartData.values.
            filter(function(datum) {
              return datum.date.getTime() >= label.startDate.getTime() &&
                     datum.date.getTime() < label.endDate.getTime();
            });

          unfilteredAggregate = dataAggregate.
            reduce(function(acc, datum) {
              return acc + datum.unfiltered;
            }, 0);

          filteredAggregate = dataAggregate.
            reduce(function(acc, datum) {
              return acc + datum.filtered;
            }, 0);

          labelText = label.shouldLabel ? formatDateLabel(label.startDate, false, labelPrecision) : '';

          // Finally, add the label to the x-axis container.
          jqueryAxisTickLabel = $('<span>').
            addClass('x-tick-label').
            attr('data-start', label.startDate).
            attr('data-median', label.startDate).
            attr('data-end', label.endDate).
            attr('data-aggregate-unfiltered', unfilteredAggregate).
            attr('data-aggregate-filtered', filteredAggregate).
            attr('data-flyout-label', formatDateLabel(label.startDate, true)).
            text(labelText).
            css({
              left: label.left,
              width: label.width - halfTickWidth
            });

          jqueryAxisContainer.append(jqueryAxisTickLabel);

        });

        // Replace the existing x-axis ticks with the new ones.
        $chartElement.children('.x-ticks').replaceWith(jqueryAxisContainer);

      }

      /**
       * This function is comparatively straightforward, but operates
       * in the same way as renderChartXAxis.
       */
      function renderChartYAxis(chartWidth, chartHeight) {

        var jqueryAxisContainer;
        var labels;
        var ticks;
        var tickElement;


        jqueryAxisContainer = $('<div>').
          addClass('y-ticks').
          css({
            width: chartWidth,
            height: chartHeight
          });

        labels = [
          Math.round(cachedChartData.minValue),
          Math.round(cachedChartData.meanValue),
          Math.round(cachedChartData.maxValue)
        ];

        ticks = [0, 0.5, 1];

        // If our values straddle 0, then we need to force the middle tick to
        // be 0, not the average of the min and the max values.
        if (labels[0] * labels[2] < 0) {
          labels[1] = 0;
          ticks[1] = Math.abs(cachedChartData.minValue) /
            (Math.abs(cachedChartData.minValue) + Math.abs(cachedChartData.maxValue));
        }

        _.each(ticks, function(tick, index) {

          tickElement = $('<div>').
            addClass('y-tick').
            css('bottom', Math.floor(chartHeight * tick)).
            text(window.socrata.utils.formatNumber(labels[index]));

          if (labels[index] === 0) {
            tickElement.addClass('zero');
          }

          jqueryAxisContainer.append(tickElement);

        });

        // Remove old y-axis ticks and replace them
        $chartElement.children('.y-ticks').replaceWith(jqueryAxisContainer);

      }

      /* Use a function generator to DRY up very similar rendering functions.
       * The specified opts object factors out the few bits where filtered and
       * unfiltered chart rendering are different.
       * @param {number} chartOpts
       *   @property {function} valueTransformer - function for obtaining values
       *   @property {function} ySelector - function for choosing correct y value
       *   @property {string} svgSelector - selector fo SVG element
       *   @property {string} areaClass - CSS class for area element
       *   @property {string} lineClass - CSS class for line element
       */
      function generateChartValueRenderer(chartOpts) {

        return function() {

          var margin;
          var chartWidth;
          var chartHeight;
          var values;
          var line;
          var area;
          var svgChart;
          var selection;

          margin = Constants.TIMELINE_CHART_MARGIN;

          // chartWidth and chartHeight do not include margins so that
          // we can use the margins to render axis ticks.
          chartWidth = cachedChartDimensions.width - margin.LEFT - margin.RIGHT;
          chartHeight = cachedChartDimensions.height - margin.TOP - margin.BOTTOM;

          values = chartOpts.valueTransformer(cachedChartData.values);

          line = d3.
            svg.
            line().
            defined(function(d) { return !_.isNull(d.unfiltered); }).
            x(function(d) { return d3XScale(d.date); }).
            y(chartOpts.ySelector);

          area = d3.
            svg.
            area().
            defined(line.defined()).
            x(line.x()).
            y0(function(d) { return d3YScale(0); }).
            y1(line.y());

          svgChart = d3ChartElement.
            select(chartOpts.svgSelector).
            attr('width', cachedChartDimensions.width).
            attr('height', cachedChartDimensions.height).
            select('g').
            attr('transform', 'translate({0}, {1})'.format(margin.LEFT, margin.TOP));

          selection = svgChart.
            selectAll('path').
            data(values);

          selection.
            enter().
            append('path');

          selection.
            exit().
            remove();

          selection.
            attr('class', chartOpts.areaClass).
            attr('d', area);

          svgChart.
            append('path').
            data(values).
            attr('class', chartOpts.lineClass).
            attr('d', line);
        };

      }

      /**
       * Basically just prepares the underlying chart data and then calls
       * special functions that render the x-axis, the y-axis, unfiltered
       * and filtered values.
       */
      function renderChart() {

        var margin;
        var chartWidth;
        var chartHeight;

        if (cachedChartDimensions.width <= 0 || cachedChartDimensions.height <= 0) {
          return;
        }

        //
        // Prepare dimensions used in chart rendering.
        //
        margin = Constants.TIMELINE_CHART_MARGIN;

        // chartWidth and chartHeight do not include margins so that
        // we can use the margins to render axis ticks.
        chartWidth = cachedChartDimensions.width - margin.LEFT - margin.RIGHT;
        chartHeight = cachedChartDimensions.height - margin.TOP - margin.BOTTOM;

        // Set up the scales and the chart-specific stack and area functions.
        // Also create the root svg element to which the other d3 functions
        // will append elements.

        // d3XScale is global to the directive so that we can
        // access it without having to re-render.
        d3XScale = d3.
          time.
          scale().
          domain([
            DateHelpers.decrementDateByHalfInterval(cachedChartData.minDate, datasetPrecision),
            DateHelpers.incrementDateByHalfInterval(cachedChartData.maxDate, datasetPrecision)
          ]).
          range([0, chartWidth]);

        // d3YScale is global to the directive so that we can
        // access it without having to re-render.
        d3YScale = d3.
          scale.
          linear().
          domain([cachedChartData.minValue, cachedChartData.maxValue]).
          range([chartHeight, 0]).
          clamp(true);

        // Render the x-axis.
        renderChartXAxis();

        // Render the y-axis. Since we eschew d3's built-in y-axis for a
        // custom implementation this calls out to a separate function.
        renderChartYAxis(
          chartWidth,
          chartHeight
        );

        // Render the unfiltered and filtered values of the chart.
        renderChartUnfilteredValues();
        renderChartFilteredValues();
      }

      /**
       * @param {DOM Element} target - The DOM element which triggered the
       *                               flyout.
       * @return {String} The HTML representation of the flyout content.
       */
      function renderFlyout(target) {

        var label;
        var unfilteredValue;
        var unfilteredUnit;
        var filteredValue;
        var filteredUnit;
        var flyoutContent;
        var flyoutSpanClass;
        var shouldDisplayFlyout;
        var withinSelection;
        var showBlueFiltered;
        var $target = $(target);
        var date;
        var isInterval = $target.
          is(flyoutIntervalTopSelectors.concat([flyoutIntervalPathSelector]).join(', '));
        var definedDatum = !_.isUndefined(currentDatum) && !_.isNull(currentDatum);
        var formatStrings = {
          DECADE: 'YYYYs',
          YEAR: 'YYYY',
          MONTH: 'MMMM YYYY',
          DAY: 'D MMMM YYYY'
        };
        var formatFlyoutValue = function(unit, value) {
          var formattedValue;

          unit = (value === 1) ?
            cachedRowDisplayUnit :
            cachedRowDisplayUnit.pluralize();

          formattedValue = (_.isFinite(value)) ?
            '{0} {1}'.format(
              window.socrata.utils.formatNumber(value),
              unit
            ) :
            I18n.common.noValue;

          return formattedValue;
        };

        if (isInterval) {

          label = $target.attr('data-flyout-label');
          date = $target.attr('data-start');
          unfilteredValue = $target.attr('data-aggregate-unfiltered');
          unfilteredValue = _.isUndefined(unfilteredValue) ? null : parseFloat(unfilteredValue);
          filteredValue = $target.attr('data-aggregate-filtered');
          filteredValue = _.isUndefined(filteredValue) ? null : parseFloat(filteredValue);

        } else if (definedDatum) {

          label = currentDatum.hasOwnProperty('flyoutLabel') ?
            currentDatum.flyoutLabel :
            moment(currentDatum.date).format(formatStrings[datasetPrecision]);
          date = currentDatum.date;
          unfilteredValue = currentDatum.unfiltered;
          filteredValue = currentDatum.filtered;
        }

        shouldDisplayFlyout = (mousePositionWithinChartLabels ||
          mousePositionWithinChartDisplay) &&
          !_.isNull(datasetPrecision) &&
          !currentlyDragging;

        if (shouldDisplayFlyout) {

          withinSelection = !_.isNull(selectionStartDate) &&
            !_.isNull(selectionEndDate) &&
            selectionIsCurrentlyRendered;

          withinSelection = isInterval ?
            withinSelection && (date === selectionStartDate) :
            withinSelection && (date >= selectionStartDate) && (date <= selectionEndDate);

          showBlueFiltered = !selectionIsCurrentlyRendered &&
            filteredValue !== unfilteredValue;

          unfilteredValue = formatFlyoutValue(unfilteredUnit, unfilteredValue);
          filteredValue = formatFlyoutValue(filteredUnit, filteredValue);

          flyoutContent = [
             '<div class="flyout-title">{0}</div>',
             '<div class="flyout-row">',
               '<span class="flyout-cell">{1}</span>',
               '<span class="flyout-cell">{2}</span>',
             '</div>'
          ];

          if (withinSelection || showBlueFiltered) {

            flyoutSpanClass = (withinSelection) ? 'is-selected' : 'emphasis';
            flyoutContent.push(
              '<div class="flyout-row">',
                '<span class="flyout-cell {3}">{4}</span>',
                '<span class="flyout-cell {3}">{5}</span>',
              '</div>');
          }

          if (withinSelection && isInterval) {

            flyoutContent.push(
              '<div class="flyout-row">',
                '<span class="flyout-cell">&#8203;</span>',
                '<span class="flyout-cell">&#8203;</span>',
              '</div>',
              '<div class="flyout-row">',
                '<span class="flyout-cell">{6}</span>',
                '<span class="flyout-cell"></span>',
              '</div>');
          }

          flyoutContent = flyoutContent.
            join('').
            format(
              _.escape(label),
              I18n.flyout.total,
              _.escape(unfilteredValue),
              flyoutSpanClass,
              I18n.flyout.filteredAmount,
              _.escape(filteredValue),
              I18n.flyout.clearFilterLong
            );
        }

        return flyoutContent;
      }

      function renderSelectionMarkerFlyout() {
        if (!currentlyDragging) {
          return '<div class="flyout-title">{0}</div>'.format(I18n.timelineChart.dragHelp);
        }
      }

      function renderClearSelectionMarkerFlyout() {
        if (mousePositionWithinChartLabels) {
          return '<div class="flyout-title">{0}</div>'.format(I18n.timelineChart.dragClearHelp);
        }
      }

      function enterDraggingState() {
        currentlyDragging = true;
        selectionIsCurrentlyRendered = false;
        hideDatumLabel();
        $chartElement.find('.timeline-chart-filtered-mask').hide();
        $body.addClass('prevent-user-select');
        $chartElement.removeClass('selected').addClass('selecting');
      }

      function enterSelectedState() {
        currentlyDragging = false;
        selectionIsCurrentlyRendered = true;
        hideDatumLabel();
        renderChartFilteredValues();
        $chartElement.find('.timeline-chart-filtered-mask').show();
        $body.removeClass('prevent-user-select');
        $chartElement.removeClass('selecting').addClass('selected');
      }

      function enterDefaultState() {
        currentlyDragging = false;
        selectionIsCurrentlyRendered = false;
        clearChartSelection();
        hideDatumLabel();
        if (d3XScale && d3YScale) {
          // Check if d3 scales exist before attempting to render filtered values.
          // This is mainly needed for the onload case when enterDefaultState is called
          // and the chart has a width/height of zero, so the scales are still null.
          renderChartFilteredValues();
        }
        $body.removeClass('prevent-user-select');
        $chartElement.removeClass('selecting').removeClass('selected');
      }

      function requestChartFilterByCurrentSelection() {
        scope.$emit(
          'filter-timeline-chart',
          {
            start: selectionStartDate,
            end: selectionEndDate
          }
        );
      }

      function requestChartFilterReset() {
        scope.$emit('filter-timeline-chart', null);
      }

      /**
       * @param {Number} offsetX - The left offset of the mosue cursor into
       *                           the visualization, in pixels.
       * @return {Date} The date to which the mouse position is mapped by
       *                d3's x-scale.
       */
      function getDateFromMousePosition(offsetX) {

        var date = d3XScale.invert(offsetX);

        // Clear out unneeded precision from the date objects.
        // This intentionally falls through! Watch out!
        switch (datasetPrecision) {
          case 'YEAR':
            date.setMonth(0);
          case 'MONTH':
            date.setDate(1);
          default:
            date.setMilliseconds(0);
            date.setSeconds(0);
            date.setMinutes(0);
            date.setHours(0);
            break;
        }

        return date;

      }

      /**
       * @param {number} offsetX - The offset of the mouse pointer into the
       *                           visualization, in pixels
       * @param {DOM Element} target - The DOM element receiving the mouse
       *                               event.
       */
      function setSelectionStartAndEndDateByMousePosition(offsetX, target) {

        var candidateSelectionEndDate = null;

        if (mousePositionWithinChartLabels) {

          candidateSelectionEndDate = target.getAttribute('data-end');

          if (candidateSelectionEndDate === null) {
            return;
          }

          candidateSelectionEndDate = new Date(candidateSelectionEndDate);

          if (candidateSelectionEndDate <= selectionStartDate) {
            candidateSelectionEndDate = new Date(target.getAttribute('data-start'));
          }

        } else if (mousePositionWithinChartDisplay) {

          candidateSelectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

        } else {

          candidateSelectionEndDate = selectionEndDate;

        }

        if (candidateSelectionEndDate !== null && selectionStartDate !== null) {

          // Prevent null selections by auto-incrementing by a
          // 'datasetPrecision' unit if the calculated start and end dates
          // are the same.
          if (candidateSelectionEndDate.getTime() === selectionStartDate.getTime()) {
            candidateSelectionEndDate = getDateFromMousePosition(
              offsetX + halfVisualizedDatumWidth + visualizedDatumWidth);
          }

          if (candidateSelectionEndDate < cachedChartData.minDate) {
            candidateSelectionEndDate = cachedChartData.minDate;
          }

          if (candidateSelectionEndDate > cachedChartData.maxDate) {
            candidateSelectionEndDate = moment(cachedChartData.maxDate).
              add(1, datasetPrecision).toDate();
          }

          setCurrentDatumByDate(candidateSelectionEndDate);

          selectionEndDate = candidateSelectionEndDate;

          // Handle the special case wherein the start and end dates can end
          // up identical. This can happen when the cursor is placed on the
          // '0th' pixel of the interval. We solve it by selectively adding
          // or subtracting one <datasetPrecision> unit to/from the end date,
          // depending on whether or not subtracting from the end date would
          // put us outside the x-axis scale.
          if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
            if (selectionStartDate.getTime() === cachedChartData.minDate.getTime()) {
              selectionEndDate = moment(selectionEndDate).
                add(1, datasetPrecision).toDate();
            } else {
              selectionEndDate = moment(selectionEndDate).
                subtract(1, datasetPrecision).toDate();
            }
          }

        }

      }

      /**
       * Interprets clicking and dragging and applies the expected state
       * transitions before conditionally rendering the chart selection.
       *
       * @param {Object} mouseStatus
       *   @property {Boolean} leftButtonPressed
       *   @property {Object} position
       *     @property {Number} clientX
       *     @property {Number} clientY
       */
      function handleChartSelectionEvents(mouseStatus) {

        function selectionIsExactlyTheSameAsHasBeenRendered(startDate, endDate) {

          return !_.isNull(renderedSelectionStartDate) &&
                 !_.isNull(renderedSelectionEndDate) &&
                 startDate.getTime() === renderedSelectionStartDate.getTime() &&
                 endDate.getTime() === renderedSelectionEndDate.getTime();
        }

        var offsetX;
        var offsetY;
        var candidateStartDate;
        var targetIsClearSelection =
          $(mouseStatus.position.target).is('.timeline-chart-clear-selection-button') ||
          $(mouseStatus.position.target).is('.timeline-chart-clear-selection-label');
        var chartHasNotRendered =
          _.isNull(cachedChartDimensions) ||
          _.isNull(element.offset());


        // Fail early if the chart hasn't rendered itself at all yet or
        // if we are clicking the 'Clear selection' label.
        if (chartHasNotRendered || targetIsClearSelection) {
          return;
        }

        offsetX = mouseStatus.position.clientX - element.offset().left + halfVisualizedDatumWidth;
        offsetY = mouseStatus.position.clientY - element.get(0).getBoundingClientRect().top;

        // Mouse down while not dragging (start selecting):
        if (mouseStatus.leftButtonPressed && !currentlyDragging) {

          if (mousePositionWithinChartLabels) {

            candidateStartDate = mouseStatus.position.target.getAttribute('data-start');
            if (!_.isNull(candidateStartDate)) {
              selectionStartDate = new Date(candidateStartDate);
              selectionEndDate = new Date(mouseStatus.position.target.getAttribute('data-end'));
              enterDraggingState();
            }

          } else if (mousePositionWithinChartElement) {

            // The target markers on the left and right of the selection have
            //  a 'data-selection-target' attribute value of 'left' and
            // 'right', respectively. Attempting to get that attribute on any
            // other element (e.g. the chart itself or, more specifically,
            // the highlight target that sits on top of it) will return null,
            // which will be caught by the default case and treated as a
            // normal selection-start event.
            switch (mouseStatus.position.target.getAttribute('data-selection-target')) {
              case 'left':
                selectionStartDate = selectionEndDate;
                selectionEndDate = getDateFromMousePosition(offsetX);
                break;
              case 'right':
                break;
              default:

                // If the mouse is inside the chart element and inside the
                // chart display, then we can just do the drag selection as
                // normal.
                if (mousePositionWithinChartDisplay) {

                  selectionStartDate = getDateFromMousePosition(offsetX);
                  selectionEndDate = getDateFromMousePosition(offsetX + visualizedDatumWidth);

                  if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
                    selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
                  }

                  // If the user is clicking on the same selection again,
                  // then we deselect it.
                  if (selectionIsExactlyTheSameAsHasBeenRendered(selectionStartDate, selectionEndDate)) {
                    enterDefaultState();
                    requestChartFilterReset();
                    return;
                  }

                } else {

                  // If the mouse is above the chart, do not enter a dragging
                  // state because this will try to filter using the topmost
                  // y-tick as a target, which will cause unexpected behavior.
                  if (offsetY < 0) {
                    return;
                  }

                  // If the mouse is inside the chart element but outside the
                  // chart display, then it must be in the left or right
                  // margin, in which case we want to anchor the min or max
                  // date to the chart's min or max date and make the
                  // selection 1 display unit wide.
                  if (offsetX < cachedChartDimensions.width / 2) {
                    selectionStartDate = cachedChartData.minDate;
                    selectionEndDate = moment(cachedChartData.minDate).
                      add(1, datasetPrecision).toDate();
                  } else {
                    selectionStartDate = moment(cachedChartData.maxDate).
                      add(1, datasetPrecision).toDate();
                    selectionEndDate = cachedChartData.maxDate;
                  }

                }
                break;
            }

            enterDraggingState();

          }

        }

        // Mouse up while dragging (stop selecting):
        if (currentlyDragging && !mouseStatus.leftButtonPressed) {

          clearChartHighlight();

          if (selectionStartDate > selectionEndDate) {

            // candidateStartDate is used here as a temporary variable
            // when swapping the two values so that the selectionStartDate
            // always occurs before the selectionEndDate.
            candidateStartDate = selectionStartDate;
            selectionStartDate = selectionEndDate;
            selectionEndDate = candidateStartDate;
          }

          if (selectionStartDate.getTime() === selectionEndDate.getTime()) {
            selectionEndDate = moment(selectionEndDate).add(1, datasetPrecision).toDate();
          }

          enterSelectedState();

          requestChartFilterByCurrentSelection();

        }

      }

      function handleChartMouseleaveEvent() {
        d3ChartElement.select('svg.timeline-chart-highlight-container').select('g').remove();
        currentDatum = null;
      }

      function handleClearSelectionLabelMousedownEvent() {
        requestChartFilterReset();
        enterDefaultState();
      }


      // Render the chart
      function cacheThenRender(chartDimensions, chartData, precision, rowDisplayUnit) {

        if (_.isUndefined(chartData) || _.isNull(chartData) || _.isUndefined(precision)) {
          return;
        }

        // Because we are about to divide by the number of values in the
        // provided chart data, we need to first check to make sure we
        // won't try to divide by zero and throw an exception instead of
        // rendering if that's the case.
        utils.assertHasProperty(chartData, 'values.length');
        if (chartData.values.length === 0) {
          console.error('Failed to render timeline chart because it was given no values.');
          return;
        }

        // Cache the datum width and half the datum width for use elsewhere
        // instead of repeated recomputation.
        visualizedDatumWidth = Math.floor(chartDimensions.width / chartData.values.length);
        halfVisualizedDatumWidth = Math.floor(visualizedDatumWidth / 2);

        // Update the cached value for dataset precision.
        // This is global to the directive, but only updated here.
        datasetPrecision = precision;

        // Cache the row display unit for use in the flyout (which
        // necessarily is handled outside the scope of this subscribeLatest
        // and which probably shouldn't be wrapped in its own
        // subscribeLatest or other combinator).
        cachedRowDisplayUnit = rowDisplayUnit;

        cachedChartDimensions = chartDimensions;
        cachedChartData = chartData;

        renderChart();
        clearChartHighlight();

        // Make sure we also re-render the chart selection if it is visible
        // (such as in the case of a visualization re-render triggered by
        // the window being resized).
        if (selectionIsCurrentlyRendered) {
          renderedSelectionStartDate = null;
          renderedSelectionEndDate = null;
          renderChartSelection();
        }

        // Yield execution to the browser to render, then notify that
        // render is complete
        // TODO: Unclear if this is needed.
      }

      var dimensions = { width: chartWidth, height: chartHeight };

      cacheThenRender(dimensions, data, precision, unit);

      // TODO: React to active filters being cleared.
    }

    /**
     * @param {DOM Element} target - A DOM element with data attributes
     *                               describing an interval's start date,
     *                               end date, filtered and unfiltered
     *                               values and the formatted flyout label.
     */
    function highlightChartByInterval(target) {
      var startDate;
      var endDate;
      startDate = new Date(target.getAttribute('data-start'));
      endDate = new Date(target.getAttribute('data-end'));
      hideDatumLabel();
      highlightChart(startDate, endDate);
    }

    /**
     * This function renders the white highlight on the visualization.
     * This rendering is agnostic to how the underlying data has been filtered
     * and simply takes a subset of the full chart data and renders it in a
     * similar fashion to how the filtered and unfiltered chart data
     * is rendered.
     *
     * This function also determines flyout positioning by drawing
     * a small line where the flyout should be positioned.
     *
     * @param {Object} highlightData - The output of either
     *                                 filterChartDataByOffset
     *                                 or filterChartDataByInterval.
     */
    function renderChartHighlight(highlightData) {

      var highlightArea;
      var flyoutPosition;
      var selection;

      if (_.isNull(d3XScale) || _.isNull(d3YScale)) {
        return;
      }

      var targetMargin = Constants.TIMELINE_CHART_HIGHLIGHT_TARGET_MARGIN;
      var gutter = Constants.TIMELINE_CHART_GUTTER;

      var cardWidth = cachedChartDimensions.width;
      var width = highlightData.width + (targetMargin * 2);
      var leftPos = highlightData.left - targetMargin;
      width = Math.min(width, cardWidth + gutter - leftPos);
      leftPos = Math.max(leftPos, -gutter);

      $highlightTargetElement.css({
        left: leftPos,
        width: width,
        height: cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM
      });

      highlightArea = d3.
        svg.
        area().
        x(function(d) { return d3XScale(d.date); }).
        y0(cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM).
        y1(d3YScale(highlightData.maxValue));

      d3ChartElement.
        select('svg.timeline-chart-highlight-container').
        select('g').
        remove();

      selection = d3ChartElement.
        select('svg.timeline-chart-highlight-container').
        attr('width', highlightData.width).
        attr('height', cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM).
        append('g');

      selection.
        append('path').
        datum(highlightData.data).
        attr('class', 'timeline-chart-highlight').
        attr('d', highlightArea);

      // This function determines the vertical position of the flyout.
      // It always positions the flyout above all timeline paths.
      function flyoutVerticalPosition() {
        var hoveringWithinSelection =
          currentDatum.date >= selectionStartDate && currentDatum.date <= selectionEndDate;

        return (selectionIsCurrentlyRendered && !hoveringWithinSelection) ?
          d3YScale(_.max([currentDatum.unfiltered, 0])) :
          d3YScale(_.max([currentDatum.unfiltered, currentDatum.filtered, 0]));
      }

      // Sets the x and y flyout position.
      flyoutPosition = d3.
        svg.
        line().
        x(function(d) { return d3XScale(d.date); }).
        y(flyoutVerticalPosition());

      // This is the actual svg element that flyouts are
      // positioned on.
      selection.
        append('path').
        datum(highlightData.data).
        attr('class', 'timeline-chart-flyout-target').
        attr('d', flyoutPosition);

    }

    function clearChartHighlight() {
      element.find('.timeline-chart-highlight-container > g > path').remove();
      element.find('.timeline-chart-highlight-container').
        css('height', cachedChartDimensions.height - Constants.TIMELINE_CHART_MARGIN.BOTTOM);
    }

    /**
     * @param {Date} startDate
     * @param {Date} endDate
     */
    function highlightChart(startDate, endDate) {
      var highlightData;
      setCurrentDatumByDate(startDate);
      highlightData = filterChartDataByInterval(
        startDate,
        endDate
      );
      renderChartHighlight(highlightData);
    }

    /**
     * @param {Number} offsetX - The left offset of the mouse cursor into
     *                           the visualization, in pixels.
     */
    function highlightChartByMouseOffset(offsetX) {
      var highlightData;
      if (mousePositionWithinChartDisplay || mousePositionWithinChartLabels) {
        highlightData = filterChartDataByOffset(offsetX);
        renderChartHighlight(highlightData);
        hideDatumLabel();
      }
    }

    /**
     * @param {Number} offsetX - The left offset of the mouse cursor into
     *                           the visualization, in pixels.
     */
    function highlightChartWithHiddenLabelsByMouseOffset(offsetX) {

      var indexIntoChartData;
      var startDate;
      var endDate;
      var currentPrecision;
      var datumLabelOffset;
      var datumLabelWidth;

      indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) *
        cachedChartData.values.length);

      // Note that currentDatum is a global variable that is set when the
      // user hovers over the visualization. The value of currentDatum is
      // read by the flyout code.
      currentDatum = cachedChartData.values[indexIntoChartData];

      // If we are hovering within the labels and they are all shown, we should use
      // the label precision.  Otherwise, because labels are hidden, we should use
      // the smaller datasetPrecision.
      currentPrecision = (mousePositionWithinChartLabels && allChartLabelsShown) ?
        labelPrecision : datasetPrecision;

      startDate = currentDatum.date;
      endDate = new Date(moment(currentDatum.date).add(1, currentPrecision).toDate());

      // Dim existing labels and add text and attribute information to the datum label.
      $datumLabel.
        text(formatDateLabel(startDate, false, currentPrecision)).
        attr('data-start', startDate).
        attr('data-end', endDate).
        attr('data-aggregate-unfiltered', currentDatum.unfiltered).
        attr('data-aggregate-filtered', currentDatum.filtered).
        attr('data-flyout-label', formatDateLabel(startDate, true, currentPrecision));

      // Now that the datum label has text (and thus a width), calculate its
      // left offset.  Make sure it does not overflow either edge of the chart.
      datumLabelWidth = $datumLabel.width();
      datumLabelOffset = Math.ceil(d3XScale(startDate));
      datumLabelOffset = (datumLabelOffset > (datumLabelWidth / 2)) ?
         datumLabelOffset - (datumLabelWidth / 2) : 0;
      datumLabelOffset = Math.min(
        datumLabelOffset,
        cachedChartDimensions.width - datumLabelWidth
      );

      // Set the left offset and show the label.
      $datumLabel.
        css('left', Math.floor(datumLabelOffset)).
        show();

      highlightChart(startDate, endDate);

    }

    /**
     * Data can be filtered by the x-offset of the cursor from the left
     * edge of the chart or by arbitrary intervals specified with start-
     * and end Date objects.
     *
     * The two filter functions each have a SIDE-EFFECT: they both set
     * the global 'currentDatum' variable to a synthetic value which is
     * used by the flyout code to keep the highlighted areas and their
     * corresponding flyout labels in sync.
     *
     * @param {Number} offsetX - The left offset of the mouse cursor into the
     *                           visualization, in pixels.
     * @return {Object}
     *   @property {Array} highlightData - The data for the start and end
     *                                     date including the unfiltered
     *                                     and filtered values.
     *   @property {Number} left - The left offset of the selection,
     *                             in pixels.
     *   @property {Number} width - The width of one <datum>, in pixels.
     *   @property {Number} maxValue - the maximum unfiltered value in the
     *                                 latest data request.
     */
    function filterChartDataByOffset(offsetX) {

      var indexIntoChartData;
      var transformedStartDate;
      var transformedEndDate;
      var highlightData;
      var leftOffset;
      var width = visualizedDatumWidth;
      var maxValue = cachedChartData.maxValue;

      indexIntoChartData = Math.floor(((offsetX - 1) / cachedChartDimensions.width) *
        cachedChartData.values.length);

      // Note that currentDatum is a global variable that is set when the
      // user hovers over the visualization. The value of currentDatum is
      // read by the flyout code.
      currentDatum = cachedChartData.values[indexIntoChartData];

      transformedStartDate = DateHelpers.decrementDateByHalfInterval(
        currentDatum.date, datasetPrecision
      );
      transformedEndDate = DateHelpers.decrementDateByHalfInterval(
        moment(currentDatum.date).add(1, datasetPrecision).toDate(), datasetPrecision
      );

      highlightData = [
        { date: transformedStartDate },
        { date: transformedEndDate }
      ];

      leftOffset = d3XScale(transformedStartDate);

      return {
        data: highlightData,
        left: leftOffset,
        width: width,
        maxValue: maxValue
      };

    }

    function hideDatumLabel() {
      $datumLabel.hide();
    }

    /**
     * This is used to keep the flyout updated as you drag a selection
     * marker.
     */
    function setCurrentDatumByDate(date) {
      currentDatum = _.find(cachedChartData.values, function(value) {
        return value.date >= date;
      });
    }

    /**
     * Converts a date and a unit into a string representation.
     *
     * @param {Date} labelDate - The date to format.
     * @param {Boolean} useFullMonthNames - Whether or not the date should
     *                                      be rendered with full month
     *                                      names.
     * @param {String} overriddenLabelPrecision - An optional precision
     *                                            to use in favor of the
     *                                            globally-defined dataset
     *                                            precision. Must be one of
     *                                            'decade', 'year', 'month'
     *                                            or 'day'.
     * @return {String} The formatted date.
     */
    function formatDateLabel(labelDate, useFullMonthNames, overriddenLabelPrecision) {

      var labelPrecisionToUse = overriddenLabelPrecision || labelPrecision;
      var label;

      switch (labelPrecisionToUse) {

        case 'DECADE':
          label = Math.floor(labelDate.getFullYear() / 10) + '0s';
          break;

        case 'YEAR':
          label = labelDate.getFullYear();
          break;

        case 'MONTH':
          if (useFullMonthNames) {
            label = '{0} {1}'.format(
              moment(labelDate).format('MMMM'),
              labelDate.getFullYear()
            );
          } else {
            label = '{0} \'{1}'.format(
              moment(labelDate).format('MMM'),
              '0{0}'.format(labelDate.getFullYear() % 100).slice(-2)
            );
          }
          break;

        case 'DAY':
          if (useFullMonthNames) {
            label = '{0} {1} {2}'.format(
              labelDate.getDate(),
              moment(labelDate).format('MMMM'),
              labelDate.getFullYear()
            );
          } else {
            label = '{0} {1}'.format(
              labelDate.getDate(),
              moment(labelDate).format('MMM')
            );
          }
          break;

        default:
          throw new Error(
            'Cannot format date label for unrecognized unit "{0}".'.format(labelPrecisionToUse));

      }

      return label;

    }

    /**
     * Returns a bundle of stuff about the data points occurring between
     * two points in time.
     *
     * @param {Date} startDate
     * @param {Date} endDate
     * @return {Object}
     *   @property {Array} highlightData - The data for the start and end
     *                                     date including the unfiltered
     *                                     and filtered values.
     *   @property {Number} left - The left offset of the selection,
     *                             in pixels.
     *   @property {Number} width - The width of the selection, in pixels.
     *   @property {Number} maxValue - The maximum unfiltered value in the
     *                                 latest data request.
     */
    function filterChartDataByInterval(startDate, endDate) {

      var transformedStartDate = DateHelpers.decrementDateByHalfInterval(
        startDate, datasetPrecision);
      var transformedEndDate = DateHelpers.decrementDateByHalfInterval(
        endDate, datasetPrecision);
      var highlightData;
      var leftOffset = d3XScale(transformedStartDate);
      var width = d3XScale(transformedEndDate) - leftOffset;
      var maxValue = cachedChartData.maxValue;

      highlightData = [
        { date: transformedStartDate },
        { date: transformedEndDate }
      ];

      return {
        data: highlightData,
        left: leftOffset,
        width: width,
        maxValue: maxValue
      };

    }

    /**
     * @param {Number} offsetX - The left offset of the mouse cursor into
     *                           the visualization, in pixels.
     * @param {Number} offsetY - The top offset of the mouse cursor into
     *                           the visualization, in pixels.
     * @return {Boolean}
     */
    function isMouseWithinChartDisplay(offsetX, offsetY) {

      return offsetX > 0.5 &&
        offsetX <= cachedChartDimensions.width &&
        offsetY > 0 &&
        offsetY <= cachedChartDimensions.height -
          Constants.TIMELINE_CHART_MARGIN.BOTTOM;

    }

    /**
     * @param {Number} offsetX - The left offset of the mouse cursor into
     *                           the visualization, in pixels.
     * @param {Number} offsetY - The top offset of the mouse cursor into
     *                           the visualization, in pixels.
     * @return {Boolean}
     */
    function isMouseWithinChartLabels(offsetX, offsetY) {
      return offsetX > 0 &&
        offsetX <= cachedChartDimensions.width &&
        offsetY > cachedChartDimensions.height -
          Constants.TIMELINE_CHART_MARGIN.BOTTOM &&
        offsetY <= cachedChartDimensions.height;

    }

    /**
     * @param {DOM Element} target - The DOM element belonging to this
     *                               instance of the visualization.
     * @return {Boolean}
     */
    function isMouseOverChartElement(target) {
      return $(target).closest('.timeline-chart').get(0) === _chartElement[0];
    }

    function mouseHasMoved(mousePosition, mouseLeftButtonNowPressed) {
      var offsetX;
      var offsetY;
      var mousePositionTarget = mousePosition.target;

      // Work-around for browsers with no pointer-event support.
      //mousePositionTarget = FlyoutService.targetUnder();

      var $mousePositionTarget = $(mousePositionTarget);
      var mousePositionIsClearButton = $mousePositionTarget.
        hasClass('timeline-chart-clear-selection-button');
      var mousePositionIsSelectionLabel = $mousePositionTarget.
        hasClass('timeline-chart-clear-selection-label');

      // Fail early if the chart hasn't rendered itself at all yet.
      if (_.isNull(cachedChartDimensions) || _.isNull(element.offset())) {
        return;
      }

      offsetX = mousePosition.clientX - element.offset().left;

      // The method 'getBoundingClientRect().top' must be used here
      // because the offset of expanded cards changes as the window
      // scrolls.
      offsetY = mousePosition.clientY - element.get(0).getBoundingClientRect().top;

      // mousePositionWithinChartElement is a global variable that is
      // used elsewhere as well
      mousePositionWithinChartElement = isMouseOverChartElement(mousePositionTarget);

      // First figure out which region (display, labels, outside) of the
      // visualization the mouse is currently over and cache the result
      // for this and other functions to use.
      //
      // mousePositionWithinChartDisplay and
      // mousePositionWithinChartLabels are both also global variables
      // that are used elsewhere as well.
      if (isMouseWithinChartDisplay(offsetX, offsetY) && mousePositionWithinChartElement) {
        mousePositionWithinChartDisplay = true;
        mousePositionWithinChartLabels = false;
      } else if (isMouseWithinChartLabels(offsetX, offsetY) && mousePositionWithinChartElement) {
        mousePositionWithinChartDisplay = false;
        mousePositionWithinChartLabels = true;
      } else {
        mousePositionWithinChartDisplay = false;
        mousePositionWithinChartLabels = false;
      }

      // If we are currently dragging, then we need to update and
      // re-render the selected area.
      if (currentlyDragging) {
        setSelectionStartAndEndDateByMousePosition(offsetX, mousePositionTarget);
        renderChartSelection();
      // Otherwise we need to update and render an appropriate highlight
      // (by mouse position if the mouse is within the display or by
      // interval if the mouse is over the chart labels).
      } else {
        if (mousePositionWithinChartDisplay) {
          if (!allChartLabelsShown) {
            highlightChartWithHiddenLabelsByMouseOffset(offsetX, mousePositionTarget);
          } else {
            highlightChartByMouseOffset(offsetX, mousePositionTarget);
          }
        } else if (mousePositionWithinChartLabels && !mouseLeftButtonNowPressed) {
          // Clear the chart highlight if the mouse is currently over the
          // 'clear chart selection' button.
          if (mousePositionIsClearButton) {
            clearChartHighlight();
            hideDatumLabel();
          // Otherwise, render a highlight over the interval indicated by
          // the label that is currently under the mouse.
          } else {
            if (!allChartLabelsShown && !mousePositionIsSelectionLabel) {
              highlightChartWithHiddenLabelsByMouseOffset(offsetX, mousePositionTarget);
            } else {
              highlightChartByInterval(mousePosition.target);
            }
          }
        } else {
          $chartElement.find('.x-tick-label').removeClass('emphasis');
          hideDatumLabel();
          clearChartHighlight();
        }
      }
    }
  }

  root.socrata.visualizations.TimelineChart = TimelineChart;
})(window);

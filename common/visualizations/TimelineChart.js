// NOTE: This file appears unused.
// Let's remove it when we do EN-16807.
var _ = require('lodash');
var $ = require('jquery');
var utils = require('common/js_utils');
var moment = require('moment');
var TimelineChart = require('./views/TimelineChart');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');

var MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';
var DATE_INDEX = 0;
var UNFILTERED_INDEX = 1;
var FILTERED_INDEX = 2;
var SELECTED_INDEX = 3;
var SOQL_PRECISION_START_ALIAS = '__START__';
var SOQL_PRECISION_END_ALIAS = '__END__';
var SOQL_DATA_PROVIDER_NAME_ALIAS = '__NAME_ALIAS__';
var SOQL_DATA_PROVIDER_VALUE_ALIAS = '__VALUE_ALIAS__';
var PRECISION_QUERY = "SELECT min({0}) AS {2}, max({0}) AS {3} WHERE {0} < '{1}'";
var DATA_QUERY_PREFIX = 'SELECT {4}(`{0}`) AS {1}, {2} AS {3}';
var DATA_QUERY_SUFFIX = 'GROUP BY {0}';
var DATA_QUERY_WHERE_CLAUSE_PREFIX = 'WHERE';
var DATA_QUERY_WHERE_CLAUSE_SUFFIX = "`{0}` IS NOT NULL AND `{0}` < '{1}' AND (1=1)";
var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Instantiates a Socrata ColumnChart Visualization from the
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataTimelineChart = function(vif) {
  utils.assertHasProperties(
    vif,
    'columnName',
    'configuration.localization',
    'datasetUid',
    'domain',
    'unit.one',
    'unit.other'
  );

  utils.assertHasProperties(
    vif.configuration.localization,
    'no_value',
    'flyout_unfiltered_amount_label',
    'flyout_filtered_amount_label',
    'flyout_selected_notice'
  );

  var $element = $(this);

  var soqlDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
  };

  var precisionSoqlDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  // SoQL returns row results for display as columns.
  // We need separate data providers for 'unfiltered'
  // and 'filtered' requests, which are merged below.
  var unfilteredSoqlDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  var filteredSoqlDataProvider = new SoqlDataProvider(
    soqlDataProviderConfig
  );

  vif.configuration.columns = {
    date: DATE_INDEX,
    unfilteredValue: UNFILTERED_INDEX,
    filteredValue: FILTERED_INDEX,
    selected: SELECTED_INDEX
  };

  var visualization = new TimelineChart($element, vif);
  var visualizationData = transformChartDataForRendering([]);
  var precision;
  var rerenderOnResizeTimeout;
  var _lastRenderedVif;

  _attachEvents();
  _updateData(vif);

  /**
   * Configuration
   */

  function _getRenderOptions(vifToRender) {
    return {
      showAllLabels: true,
      showFiltered: false,
      rescaleAxis: false,
      precision: precision,
      vif: vifToRender
    };
  }

  function transformChartDataForRendering(chartData) {
    var minDate = null;
    var maxDate = null;
    var minValue = Number.POSITIVE_INFINITY;
    var maxValue = Number.NEGATIVE_INFINITY;
    var meanValue;
    var allValues = chartData.map(function(datum) {

      if (minDate === null) {
        minDate = datum.date;
      } else if (datum.date < minDate) {
        minDate = datum.date;
      }

      if (maxDate === null) {
        maxDate = datum.date;
      } else if (datum.date > maxDate) {
        maxDate = datum.date;
      }

      if (datum.total < minValue) {
        minValue = datum.total;
      }

      if (datum.total > maxValue) {
        maxValue = datum.total;
      }

      return {
        date: datum.date.toDate(),
        filtered: datum.filtered,
        unfiltered: datum.total
      };
    });

    minValue = (minValue > 0) ? 0 : minValue;
    maxValue = (maxValue < 0) ? 0 : maxValue;
    meanValue = (maxValue + minValue) / 2;

    return {
      minDate: minDate ? minDate.toDate() : null,
      maxDate: maxDate ? maxDate.toDate() : null,
      minValue: minValue,
      meanValue: meanValue,
      maxValue: maxValue,
      values: allValues
    };
  }

  /**
   * Event handling
   */

  function _attachEvents() {

    // Destroy on (only the first) 'SOCRATA_VISUALIZATION_DESTROY' event.
    $element.one('SOCRATA_VISUALIZATION_DESTROY', function() {
      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      _detachEvents();
    });

    $(window).on('resize', _handleWindowResize);

    $element.on('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', _handleVisualizationFlyout);
    $element.on('SOCRATA_VISUALIZATION_TIMELINE_FILTER', _handleSelection);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  function _detachEvents() {

    $(window).off('resize', _handleWindowResize);

    $element.off('SOCRATA_VISUALIZATION_TIMELINE_FLYOUT', _handleVisualizationFlyout);
    $element.off('SOCRATA_VISUALIZATION_TIMELINE_FILTER', _handleSelection);
    $element.off('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.off('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  function _handleWindowResize() {
    clearTimeout(rerenderOnResizeTimeout);

    rerenderOnResizeTimeout = setTimeout(
      _render,
      // Add some jitter in order to make sure multiple visualizations are
      // unlikely to all attempt to rerender themselves at the exact same
      // moment.
      WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
    );
  }

  function _render(vifToRender) {
    if (vifToRender) {
      _lastRenderedVif = vifToRender;
    }

    visualization.render(
      visualizationData,
      _getRenderOptions(_lastRenderedVif)
    );
  }

  function _handleVisualizationFlyout(event) {

    var payload = event.originalEvent.detail;
    var flyoutPayload = null;
    var flyoutContent = null;
    var flyoutTable = null;
    var flyoutElements = null;
    var flyoutTitle;
    var flyoutUnfilteredValueLabelCell;
    var flyoutUnfilteredValueCell;
    var flyoutUnfilteredValueRow;
    var filteredRowClass;
    var flyoutFilteredValueLabelCell;
    var flyoutFilteredValueCell;
    var flyoutFilteredValueRow;
    var flyoutSpacerRow;
    var flyoutSelectedNoticeLabel;
    var flyoutSelectedNoticeRow;

    if (payload !== null) {

      flyoutContent = $(document.createDocumentFragment());
      flyoutTable = $('<table>', { 'class': 'socrata-flyout-table' });
      flyoutElements = [];

      // 'Datum Title'
      flyoutTitle = $(
        '<div>',
        {
          'class': 'socrata-flyout-title'
        }
      ).text(payload.title);

      // 'Total: XXX rows'
      flyoutUnfilteredValueLabelCell = $(
        '<td>',
        {
          'class': 'socrata-flyout-cell'
        }
      ).text(payload.unfilteredLabel);

      flyoutUnfilteredValueCell = $(
        '<td>',
        {
          'class': 'socrata-flyout-cell'
        }
      ).text(payload.unfilteredValue);

      flyoutUnfilteredValueRow = $(
        '<tr>',
        {
          'class': 'socrata-flyout-row'
        }
      ).append([
        flyoutUnfilteredValueLabelCell,
        flyoutUnfilteredValueCell
      ]);

      flyoutElements.push(flyoutUnfilteredValueRow);

      // If we are showing filtered data, then
      // show the filtered data on the flyout.
      if (payload.hasOwnProperty('filteredValue')) {

        filteredRowClass = (payload.filteredBySelection) ?
          'socrata-flyout-cell is-selected' :
          'socrata-flyout-cell emphasis';

        // 'Filtered: XXX rows'
        flyoutFilteredValueLabelCell = $(
          '<td>',
          {
            'class': filteredRowClass
          }
        ).text(payload.filteredLabel);

        flyoutFilteredValueCell = $(
          '<td>',
          {
            'class': filteredRowClass
          }
        ).text(payload.filteredValue);

        flyoutFilteredValueRow = $(
          '<tr>',
          {
            'class': 'socrata-flyout-row'
          }
        ).append([
          flyoutFilteredValueLabelCell,
          flyoutFilteredValueCell
        ]);

        flyoutElements.push(flyoutFilteredValueRow);
      }

      // If we are hovering over a bar we are
      // currently filtering by, then display a special
      // flyout message.
      if (payload.selected) {

        // 'This visualization is currently filtered...'
        flyoutSpacerRow = $(
          '<tr>',
          {
            'class': 'socrata-flyout-row',
            'colspan': '2'
          }
        ).append(
          $('<td>', { 'class': 'socrata-flyout-cell' }).html('&#8203;')
        );

        flyoutSelectedNoticeLabel = $(
          '<td>',
          {
            'class': 'socrata-flyout-cell'
          }
        ).text(payload.selectedNotice);

        flyoutSelectedNoticeRow = $(
          '<tr>',
          {
            'class': 'socrata-flyout-row',
            'colspan': '2'
          }
        ).append([
          flyoutSelectedNoticeLabel
        ]);

        flyoutElements.push(flyoutSpacerRow);
        flyoutElements.push(flyoutSelectedNoticeRow);
      }

      flyoutTable.append(flyoutElements);

      flyoutContent.append([
        flyoutTitle,
        flyoutTable
      ]);

      flyoutPayload = {
        element: payload.element,
        content: flyoutContent,
        rightSideHint: false,
        belowTarget: false
      };
    }

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_TIMELINE_CHART_FLYOUT',
        {
          detail: flyoutPayload,
          bubbles: true
        }
      )
    );
  }

  function _handleSelection(event) {
    var payload = event.originalEvent.detail;
    var newVif = _.cloneDeep(_lastRenderedVif);
    var ownFilterStartEnd = newVif.
      filters.
      filter(function(filter) {
        return filter.columnName === newVif.columnName && filter.function === 'timeRangeFilter';
      }).map(function(filter) {
        return filter.arguments;
      });

    newVif.filters = newVif.
      filters.
      filter(function(filter) {
        return filter.columnName !== newVif.columnName;
      });

    if (
      payload !== null &&
      payload.hasOwnProperty('start') &&
      payload.hasOwnProperty('end')
    ) {

      newVif.filters.push(
        {
          'columnName': newVif.columnName,
          'function': 'timeRange',
          'arguments': {
            'start': payload.start.toISOString(),
            'end': payload.end.toISOString()
          }
        }
      );
    }

    $element[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_VIF_UPDATED',
        {
          detail: newVif,
          bubbles: true
        }
      )
    );
  }

  function _handleRenderVif(event) {
    var newVif = event.originalEvent.detail;

    if (newVif.type !== 'timelineChart') {
      throw new Error(
        'Cannot update VIF; old type: `timelineChart`, new type: `{0}`.'.
          format(
            newVif.type
          )
        );
    }

    _updateData(newVif);
  }

  /**
   * Data requests
   */

  function handleError(error) {
    _logError(error);
    visualization.renderError();
  }

  function _updateData(vifToRender) {
    var precisionQueryString = PRECISION_QUERY.format(
      vifToRender.columnName,
      MAX_LEGAL_JAVASCRIPT_DATE_STRING,
      SOQL_PRECISION_START_ALIAS,
      SOQL_PRECISION_END_ALIAS
    );

    var precisionPromise = vifToRender.configuration.precision ?
      Promise.resolve(vifToRender.configuration.precision) :
      precisionSoqlDataProvider.
        getRows(
          [SOQL_PRECISION_START_ALIAS, SOQL_PRECISION_END_ALIAS],
          '$query=' + precisionQueryString
        ).
        then(mapQueryResponseToPrecision);

    var dataPromise = precisionPromise.
      then(mapPrecisionToDataQuery).
      then(mapQueryToPromises);

    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    Promise.all([dataPromise, precisionPromise]).
      then(renderDataFromPromises).catch(handleError);

    function mapQueryResponseToPrecision(response) {
      var startIndex = _.indexOf(response.columns, SOQL_PRECISION_START_ALIAS);
      var endIndex = _.indexOf(response.columns, SOQL_PRECISION_END_ALIAS);
      var domainStartDate = _.head(response.rows)[startIndex];
      var domainEndDate = _.head(response.rows)[endIndex];

      var domain = {
        start: moment(domainStartDate, moment.ISO_8601),
        end: moment(domainEndDate, moment.ISO_8601)
      };

      if (!domain.start.isValid()) {
        domain.start = null;
        console.warn('Invalid start date on {0} ({1})'.format(vifToRender.columnName, domainStartDate));
      }

      if (!domain.end.isValid()) {
        domain.end = null;
        console.warn('Invalid end date on {0} ({1})'.format(vifToRender.columnName, domainEndDate));
      }

      // Return undefined if the domain is undefined, null, or malformed
      // in some way.  Later on, we will test if datasetPrecision is
      // undefined and display the proper error message.
      // By examining the return of getTimelineDomain, these are the
      // only checks we need.
      if (_.isUndefined(domain) || _.isNull(domain.start) || _.isNull(domain.end)) {
        throw 'Timeline Domain is invalid: {0}'.format(domain);
      }

      // Otherwise, return the precision as a string.
      // Moment objects are inherently mutable. Therefore, the .add()
      // call in the first condition will need to be accounted for in
      // the second condition. We're doing this instead of just cloning
      // the objects because moment.clone is surprisingly slow (something
      // like 40ms).
      if (domain.start.add('years', 1).isAfter(domain.end)) {
        precision = 'DAY';
      // We're actually checking for 20 years but have already added one
      // to the original domain start date in the if block above.
      } else if (domain.start.add('years', 19).isAfter(domain.end)) {
        precision = 'MONTH';
      } else {
        precision = 'YEAR';
      }

      return precision;
    }

    function mapPrecisionToDataQuery(precision) {
      var dateTruncFunction;
      var aggregationClause = SoqlHelpers.aggregationClause(vifToRender);

      switch (precision) {
        case 'YEAR':
          dateTruncFunction = 'date_trunc_y';
          break;
        case 'MONTH':
          dateTruncFunction = 'date_trunc_ym';
          break;
        case 'DAY':
          dateTruncFunction = 'date_trunc_ymd';
          break;
        default:
          throw 'precision was invalid: {0}'.format(precision);
      }

      return (
        DATA_QUERY_PREFIX.format(
          vifToRender.columnName,
          SOQL_DATA_PROVIDER_NAME_ALIAS,
          aggregationClause,
          SOQL_DATA_PROVIDER_VALUE_ALIAS,
          dateTruncFunction
        ) +
        ' {0} ' +
        DATA_QUERY_SUFFIX.format(SOQL_DATA_PROVIDER_NAME_ALIAS)
      );
    }

    function mapQueryToPromises(dataQueryString) {
      var unfilteredWhereClause = '{0} {1}'.format(
        DATA_QUERY_WHERE_CLAUSE_PREFIX,
        DATA_QUERY_WHERE_CLAUSE_SUFFIX.format(vifToRender.columnName, MAX_LEGAL_JAVASCRIPT_DATE_STRING)
      );
      var whereClauseFilterComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender);
      var filteredWhereClause = '{0} {1} {2} {3}'.format(
        DATA_QUERY_WHERE_CLAUSE_PREFIX,
        whereClauseFilterComponents,
        (whereClauseFilterComponents.length > 0) ? 'AND' : '',
        DATA_QUERY_WHERE_CLAUSE_SUFFIX.format(vifToRender.columnName, MAX_LEGAL_JAVASCRIPT_DATE_STRING)
      );
      var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
        query(
          dataQueryString.format(unfilteredWhereClause),
          SOQL_DATA_PROVIDER_NAME_ALIAS,
          SOQL_DATA_PROVIDER_VALUE_ALIAS
        ).catch(handleError);
      var filteredSoqlQuery = filteredSoqlDataProvider.
        query(
          dataQueryString.format(filteredWhereClause),
          SOQL_DATA_PROVIDER_NAME_ALIAS,
          SOQL_DATA_PROVIDER_VALUE_ALIAS
        ).catch(handleError);

      return Promise.all([unfilteredSoqlQuery, filteredSoqlQuery]);
    }

    function renderDataFromPromises(promiseResults) {
      var values = promiseResults[0];
      precision = promiseResults[1];
      var unfilteredQueryResponse = values[0];
      var filteredQueryResponse = values[1];

      $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');

      visualizationData = _mergeUnfilteredAndFilteredData(
        unfilteredQueryResponse,
        filteredQueryResponse,
        precision
      );

      _render(vifToRender);
    }
  }

  function _mergeUnfilteredAndFilteredData(unfiltered, filtered, precision) {

    var unfilteredAsHash = _.keyBy(
      unfiltered.rows,
      unfiltered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
    );
    var filteredAsHash = _.keyBy(
      filtered.rows,
      filtered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
    );
    var dates = Object.keys(unfilteredAsHash).map(function(date) {
      return moment((_.isNull(date) || _.isUndefined(date)) ? '' : date);
    });
    var timeStart = _.min(dates);
    var timeEnd = _.max(dates);
    var timeData = Array(timeEnd.diff(timeStart, precision));
    _.each(unfiltered.rows, function(item) {
      var date = item[DATE_INDEX];
      var dateAsMoment = moment((_.isNull(date) || _.isUndefined(date)) ? '' : date);
      var timeSlot = dateAsMoment.diff(timeStart, precision);

      // Default to null in case we don't receive a value associated with
      // this date. If we do not, the result of Number(item.value) is NaN
      // and the timeline chart breaks because it tries to use NaN to
      // calculate the height of the chart.
      var unfilteredValue = !_.isUndefined(item[UNFILTERED_INDEX]) ?
        Number(item[UNFILTERED_INDEX]) :
        null;

      var filteredValue;
      // If the filtered value exists, use it.
      if (filteredAsHash.hasOwnProperty(item[DATE_INDEX])) {
        filteredValue = Number(filteredAsHash[item[DATE_INDEX]][1]);
      } else {
        // If the filtered value does not exist but the unfiltered value for
        // the same date interval exists, then the value has just been filtered
        // and we should show '0'.
        if (!_.isUndefined(item[UNFILTERED_INDEX])) {
          filteredValue = 0;
        // If the unfiltered value for the same date interval does not exist,
        // then the value should actually be rendered as being null.
        } else {
          filteredValue = null;
        }
      }

      timeData[timeSlot] = {
        date: dateAsMoment,
        filtered: filteredValue,
        total: unfilteredValue
      };
    });

    return transformChartDataForRendering(
        _.map(timeData, function(item, i) {
          if (_.isUndefined(item)) {
            item = {
              date: moment(timeStart, moment.ISO_8601).add(i, precision),
              filtered: null,
              total: null
            };
          }
          return item;
        })
      );
  }

  function _logError(error) {
    if (console && _.isFunction(console.error)) {
      console.error(error);
    }
  }

  return this;
};

module.exports = $.fn.socrataTimelineChart;

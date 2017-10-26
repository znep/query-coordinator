var _ = require('lodash');
var $ = require('jquery');
var utils = require('common/js_utils');
var ColumnChart = require('./views/ColumnChart');
var SoqlDataProvider = require('./dataProviders/SoqlDataProvider');
var SoqlHelpers = require('./dataProviders/SoqlHelpers');

var NAME_INDEX = 0;
var UNFILTERED_INDEX = 1;
var FILTERED_INDEX = 2;
var SELECTED_INDEX = 3;
var SOQL_DATA_PROVIDER_NAME_ALIAS = '__NAME_ALIAS__';
var SOQL_DATA_PROVIDER_VALUE_ALIAS = '__VALUE_ALIAS__';
var BASE_QUERY = 'SELECT `{0}` AS {1}, {2} AS {3} {4} GROUP BY `{0}` ORDER BY {2} DESC NULL LAST LIMIT 200';
var WINDOW_RESIZE_RERENDER_DELAY = 200;

/**
 * Temporary polyfills until we can come up with a better implementation and include it somewhere else.
 */

String.prototype.visualSize = _.memoize(
  function(fontSize) {
    var $ruler = $('#ruler');
    var dimensions;

    if ($ruler.length < 1) {
      $('body').append('<span class="ruler" id="ruler"></span>');
      $ruler = $('#ruler');
    }
    if (!fontSize) {
      fontSize = '';
    }
    $ruler.css('font-size', fontSize);
    $ruler.text(this + '');
    dimensions = { width: $ruler.width(), height: $ruler.height() };
    $ruler.remove();

    return dimensions;
  },
  function(fontSize) { // memoization key
    return this + '|' + fontSize;
  }
);

String.prototype.visualLength = function(fontSize) {
  return this.visualSize(fontSize).width;
};

/**
 * Instantiates a Socrata ColumnChart Visualization.
 *
 * Supported event triggers:
 * - invalidateSize: Forces a rerender, useful if the hosting page has resized the container.
 *
 * @param vif - https://docs.google.com/document/d/15oKmDfv39HrhgCJRTKtYadG8ZQvFUeyfx4kR_NZkBgc
 */
$.fn.socrataColumnChart = function(vif) {

  utils.assertHasProperties(
    vif,
    'columnName',
    'configuration',
    'datasetUid',
    'domain',
    'unit'
  );

  utils.assertHasProperties(
    vif.unit,
    'one',
    'other'
  );

  utils.assertHasProperties(
    vif.configuration,
    'localization'
  );

  utils.assertHasProperties(
    vif.configuration.localization,
    'no_value',
    'flyout_unfiltered_amount_label',
    'flyout_filtered_amount_label',
    'flyout_selected_notice'
  );

  var $element = $(this);

  // SoQL returns row results for display as columns.
  // We need separate data providers for 'unfiltered'
  // and 'filtered' requests, which are merged below.
  var unfilteredSoqlDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
  };
  var unfilteredSoqlDataProvider = new SoqlDataProvider(
    unfilteredSoqlDataProviderConfig
  );

  var filteredSoqlDataProviderConfig = {
    domain: vif.domain,
    datasetUid: vif.datasetUid
  };
  var filteredSoqlDataProvider = new SoqlDataProvider(
    filteredSoqlDataProviderConfig
  );

  vif.configuration.columns = {
    name: NAME_INDEX,
    unfilteredValue: UNFILTERED_INDEX,
    filteredValue: FILTERED_INDEX,
    selected: SELECTED_INDEX
  };

  var visualization = new ColumnChart($element, vif);
  var visualizationData = [];
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
      showFiltered: true,
      rescaleAxis: false,
      vif: vifToRender
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

    $element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
    $element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleSelection);
    $element.on('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
    $element.on('SOCRATA_VISUALIZATION_INVALIDATE_SIZE', visualization.invalidateSize);
    $element.on('SOCRATA_VISUALIZATION_RENDER_VIF', _handleRenderVif);
  }

  function _detachEvents() {

    $(window).off('resize', _handleWindowResize);

    $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
    $element.off('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleSelection);
    $element.off('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
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

    if (_.get(_lastRenderedVif, 'configuration.isMobile')) {
      _selectFirst();
    }
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
      ).text(payload.unfilteredValueLabel);

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

        filteredRowClass = (payload.selected) ?
          'socrata-flyout-cell is-selected' :
          'socrata-flyout-cell emphasis';

        // 'Filtered: XXX rows'
        flyoutFilteredValueLabelCell = $(
          '<td>',
          {
            'class': filteredRowClass
          }
        ).text(payload.filteredValueLabel);

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
        'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT',
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
    var ownFilterOperands = newVif.
      filters.
      filter(function(filter) {
        return filter.columnName === newVif.columnName;
      }).map(function(filter) {
        return filter.arguments.operand;
      });

    newVif.filters = newVif.
      filters.
      filter(function(filter) {
        return filter.columnName !== newVif.columnName;
      });

    if (ownFilterOperands.indexOf(payload.name) === -1) {

      newVif.filters.push(
        {
          'columnName': newVif.columnName,
          'function': 'binaryOperator',
          'arguments': {
            'operator': '=',
            'operand': payload.name
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

  function _handleExpandedToggle() { // event) { ---> Linting sucks

    // var payload = event.originalEvent.detail;

    // TODO: Implement.
  }

  function _handleRenderVif(event) {
    var newVif = event.originalEvent.detail;

    if (newVif.type !== 'columnChart') {
      throw new Error(
        'Cannot update VIF; old type: `columnChart`, new type: `{0}`.'.
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

  function _updateData(vifToRender) {
    $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_START');

    var aggregationClause = SoqlHelpers.aggregationClause(vifToRender);
    var whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(vifToRender);
    var unfilteredQueryString = BASE_QUERY.format(
      vifToRender.columnName,
      SOQL_DATA_PROVIDER_NAME_ALIAS,
      aggregationClause,
      SOQL_DATA_PROVIDER_VALUE_ALIAS,
      ''
    );
    var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
      query(
        unfilteredQueryString,
        SOQL_DATA_PROVIDER_NAME_ALIAS,
        SOQL_DATA_PROVIDER_VALUE_ALIAS
      ).catch(function(error) {
        _logError(error);
        visualization.renderError();
      });
    var filteredQueryString = BASE_QUERY.format(
      vifToRender.columnName,
      SOQL_DATA_PROVIDER_NAME_ALIAS,
      aggregationClause,
      SOQL_DATA_PROVIDER_VALUE_ALIAS,
      (whereClauseComponents.length > 0) ?
        'WHERE {0}'.format(whereClauseComponents) :
        ''
    );
    var filteredSoqlQuery = filteredSoqlDataProvider.
      query(
        filteredQueryString,
        SOQL_DATA_PROVIDER_NAME_ALIAS,
        SOQL_DATA_PROVIDER_VALUE_ALIAS
      ).catch(function(error) {
        _logError(error);
        visualization.renderError();
      });

    Promise.
      all([unfilteredSoqlQuery, filteredSoqlQuery]).
      then(function(values) {
        var unfilteredQueryResponse = values[0];
        var filteredQueryResponse = values[1];

        visualizationData = _mergeUnfilteredAndFilteredData(
          vifToRender,
          unfilteredQueryResponse,
          filteredQueryResponse
        );

        _render(vifToRender);
        $element.trigger('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
      }).catch(function(error) {
        _logError(error);
        visualization.renderError();
      });
  }

  function _mergeUnfilteredAndFilteredData(renderedVif, unfiltered, filtered) {
    var unfilteredAsHash;
    var filteredAsHash;
    var selectedColumns = renderedVif.
      filters.
      filter(function(filter) {
        return filter.columnName === renderedVif.columnName;
      }).
      map(function(filter) {
        return filter.arguments.operand;
      });

    unfilteredAsHash = _.keyBy(
      unfiltered.rows,
      unfiltered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
    );

    filteredAsHash = _.keyBy(
      filtered.rows,
      filtered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
    );

    return Object.keys(unfilteredAsHash).map(function(name) {
      var datumIsSelected = selectedColumns.indexOf(name) > -1;
      var result = [undefined, undefined, undefined, undefined];

      result[NAME_INDEX] = (_.isNull(name) || _.isUndefined(name)) ? '' : name;
      result[UNFILTERED_INDEX] = Number(unfilteredAsHash[name][1]);
      result[FILTERED_INDEX] = (filteredAsHash.hasOwnProperty(name)) ?
        Number(filteredAsHash[name][1]) :
        0;
      result[SELECTED_INDEX] = datumIsSelected;

      return result;
    });
  }

  function _logError(error) {
    if (window.console && window.console.error) {
      console.error(error);
    }
  }

  function _selectFirst() {
    var chartWidth = (visualization.element.find('.bar-group').length * 50) + 33;
    visualization.element.find('.ticks').css('min-width', chartWidth + 'px');
    visualization.element.find('.column-chart-wrapper').css('min-width', chartWidth + 'px');
    visualization.element.find('.bar-group').first().click();
  }

  return this;
};

module.exports = $.fn.socrataColumnChart;

(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var utils = socrata.utils;
  var visualizations = socrata.visualizations;

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;
  var SELECTED_INDEX = 3;
  var SOQL_DATA_PROVIDER_NAME_ALIAS = '__NAME_ALIAS__';
  var SOQL_DATA_PROVIDER_VALUE_ALIAS = '__VALUE_ALIAS__';
  var BASE_QUERY = 'SELECT `{0}` AS {1}, COUNT(*) AS {2} GROUP BY `{0}` ORDER BY COUNT(*) DESC NULL LAST LIMIT 200';
  var WINDOW_RESIZE_RERENDER_DELAY = 200;

  /**
   * Temporary polyfills until we can come up with a better implementation and include it somewhere else.
   */

  String.prototype.visualSize = function(fontSize) {

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
    dimensions = {width: $ruler.width(), height: $ruler.height()};
    $ruler.remove();

    return dimensions;
  };

  String.prototype.visualLength = function(fontSize) {
    return this.visualSize(fontSize).width;
  };

  /**
   * Instantiates a Socrata ColumnChart Visualization from the
   * `socrata-visualizations` package.
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
      'NO_VALUE',
      'FLYOUT_UNFILTERED_AMOUNT_LABEL',
      'FLYOUT_FILTERED_AMOUNT_LABEL',
      'FLYOUT_SELECTED_NOTICE'
    );

    this.destroySocrataColumnChart = function() {

      clearTimeout(rerenderOnResizeTimeout);
      visualization.destroy();
      _detachEvents();
    };

    var $element = $(this);

    // SoQL returns row results for display as columns.
    // We need separate data providers for 'unfiltered'
    // and 'filtered' requests, which are merged below.
    var unfilteredSoqlDataProviderConfig = {
      domain: vif.domain,
      datasetUid: vif.datasetUid
    };
    var unfilteredSoqlDataProvider = new socrata.visualizations.SoqlDataProvider(
      unfilteredSoqlDataProviderConfig
    );

    var filteredSoqlDataProviderConfig = {
      domain: vif.domain,
      datasetUid: vif.datasetUid
    };
    var filteredSoqlDataProvider = new socrata.visualizations.SoqlDataProvider(
      filteredSoqlDataProviderConfig
    );

    vif.configuration.columns = {
      name: NAME_INDEX,
      unfilteredValue: UNFILTERED_INDEX,
      filteredValue: FILTERED_INDEX,
      selected: SELECTED_INDEX
    };

    var visualization = new visualizations.ColumnChart($element, vif);
    var visualizationData = [];
    var rerenderOnResizeTimeout;

    _attachEvents();
    _updateData();

    /**
     * Configuration
     */

    function _getRenderOptions() {
      return {
        showAllLabels: true,
        showFiltered: false
      };
    }

    /**
     * Event handling
     */

    function _attachEvents() {

      $(window).on('resize', _handleWindowResize);
      $element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
      $element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleDatumSelect);
      $element.on('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
    }

    function _detachEvents() {

      $(window).off('resize', _handleWindowResize);
      $element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
      $element.off('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleDatumSelect);
      $element.off('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
    }

    function _handleWindowResize() {

      clearTimeout(rerenderOnResizeTimeout);

      rerenderOnResizeTimeout = setTimeout(
        function() {
          visualization.render(
            visualizationData,
            _getRenderOptions()
          );
        },
        // Add some jitter in order to make sure multiple visualizations are
        // unlikely to all attempt to rerender themselves at the exact same
        // moment.
        WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
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
        new root.CustomEvent(
          'SOCRATA_VISUALIZATION_COLUMN_CHART_FLYOUT',
          {
            detail: flyoutPayload,
            bubbles: true
          }
        )
      );
    }

    function _handleDatumSelect() {// event) { ---> Linting sucks

      // var payload = event.originalEvent.detail;

      // TODO: Implement.
    }

    function _handleExpandedToggle() {// event) { ---> Linting sucks

      // var payload = event.originalEvent.detail;

      // TODO: Implement.
    }

    /**
     * Data requests
     */

    function _updateData() {

      var queryString = BASE_QUERY.format(
        vif.columnName,
        SOQL_DATA_PROVIDER_NAME_ALIAS,
        SOQL_DATA_PROVIDER_VALUE_ALIAS
      );

      var unfilteredSoqlQuery = unfilteredSoqlDataProvider.
        query(queryString, SOQL_DATA_PROVIDER_NAME_ALIAS, SOQL_DATA_PROVIDER_VALUE_ALIAS)
        ['catch'](function(error) {
          _logError(error);
          visualization.renderError();
        });

      var filteredSoqlQuery = filteredSoqlDataProvider.
        query(queryString, SOQL_DATA_PROVIDER_NAME_ALIAS, SOQL_DATA_PROVIDER_VALUE_ALIAS)
        ['catch'](function(error) {
          _logError(error);
          visualization.renderError();
        });

      Promise.
        all([unfilteredSoqlQuery, filteredSoqlQuery]).
        then(function(values) {
          var unfilteredQueryResponse = values[0];
          var filteredQueryResponse = values[1];

          visualizationData = _mergeUnfilteredAndFilteredData(
            unfilteredQueryResponse,
            filteredQueryResponse
          );

          visualization.render(
            visualizationData,
            _getRenderOptions()
          );
        })
        ['catch'](function(error) {
          _logError(error);
          visualization.renderError();
        });
    }

    function _mergeUnfilteredAndFilteredData(unfiltered, filtered) {

      var unfilteredAsHash;
      var filteredAsHash;

      unfilteredAsHash = _.indexBy(
        unfiltered.rows,
        unfiltered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
      );

      filteredAsHash = _.indexBy(
        filtered.rows,
        filtered.columns.indexOf(SOQL_DATA_PROVIDER_NAME_ALIAS)
      );

      return Object.keys(unfilteredAsHash).map(function(name) {

        var datumIsSelected = false;

        var result = [undefined, undefined, undefined, undefined];

        result[NAME_INDEX] = (_.isNull(name) || _.isUndefined(name)) ? '' : name;
        result[UNFILTERED_INDEX] = Number(unfilteredAsHash[name][1]);
        result[FILTERED_INDEX] = Number(filteredAsHash[name][1]) || 0;
        result[SELECTED_INDEX] = datumIsSelected;

        return result;
      });
    }

    function _logError(error) {
      if (window.console && window.console.error) {
        console.error(error);
      }
    }

    return this;
  };
}(jQuery, window));

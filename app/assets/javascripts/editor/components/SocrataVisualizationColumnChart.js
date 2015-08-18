(function($, root) {

  'use strict';

  var socrata = root.socrata;
  var visualizations = socrata.visualizations;
  var utils = socrata.utils;

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;
  var SELECTED_INDEX = 3;

  /**
   * Instantiates a Socrata ColumnChart Visualization from the
   * `socrata-visualizations` package.
   *
   * @param {String} domain - The domain against which to make the query.
   * @param {String} fourByFour - The uid of the dataset backing this
   *   visualization. The referenced dataset must be of the 'NBE' type.
   * @param {String} baseQuery - A valid SoQL query string.
   */

  $.fn.socrataVisualizationColumnChart = function(domain, fourByFour, baseQuery) {

    utils.assertIsOneOfTypes(domain, 'string');
    utils.assertIsOneOfTypes(fourByFour, 'string');
    utils.assertIsOneOfTypes(baseQuery, 'string');

    var _element = $(this);
    var _visualizationConfig = {
      columns: {
        name: NAME_INDEX,
        unfilteredValue: UNFILTERED_INDEX,
        filteredValue: FILTERED_INDEX,
        selected: SELECTED_INDEX
      },
      localization: {
        'NO_VALUE': I18n.t('visualizations.no_value_placeholder'),
        'FLYOUT_UNFILTERED_AMOUNT_LABEL': I18n.t('visualizations.flyout.unfiltered_amount_label'),
        'FLYOUT_FILTERED_AMOUNT_LABEL': I18n.t('visualizations.flyout.unfiltered_amount_label'),
        'FLYOUT_SELECTED_NOTICE': I18n.t('visualizations.flyout.datum_selected_label')
      }
    };
    var _unfilteredConfig = {
      domain: domain,
      fourByFour: fourByFour,
      success: _onUnfilteredSuccess,
      error: _onUnfilteredError
    };
    var _filteredConfig = {
      domain: domain,
      fourByFour: fourByFour,
      success: _onFilteredSuccess,
      error: _onFilteredError
    };
    var _visualization = new visualizations.ColumnChart(_element, _visualizationConfig);
    var _unfilteredDataProvider = new visualizations.SoqlDataProvider(_unfilteredConfig);
    var _filteredDataProvider = new visualizations.SoqlDataProvider(_filteredConfig);
    var _unfilteredRequestInFlight;
    var _filteredRequestInFlight;
    var _unfilteredData;
    var _filteredData;
    var _visualizationData = [];
    var _rerenderOnResizeTimeout;

    _attachEvents();
    _updateData();

    /**
     * Configuration
     */

    function _getRenderOptions() {
      return {
        showAllLabels: true,
        labelUnit: 'rows',
        showFiltered: false
      };
    }

    /**
     * Event handling
     */

    function _attachEvents() {

      $(window).on('resize', _handleWindowResize);
      _element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
      _element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleDatumSelect);
      _element.on('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
      _element.on('SOCRATA_VISUALIZATION_DESTROY', _handleDestroy);
    }

    function _detachEvents() {

      $(window).off('resize', _handleWindowResize);
      _element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
      _element.off('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleDatumSelect);
      _element.off('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
      _element.off('SOCRATA_VISUALIZATION_DESTROY', _handleDestroy);
    }

    function _handleWindowResize() {

      clearTimeout(_rerenderOnResizeTimeout);

      _rerenderOnResizeTimeout = setTimeout(
        function() {
          _visualization.render(
            _visualizationData,
            _getRenderOptions()
          );
        },
        // Add some jitter in order to make sure multiple visualizations are
        // unlikely to all attempt to rerender themselves at the exact same
        // moment.
        Constants.WINDOW_RESIZE_RERENDER_DELAY + Math.floor(Math.random() * 10)
      );
    }

    function _handleVisualizationFlyout(event) {

      var payload = event.originalEvent.detail.data;
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

      if (payload === null) {

        storyteller.flyoutRenderer.clearFlyout();

      } else {

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
        ).text(
          '{0} {1}'.format(
            utils.formatNumber(payload.unfilteredValue),
            payload.labelUnit
          )
        );

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
          ).text(
            '{0} {1}'.format(
              utils.formatNumber(payload.filteredValue),
              payload.labelUnit
            )
          );

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
          ).append([
            $('<td>', { 'class': 'socrata-flyout-cell' }).html('&#8203;'),
          ]);

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
          flyoutElements.push(flyoutSelectedNoticeRow)
        }

        flyoutTable.append(flyoutElements);

        flyoutContent.append([
          flyoutTitle,
          flyoutTable
        ]);

        storyteller.flyoutRenderer.renderFlyout({
          element: payload.element,
          content: flyoutContent,
          rightSideHint: false,
          belowTarget: false
        });
      }
    }

    function _handleDatumSelect(event) {

      var payload = event.originalEvent.detail;

      // TODO: Implement.
    }

    function _handleExpandedToggle(event) {

      var payload = event.originalEvent.detail;

      // TODO: Implement.
    }

    function _handleDestroy() {

      // TODO: Cancel in-flight requests or convert their callbacks into noops.

      clearTimeout(_rerenderOnResizeTimeout);
      _visualization.destroy();
      _detachEvents();
    }

    /**
     * Data requests
     */

    function _updateData() {

      _unfilteredRequestInFlight = true;
      _filteredRequestInFlight = true;

      _unfilteredDataProvider.query(
        baseQuery,
        Constants.SOQL_DATA_PROVIDER_NAME_ALIAS,
        Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS
      );

      _filteredDataProvider.query(
        baseQuery,
        Constants.SOQL_DATA_PROVIDER_NAME_ALIAS,
        Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS
      );
    }

    function _onUnfilteredSuccess(data) {

      _unfilteredRequestInFlight = false;
      _unfilteredData = data;

      _onRequestComplete();
    }

    function _onUnfilteredError() {

      _unfilteredRequestInFlight = false;
      _unfilteredData = null;

      _onRequestComplete();
    }

    function _onFilteredSuccess(data) {

      _filteredRequestInFlight = false;
      _filteredData = data;

      _onRequestComplete();
    }

    function _onFilteredError() {

      _filteredRequestInFlight = false;
      _filteredData = null;

      _onRequestComplete();
    }

    function _onRequestComplete() {

      if (!_unfilteredRequestInFlight && !_filteredRequestInFlight) {

        if (_unfilteredData !== null && _filteredData !== null) {

          _visualizationData = _mergeUnfilteredAndFilteredData(
            _unfilteredData,
            _filteredData
          );

          _visualization.render(
            _visualizationData,
            _getRenderOptions()
          );
        } else {

          _visualization.renderError();
        }
      }
    }

    function _mergeUnfilteredAndFilteredData(unfiltered, filtered) {

      var unfilteredAsHash;
      var filteredAsHash;

      unfilteredAsHash = _.indexBy(
        unfiltered.rows,
        unfiltered.columns.indexOf(Constants.SOQL_DATA_PROVIDER_NAME_ALIAS)
      );

      filteredAsHash = _.indexBy(
        filtered.rows,
        filtered.columns.indexOf(Constants.SOQL_DATA_PROVIDER_NAME_ALIAS)
      );

      return Object.keys(unfilteredAsHash).map(function(name) {

        var datumIsSelected = false;

        var result = [undefined, undefined, undefined, undefined];

        result[NAME_INDEX] = (_.isNull(name) || _.isUndefined(name)) ? '' : name;
        result[UNFILTERED_INDEX] = unfilteredAsHash[name][1];
        result[FILTERED_INDEX] = filteredAsHash[name][1] || 0;
        result[SELECTED_INDEX] = datumIsSelected;

        return result;
      });
    }

    return this;
  };
}(jQuery, window));

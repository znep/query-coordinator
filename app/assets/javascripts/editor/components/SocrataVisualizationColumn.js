;(function($, socrata) {

  'use strict'

  var storyteller = socrata.storyteller;
  var visualizations = socrata.visualizations;
  var utils = socrata.utils;

  var NAME_INDEX = 0;
  var UNFILTERED_INDEX = 1;
  var FILTERED_INDEX = 2;
  var SELECTED_INDEX = 3;

  /**
   * Temporary polyfills until we can come up with a better implementation.
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

  String.prototype.visualHeight = function(fontSize) {
    return this.visualSize(fontSize).height;
  };

  String.prototype.visualLength = function(fontSize) {
    return this.visualSize(fontSize).width;
  };

  /**
   * Instantiates a Socrata Column Visualization from the
   * `socrata-visualizations` package.
   * 
   * @param {String} fourByFour - The uid of the dataaset backing this
   *   visualization.
   * @param {String} baseQuery - A valid SoQL query string.
   */

  $.fn.socrataVisualizationColumn = function(fourByFour, baseQuery) {

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
      fourByFour: fourByFour,
      success: _onUnfilteredSuccess,
      error: _onUnfilteredError
    };
    var _filteredConfig = {
      fourByFour: fourByFour,
      success: _onFilteredSuccess,
      error: _onFilteredError
    };
    var _visualization = new visualizations.Column(_element, _visualizationConfig);
    var _unfilteredDataProvider = new visualizations.SoqlDataProvider(_unfilteredConfig);
    var _filteredDataProvider = new visualizations.SoqlDataProvider(_filteredConfig);
    var _unfilteredRequestInFlight;
    var _filteredRequestInFlight;
    var _unfilteredData;
    var _filteredData;

    _attachEvents();
    _updateData();

    /**
     * Configuration
     */

    function _attachEvents() {
      _element.on('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
      _element.on('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleDatumSelect);
      _element.on('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
      _element.on('SOCRATA_VISUALIZATION_DESTROY', _handleDestroy);
    }

    function _detachEvents() {
      _element.off('SOCRATA_VISUALIZATION_COLUMN_FLYOUT', _handleVisualizationFlyout);
      _element.off('SOCRATA_VISUALIZATION_COLUMN_SELECTION', _handleDatumSelect);
      _element.off('SOCRATA_VISUALIZATION_COLUMN_OPTIONS', _handleExpandedToggle);
      _element.off('SOCRATA_VISUALIZATION_DESTROY', _handleDestroy);
    }

    function _getRenderOptions() {
      return {
        expanded: true,
        labelUnit: 'rows',
        showFiltered: false
      };
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

    function _onUnfilteredError(error) {

      _unfilteredRequestInFlight = false;
      _unfilteredData = null;

      _onRequestComplete();
    }

    function _onFilteredSuccess(data) {

      _filteredRequestInFlight = false;
      _filteredData = data;

      _onRequestComplete();
    }

    function _onFilteredError(error) {

      _filteredRequestInFlight = false;
      _filteredData = null;

      _onRequestComplete();
    }

    function _onRequestComplete() {

      if (!_unfilteredRequestInFlight && !_filteredRequestInFlight) {

        if (_unfilteredData !== null && _filteredData !== null) {

          _visualization.render(
            _mergeUnfilteredAndFilteredData(_unfilteredData, _filteredData),
            _getRenderOptions()
          );
        } else {

          _visualization.renderError();
        }
      }
    }

    function _mergeUnfilteredAndFilteredData(unfiltered, filtered) {

      var nameIndex;
      var valueIndex;
      var unfilteredAsHash;
      var filteredAsHash;
      var results;

      nameIndex = unfiltered.columns.indexOf(Constants.SOQL_DATA_PROVIDER_NAME_ALIAS);
      valueIndex = unfiltered.columns.indexOf(Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS);

      unfilteredAsHash = _.reduce(unfiltered.rows, function(acc, datum) {
        acc[datum[nameIndex]] = datum[valueIndex];
        return acc;
      }, {});

      nameIndex = filtered.columns.indexOf(Constants.SOQL_DATA_PROVIDER_NAME_ALIAS);
      valueIndex = filtered.columns.indexOf(Constants.SOQL_DATA_PROVIDER_VALUE_ALIAS);

      filteredAsHash = _.reduce(filtered.rows, function(acc, datum) {
        acc[datum[nameIndex]] = datum[valueIndex];
        return acc;
      }, {});

      results = [];

      Object.keys(unfilteredAsHash).forEach(function(name) {

        var datumIsSelected = false;

        var result = [undefined, undefined, undefined, undefined];

        result[NAME_INDEX] = (_.isNull(name) || _.isUndefined(name)) ? '' : name;
        result[UNFILTERED_INDEX] = unfilteredAsHash[name];
        result[FILTERED_INDEX] = filteredAsHash[name] || 0;
        result[SELECTED_INDEX] = datumIsSelected;

        results.push(result);
      });

      return results;
    }

    /**
     * Event handling
     */

    function _handleVisualizationFlyout(event) {

      var payload = event.originalEvent.detail;

      // TODO: Implement.
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

      _visualization.destroy();
      _detachEvents();
    }

    return this;
  };
}(jQuery, window.socrata));

(function(root) {

  'use strict';

  if (!_.has(root, 'socrata.visualizations.DataProvider')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.DataProvider.js',
          'socrata.visualizations.SoqlDataProvider.js'
        )
    );
  }

  var utils = root.socrata.utils;

  /**
   * `SoqlDataProvider` is an implementation of `DataProvider` that enables
   * users to query SoQL data sources on the current domain.
   *
   * @constructor
   *
   * @param {Object} config
   *  @property {String} fourByFour - The uid of the dataset against which
   *    the user intends to query.
   *  @property {Function} success - The function to be called with successful
   *    query results.
   *  @property {Function} error - The function to be called on failure.
   *
   * See the documentation for `_onRequestSuccess()` and `_onRequestError()`
   * below for the expected function signatures for the success and error
   * callbacks, respectively.
   */
  function SoqlDataProvider(config) {

    _.extend(this, new root.socrata.visualizations.DataProvider(config));

    utils.assertHasProperty(config, 'fourByFour');
    utils.assertIsOneOfTypes(config.fourByFour, 'string');

    utils.assertHasProperty(config, 'success');
    utils.assertIsOneOfTypes(config.success, 'function');

    utils.assertHasProperty(config, 'error');
    utils.assertIsOneOfTypes(config.error, 'function');

    var _uid = config.fourByFour;
    var _headers = {
      'Accept': 'application/json',
      'Content-type': 'application/json',
    };
    var _successCallback = config.success;
    var _errorCallback = config.error;

    /**
     * Public methods
     */

    /**
     * `.query()` executes a SoQL query against the current domain. The query
     * string is passed in by the caller, meaning that at this level of
     * abstraction we have no notion of SoQL grammar.
     *
     * A note on `nameAlias` and `valueAlias`:
     *
     *   Since it is possible that columns have names that may collide with
     *   SoQL keywords (e.g. a column named 'null'), we alias all fields in
     *   the SELECT clause like this:
     *
     *     "SELECT `null` as ALIAS_NAME, `false` AS ALIAS_VALUE..."
     *
     *   These aliases are set by the caller and will also be used as column
     *   names in the resulting 'table' object returned by the request.
     *
     * @param {String} queryString - A valid SoQL query.
     * @param {String} nameAlias - The alias used for the 'name' column.
     * @param {String} valueAlias - The alias used for the 'value' column.
     *
     * @return - None; the user-supplied `config.success` or `config.error`
     *   functions provided at instantiation will be called with the 'table'
     *   object containing the query results (in the case of success) or with
     *   an object contiaining details about the encountered error (in the
     *   case of failure).
     */
    this.query = function(queryString, nameAlias, valueAlias) {

      // Call _soqlQuery with `this` context in order to be able to call
      // `.getconfigurationProperty()` on the parent class.
      _soqlQuery.apply(this, arguments);
    };

    /**
     * Private methods
     */

    function _soqlQuery(queryString, nameAlias, valueAlias) {

      $.ajax(
        _buildUrl(queryString),
        {
          headers: _headers,
          error: _onRequestError,
          success: function(data) {
            _onRequestSuccess(data, nameAlias, valueAlias)
          },
          timeout: this.getConfigurationProperty('timeout'),
          type: 'GET'
        }
      );
    }

    function _buildUrl(queryString) {

      return '/api/id/{0}.json?$query={1}'.format(
        encodeURIComponent(_uid),
        encodeURIComponent(queryString)
      );
    }

    /**
     * In the event of a request failure, this function will invoke the
     * user-supplied `error` callback with an object of the following
     * construction:
     *
     * @param {Object}
     *   @property {Number} status - The HTTP error status code.
     *   @property {String} message - The HTTP error message.
     *   @property {Object} soqlError - An object containing more detailed
     *     failure information from the SoQL backend.
     */
    function _onRequestError(response) {
      _errorCallback({
        code: response.status,
        message: response.statusText,
        soqlError: JSON.parse(response.responseText)
      });
    }

    /**
     * When a request succeeds this function will invoke the user-supplied
     * `success` callback with the following arguments:
     *
     * @param {Object} data - The 'table' object representing the query
     *   results. See the documentation for `_mapDataToTable()` below for
     *   details on structure.
     * @param {String} nameAlias - The alias used for the 'name' column in
     *   the successful query.
     * @param {String} valueAlias - The alias used for the 'value' column in
     *   the successful query.
     */
    function _onRequestSuccess(data, nameAlias, valueAlias) {
      _successCallback(_mapDataToTable(data, nameAlias, valueAlias));
    }

    /**
     * Transforms raw SoQL query result into a 'table' object.
     *
     * @param {Object[]} data - The query result, which is an array of objects
     *   with keys equal to the `nameAlias` and `valueAlias` used in the query
     *   and values equal to the row values for those columns.
     * @param {String} nameAlias - The alias used for the 'name' column in
     *   the query.
     * @param {String} valueAlias - The alias used for the 'value' column in
     *   the query.
     *
     * @return {Object}
     *   @property {String[]} columns - An ordered list of the column aliases
     *     present in the query.
     *   @property {[][]} rows - An array of rows returned by the query.
     *
     * The columns array is of the format:
     *
     *   [<value of `nameAlias`>, <value of `valueAlias`>]
     *
     * Accordingly, each row in the rows array is of the format:
     *
     *   [
     *     <row value of the `nameAlias` column>,
     *     <row value of the `valueAlias` column>
     *   ]
     */
    function _mapDataToTable(data, nameAlias, valueAlias) {

      return {
        columns: [nameAlias, valueAlias],
        rows: data.map(function(datum) {

          return [
            datum[nameAlias],
            datum[valueAlias]
          ];
        })
      };
    }
  }

  root.socrata.visualizations.SoqlDataProvider = SoqlDataProvider;
})(window);

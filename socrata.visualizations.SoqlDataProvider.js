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
   *  @property {String} domain - The domain against which to make the query.
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

    utils.assertHasProperty(config, 'domain');
    utils.assertHasProperty(config, 'fourByFour');

    utils.assertIsOneOfTypes(config.domain, 'string');
    utils.assertIsOneOfTypes(config.fourByFour, 'string');

    var _self = this;




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
     * @return {Promise}
     */
    this.query = function(queryString, nameAlias, valueAlias) {

      var url = 'https://{0}/api/id/{1}.json?$query={2}'.format(
        _self.getConfigurationProperty('domain'),
        _self.getConfigurationProperty('fourByFour'),
        queryString
      );
      var headers = {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      };

      function handleRequestSuccess(response) {
        return _mapDataToTable(response.data, nameAlias, valueAlias)
      }

      function handleRequestError(error) {
        return error;
      }

      return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();

        function onFail() {

          reject({
            status: parseInt(xhr.status, 10),
            headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
            config: config,
            statusText: xhr.statusText
          });
        }

        xhr.onload = function() {

          var status = parseInt(xhr.status, 10);

          if (status === 200) {

            resolve({
              data: JSON.parse(xhr.responseText),
              status: status,
              headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
              config: config,
              statusText: xhr.statusText
            });

          }

          onFail();
        };

        xhr.onabort = onFail;
        xhr.onerror = onFail;

        xhr.open('GET', url, true);

        // Set user-defined headers.
        _.each(headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.send();
      }).then(
        handleRequestSuccess,
        handleRequestError
      );
    };

    this.getRows = function(queryString) {

      var url = 'https://{0}/api/id/{1}.json?{2}'.format(
        _self.getConfigurationProperty('domain'),
        _self.getConfigurationProperty('fourByFour'),
        queryString
      );
      var headers = {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      };

      function handleRequestSuccess(response) {
        return response.data;
      }

      function handleRequestError(error) {
        return error;
      }

      return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest();

        function onFail() {

          reject({
            status: parseInt(xhr.status, 10),
            headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
            config: config,
            statusText: xhr.statusText
          });
        }

        xhr.onload = function() {

          var status = parseInt(xhr.status, 10);

          if (status === 200) {

            resolve({
              data: JSON.parse(xhr.responseText),
              status: status,
              headers: _self.parseHeaders(xhr.getAllResponseHeaders()),
              config: config,
              statusText: xhr.statusText
            });

          }

          onFail();
        };

        xhr.onabort = onFail;
        xhr.onerror = onFail;

        xhr.open('GET', url, true);

        // Set user-defined headers.
        _.each(headers, function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.send();
      }).then(
        handleRequestSuccess,
        handleRequestError
      );
    };

    /**
     * Private methods
     */

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
            Number(datum[valueAlias])
          ];
        })
      };
    }
  }

  root.socrata.visualizations.SoqlDataProvider = SoqlDataProvider;
})(window);

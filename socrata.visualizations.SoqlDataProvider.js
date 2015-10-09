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
   *  @property {String} datasetUid - The uid of the dataset against which
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
    utils.assertHasProperty(config, 'datasetUid');

    utils.assertIsOneOfTypes(config.domain, 'string');
    utils.assertIsOneOfTypes(config.datasetUid, 'string');

    var _self = this;

    /**
     * Public methods
     */

    this.buildBaseQuery = function(filters) {
      // TODO: Implement mapping of filters array into a query string
      return '';
    };

    /**
     * `.query()` executes a SoQL query against the current domain that returns
     * key => value pairs. The query string is passed in by the caller, meaning
     * that at this level of abstraction we have no notion of SoQL grammar.
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
        _self.getConfigurationProperty('datasetUid'),
        queryString
      );
      var headers = {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      };

      return (
        new Promise(function(resolve, reject) {

          var xhr = new XMLHttpRequest();

          function onFail() {

            var error;

            try {
              error = JSON.parse(xhr.responseText);
            } catch (e) {
              error = xhr.statusText;
            }

            if ( parseInt(xhr.status, 10) === 304) {
                data = JSON.parse(xhr.responseText);

                return resolve(
                  _mapQueryResponseToTable(data, nameAlias, valueAlias)
                );
            }

            return reject({
              status: parseInt(xhr.status, 10),
              message: xhr.statusText,
              soqlError: error
            });
          }

          xhr.onload = function() {

            var status = parseInt(xhr.status, 10);
            var data;

            if (status === 200) {

              try {

                data = JSON.parse(xhr.responseText);

                return resolve(
                  _mapQueryResponseToTable(data, nameAlias, valueAlias)
                );
              } catch (e) {

                // If we cannot parse the response body as JSON,
                // then we should assume the request has failed
                // in an unexpected way and resolve the promise
                // accordingly. This will simply fall through to
                // the call to `onFail()` below.
              }
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
        })
      );
    };

    /**
     * `.getRows()` executes a SoQL query against the current domain that
     * returns all rows. The query string is passed in by the caller, meaning
     * that at this level of abstraction we have no notion of SoQL grammar.
     *
     * @param {String} queryString - A valid SoQL query.
     *
     * @return {Promise}
     */
    this.getRows = function(queryString) {

      var url = 'https://{0}/api/id/{1}.json?{2}'.format(
        _self.getConfigurationProperty('domain'),
        _self.getConfigurationProperty('datasetUid'),
        queryString
      );
      var headers = {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      };

      return (
        new Promise(function(resolve, reject) {

          var xhr = new XMLHttpRequest();

          function onFail() {

            var error;

            try {
              error = JSON.parse(xhr.responseText);
            } catch (e) {
              error = xhr.statusText;
            }

            return reject({
              status: parseInt(xhr.status, 10),
              message: xhr.statusText,
              soqlError: error
            });
          }

          xhr.onload = function() {

            var status = parseInt(xhr.status, 10);
            var data;

            if (status === 200) {

              try {

                data = JSON.parse(xhr.responseText);

                return resolve(
                  _mapRowsResponseToTable(data)
                );
              } catch (e) {

                // If we cannot parse the response body as JSON,
                // then we should assume the request has failed
                // in an unexpected way and resolve the promise
                // accordingly. This will simply fall through to
                // the call to `onFail()` below.
              }
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
        })
      );
    };

    /**
     * Private methods
     */

    /**
     * Transforms a raw SoQL query result into a 'table' object.
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
    function _mapQueryResponseToTable(data, nameAlias, valueAlias) {

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

    /**
     * Transforms a raw row request result into a 'table' object.
     *
     * @param {Object[]} data - The row request result, which is an array of
     *    objects with keys equal to the column name and values equal to the
     *    row value for each respective column.
     *
     * @return {Object}
     *   @property {String[]} columns - An ordered list of the column aliases
     *     present in the query.
     *   @property {[][]} rows - An array of rows returned by the query.
     *
     * The columns array is of the format:
     *
     *   [<first column name>, <second column name>, ...]
     *
     * Accordingly, each row in the rows array is of the format:
     *
     *   [
     *     <first column value>,
     *     <second column value>,
     *     ...
     *   ]
     */
    function _mapRowsResponseToTable(data) {

      var table = {
        columns: [],
        rows: []
      };

      if (data.length > 0) {

        var columns = Object.keys(data[0]);
        var rows = data.map(function(datum) {

          var row = [];

          for (var i = 0; i < columns.length; i++) {

            var column = columns[i];
            var value = datum.hasOwnProperty(column) ? datum[column] : undefined;

            row.push(value);
          }

          return row;
        });

        table.columns = columns;
        table.rows = rows;
      }

      return table;
    }
  }

  root.socrata.visualizations.SoqlDataProvider = SoqlDataProvider;
})(window);

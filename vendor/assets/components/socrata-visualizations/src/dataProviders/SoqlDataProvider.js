var utils = require('socrata-utils');
var DataProvider = require('./DataProvider');
var MetadataProvider = require('./MetadataProvider');
var _ = require('lodash');

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
  'use strict';

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

  var _self = this;
  var metadataProvider = new MetadataProvider(config);

  /**
   * Public methods
   */

  this.buildBaseQuery = function() {
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

    var url = _withSalt(_queryUrl('$query={0}'.format(queryString)));

    return Promise.resolve(
      $.get(url)
    ).then(
      function(data) {
        return _mapQueryResponseToTable(data, nameAlias, valueAlias)
      },
      function(error) {
        return Promise.reject({
          status: parseInt(error.status, 10),
          message: error.statusText,
          soqlError: error.responseJSON || error.responseText
        });
      }
    );
  };

  this.getRowCount = function() {
    return Promise.resolve(
      $.get(_queryUrl('$select=count(*)'))
    ).then(
      function(data) {
        return parseInt(_.get(data, '[0].count'), 10);
      }
    );
  }

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
    var url = _withSalt(_queryUrl(queryString));
    return Promise.all([
      metadataProvider.getDatasetMetadata(),
      Promise.resolve($.get(url))
    ]).then(
      function(responses) {
        return _mapRowsResponseToTable(responses[0].columns, responses[1]);
      },
      function(error) {
        return Promise.reject({
          status: parseInt(error.status, 10),
          message: error.statusText,
          soqlError: error.responseJSON || error.responseText
        });
      }
    );
  };

  /**
   * Private methods
   */

  function _queryUrl(queryString) {
    return 'https://{0}/api/id/{1}.json?{2}'.format(
      _self.getConfigurationProperty('domain'),
      _self.getConfigurationProperty('datasetUid'),
      queryString
    );
  }

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
  function _mapRowsResponseToTable(columnInformation, data) {

    columnInformation = _.sortBy(columnInformation, 'position');

    var table = {
      columns: _.pluck(columnInformation, 'fieldName'),
      rows: [],
    };

    if (data.length > 0) {

      var rows = data.map(function(datum) {

        var row = [];

        for (var i = 0; i < table.columns.length; i++) {

          var column = table.columns[i];
          var value = datum.hasOwnProperty(column) ? datum[column] : undefined;

          row.push(value);
        }

        return row;
      });

      table.rows = rows;
    }

    return table;
  }

  /**
   * Transforms a URL to include a salt on the end.
   *
   * @param {string} url
   * @return {string} salted url
   */
  function _withSalt(url) {
    var hasQuery = _.includes(url, '?');
    var formatVars = { url: url, salt: new Date().getTime() };

    if (hasQuery) {
      return '{url}&_={salt}'.format(formatVars);
    } else {
      return '{url}?_={salt}'.format(formatVars);
    }
  }
}

module.exports = SoqlDataProvider;

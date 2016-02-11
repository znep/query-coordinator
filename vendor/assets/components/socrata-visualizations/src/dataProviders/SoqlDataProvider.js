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

    var url = _queryUrl('$query={0}'.format(queryString));

    return _makeSoqlGetRequestWithSalt(url).then(
      function(data) {
        return _mapRowsResponseToTable([ nameAlias, valueAlias ], data);
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
   * returns all rows. The response is mapped to the DataProvider data schema (1).
   * The query string is passed in by the caller, meaning
   * that at this level of abstraction we have no notion of SoQL grammar.
   *
   * @param {String[]} columnNames - A list of column names to extract from the response.
   * @param {String} queryString - A valid SoQL query.
   *
   * (1) - The DataProvider data schema:
   * {
   *   columns: {String[]},
   *   rows: {{Object[]}[]}.
   * }
   * Row:
   *
   * Example:
   * {
   *   columns: [ 'date', 'id' ],
   *   rows: [
   *    [ '2016-01-15T11:08:45.000', '123' ],
   *    [ '2016-01-15T11:08:45.000', '345' ]
   *   ]
   * }
   *
   * @return {Promise}
   */
  this.getRows = function(columnNames, queryString) {
    utils.assertInstanceOf(columnNames, Array);
    utils.assert(columnNames.length > 0);
    utils.assertIsOneOfTypes(queryString, 'string');
    _.each(columnNames, function(columnName) {
      utils.assertIsOneOfTypes(columnName, 'string');
    });

    return _makeSoqlGetRequestWithSalt(_queryUrl(queryString)).then(
      function(soqlData) {
        return _mapRowsResponseToTable(columnNames, soqlData);
      }
    );
  };

  /**
   * `.getTableData()`
   *
   * Gets a page of data from the dataset. In addition to an offset
   * and limit, you must specify an ordering and a list of columns.
   *
   * @param {String[]} columnNames - Columns to grab data from.
   * @param {Object[]} order - An array of order clauses. For the moment, there must always
   *                           be exactly one order clause. A clause looks like:
   *                           {
   *                             columnName: {String} - a column,
   *                             ascending: {Boolean} - ascending or descending
   *                           }
   * @param {Number} offset - Skip this many rows.
   * @param {Number} limit - Fetch this many rows, starting from offset.
   *
   * @return {Promise}
   */
  this.getTableData = function(columnNames, order, offset, limit) {
    utils.assertInstanceOf(columnNames, Array);
    utils.assertIsOneOfTypes(offset, 'number');
    utils.assertIsOneOfTypes(limit, 'number');

    // We only support one order for the moment.
    utils.assert(order.length === 1, 'order parameter must be an array with exactly one element.');

    utils.assertHasProperties(order,
      '[0].ascending',
      '[0].columnName'
    );

    var queryString = '$select={0}&$order=`{1}`+{2}&$limit={3}&$offset={4}'.format(
      columnNames.map(_escapeColumnName).join(','),
      order[0].columnName,
      (order[0].ascending ? 'ASC' : 'DESC'),
      limit,
      offset
    );

    return _makeSoqlGetRequestWithSalt(_queryUrl(queryString)).then(function(data) {
      return _mapRowsResponseToTable(columnNames, data);
    });
  };

  /**
   * Private methods
   */

  // Returns a Promise for a GET against the given SOQL url.
  // Adds salt to the end of the URL for cache bust.
  // On error, rejects with an object: {
  //   status: HTTP code,
  //   message: status text,
  //   soqlError: response JSON
  // }
  function _makeSoqlGetRequestWithSalt(url) {
    return Promise.resolve($.get(_withSalt(url))).
      catch(function(error) {
        return Promise.reject({
          status: parseInt(error.status, 10),
          message: error.statusText,
          soqlError: error.responseJSON || error.responseText
        });
      });
  }

  function _escapeColumnName(columnName) {
    return '`{0}`'.format(columnName);
  }

  function _queryUrl(queryString) {
    return 'https://{0}/api/id/{1}.json?{2}'.format(
      _self.getConfigurationProperty('domain'),
      _self.getConfigurationProperty('datasetUid'),
      queryString
    );
  }

  /**
   * Transforms a raw row request result into a 'table' object.
   *
   * @param {String[]} columnNames - The list of columns to process.
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
  function _mapRowsResponseToTable(columnNames, data) {

    var table = {
      columns: columnNames,
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
   * https://socrata.atlassian.net/browse/CHART-204
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

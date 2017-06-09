var $ = require('jquery');
var utils = require('socrata-utils');
var DataProvider = require('./DataProvider');
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
  var self = this;

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

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
   * @param {String} queryString - A valid, non-URI-encoded SoQL query.
   * @param {String} nameAlias - The alias used for the 'name' column.
   * @param {String} valueAlias - The alias used for the 'value' column.
   *
   * @return {Promise}
   */
  this.query = function(queryString, nameAlias, valueAlias) {
    const path = pathForQuery(`$query=${encodeURIComponent(queryString)}`);

    return makeSoqlGetRequest(path).then((data) => {
      return mapRowsResponseToTable([ nameAlias, valueAlias ], data);
    });
  };

  this.getRowCount = function(whereClauseComponents) {
    const alias = '__count_alias__'; // lowercase in order to deal with OBE norms
    const whereClause = whereClauseComponents ?
      `&$where=${encodeURIComponent(whereClauseComponents)}` :
      '';
    const path = pathForQuery(
      '$select=count(*) as {0}{1}'.
        format(alias, whereClause)
    );

    return makeSoqlGetRequest(path).
      then(
        function(data) {
          return parseInt(
            _.get(
              data,
              `[0]${alias}`
            ),
            10
          );
        }
      );
  };

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
    const path = pathForQuery(queryString);

    utils.assertInstanceOf(columnNames, Array);
    utils.assert(columnNames.length > 0);
    utils.assertIsOneOfTypes(queryString, 'string');
    _.each(columnNames, function(columnName) {
      utils.assertIsOneOfTypes(columnName, 'string');
    });

    return makeSoqlGetRequest(path).
      then(
        function(soqlData) {
          return mapRowsResponseToTable(columnNames, soqlData);
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
   * @param {String} whereClauseComponents - Conditions which rows should match.
   *
   * @return {Promise}
   */
  this.getTableData = function(columnNames, order, offset, limit, whereClauseComponents) {
    utils.assertInstanceOf(columnNames, Array);
    utils.assertIsOneOfTypes(offset, 'number');
    utils.assertIsOneOfTypes(limit, 'number');

    // We only support one order for the moment.
    utils.assert(order.length === 1, 'order parameter must be an array with exactly one element.');

    utils.assertHasProperties(order,
      '[0].ascending',
      '[0].columnName'
    );

    const queryString =
      '$select={0}&$order=`{1}`+{2}&$limit={3}&$offset={4}{5}'.
      format(
        columnNames.map(escapeColumnName).join(','),
        order[0].columnName,
        order[0].ascending ? 'ASC' : 'DESC',
        limit,
        offset,
        whereClauseComponents ? '&$where=' + encodeURIComponent(whereClauseComponents) : ''
      );
    const path = pathForQuery(queryString);

    return makeSoqlGetRequest(path).
      then(
        function(data) {
          return mapRowsResponseToTable(columnNames, data);
        }
      );
  };

  // Requests aggregate statistics about the data in all of the columns.  This potentially fires
  // off many data requests that perform slow queries, use with caution.
  this.getColumnStats = function(columns) {
    utils.assert(_.isArray(columns), 'columns parameter must be an array');

    const promises = _.map(columns, function(column) {
      const minAlias = '__min__';
      const maxAlias = '__max__';
      const countAlias = '__count__';
      const { fieldName, dataTypeName } = column;
      let orderBy;
      let queryString;
      let select;
      let path;

      // For number and calendar_date columns, we need the min and max of the column
      if (_.includes(['money', 'number', 'calendar_date'], dataTypeName)) {
        select = `min(${fieldName}) as ${minAlias}, max(${fieldName}) as ${maxAlias}`;
        queryString = `$select=${select}`;
        path = pathForQuery(queryString);
        return makeSoqlGetRequest(path).then((result) => {
          switch (dataTypeName) {
            case 'money':
            case 'number':
              return {
                rangeMin: _.toNumber(result[0][minAlias]),
                rangeMax: _.toNumber(result[0][maxAlias])
              };

            case 'calendar_date':
              return {
                rangeMin: _.toString(result[0][minAlias]),
                rangeMax: _.toString(result[0][maxAlias])
              };
          }
        });
      } else if (dataTypeName === 'text') {
        const escapedFieldName = escapeColumnName(fieldName);
        select = `${escapedFieldName}+as+item,count(*)+as+${countAlias}`;
        orderBy = `${countAlias}+DESC`;
        queryString = `$select=${select}&$order=${orderBy}&$group=${escapedFieldName}&$limit=25`;
        path = pathForQuery(queryString);

        return makeSoqlGetRequest(path).then((result) => {
          return {
            top: result
          };
        });
      } else {
        return Promise.resolve(null);
      }
    });

    return Promise.all(promises);
  };

  this.match = function(columnName, term) {
    const escapedColumnName = escapeColumnName(columnName);
    const select = `${escapedColumnName}`;
    const where = encodeURIComponent(`${escapedColumnName}="${term}"`);
    const queryString = `$select=${select}&$where=${where}&$limit=1`;
    const path = pathForQuery(queryString);

    return makeSoqlGetRequest(path).then((result) => {
      return new Promise((resolve, reject) => {
        return _.isArray(result) && result.length === 1 ?
          resolve() : reject();
      });
    });
  };

  /**
   * Private methods
   */

  // Returns a Promise for a GET against the given SoQL url.
  // On error, rejects with an object: {
  //   status: HTTP code,
  //   message: status text,
  //   soqlError: response JSON
  // }
  const makeSoqlGetRequest = (path) => {
    const domain = this.getConfigurationProperty('domain');
    const url = `https://${domain}/${path}`;
    const isSameDomain = domain === window.location.hostname;

    const headers = {
      'Accept': 'application/json; charset=utf-8'
    };

    // TODO EN-15459 EN-15483: Once Core correctly responds to OPTIONS,
    // remove the domain check and always set the federation header.
    if (isSameDomain) {
      // Suppress cross-domain redirects if possible.
      headers['X-Socrata-Federation'] = 'Honey Badger';
    }

    return new Promise(
      function(resolve, reject) {

        function handleError(jqXHR) {

          reject(
            {
              status: parseInt(jqXHR.status, 10),
              message: jqXHR.statusText,
              soqlError: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
            }
          );
        }

        $.ajax({
          url,
          headers,
          method: 'GET',
          success: resolve,
          error: handleError
        });
      }
    );
  };

  function escapeColumnName(columnName) {
    return '`{0}`'.format(columnName);
  }

  function pathForQuery(queryString) {
    const datasetUid = self.getConfigurationProperty('datasetUid');
    return `api/id/${datasetUid}.json?${queryString}`;
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
  function mapRowsResponseToTable(columnNames, data) {
    var table = {
      columns: columnNames,
      rows: []
    };
    var rows;

    if (data.length > 0) {

      rows = data.map(
        function(datum) {
          var row = [];
          var column;
          var value;

          for (var i = 0; i < table.columns.length; i++) {

            column = table.columns[i];
            value = datum.hasOwnProperty(column) ? datum[column] : undefined;

            row.push(value);
          }

          return row;
        }
      );

      table.rows = rows;
    }

    return table;
  }
}

module.exports = SoqlDataProvider;
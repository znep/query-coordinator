var $ = require('jquery');
var utils = require('common/js_utils');
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
function SoqlDataProvider(config, useCache = false) {
  var self = this;

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

  if (useCache) {
    const cached = this.cachedInstance("SoqlDataProvider");
    if (cached) {
      return cached;
    }
  }

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
   * @param {String} errorBarsLowerAlias - The alias used for the error bars lower bound column. Can be undefined.
   * @param {String} errorBarsUpperAlias - The alias used for the error bars upper bound column. Can be undefined.
   * @param {String} groupingAlias - The alias used for grouping columns. Can be undefined.
   *
   * @return {Promise}
   */
  this.query = function(queryString, nameAlias, valueAlias, errorBarsLowerAlias, errorBarsUpperAlias, groupingAlias) {
    const path = pathForQuery(`$query=${encodeURIComponent(queryString)}`);

    return makeSoqlGetRequest(path).then((data) => {

      let basicAliases = [nameAlias, valueAlias];
      if (!_.isUndefined(groupingAlias)) {
        // XXX: Column order is critical here:
        basicAliases = [nameAlias, groupingAlias, valueAlias];
      }

      let errorBarsAliases;

      if (!_.isEmpty(errorBarsLowerAlias) && !_.isEmpty(errorBarsUpperAlias)) {
        errorBarsAliases = [nameAlias, errorBarsLowerAlias, errorBarsUpperAlias];
      }

      return mapRowsResponseToTable(basicAliases, data, errorBarsAliases);
    });
  };

  /**
   * `.rawQuery()` is basically `.query()` withouot any of the nonsense that ties it to visualizations.
   * It allows you to execute SoQL without worrying about path or request configurations
   *
   * @param {String} queryString - A valid, non-URI-encoded SoQL query.
   *
   * @return {Promise}
   */
  this.rawQuery = function(queryString) {
    const path = pathForQuery(`$query=${encodeURIComponent(queryString)}`);

    return makeSoqlGetRequest(path);
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
            _.get(data, `[0]${alias}`),
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

    const readFromNbe = self.getOptionalConfigurationProperty('readFromNbe', true);

    let queryString;

    // NOTE: We will only have row ids if we are querying an NBE dataset. We cannot,
    // at least at this time, construct a SoQL query that works against the OBE and
    // includes both all the user rows and only the :id system column.
    if (readFromNbe) {

      queryString =
        '$select=*,:id&$order=`{0}`+{1}&$limit={2}&$offset={3}{4}'.
        format(
          order[0].columnName,
          order[0].ascending ? 'ASC' : 'DESC',
          limit,
          offset,
          whereClauseComponents ? '&$where=' + encodeURIComponent(whereClauseComponents) : ''
        );
    } else {

      queryString =
        '$select={0}&$order=`{1}`+{2}&$limit={3}&$offset={4}{5}'.
        format(
          columnNames.map(escapeColumnName).join(','),
          order[0].columnName,
          order[0].ascending ? 'ASC' : 'DESC',
          limit,
          offset,
          whereClauseComponents ? '&$where=' + encodeURIComponent(whereClauseComponents) : ''
        );
    }

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
      const { dataTypeName } = column;
      // For number and calendar_date columns, we need the min and max of the column
      if (_.includes(['money', 'number', 'calendar_date'], dataTypeName)) {
        return Promise.resolve(getNumberColumnStats(column));
      } else if (dataTypeName === 'text') {
          return Promise.resolve(getTextColumnStats(column));
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
  const soqlGetRequestPromiseCache = {};

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

    const cacheKey = `${domain}-${url}-${JSON.stringify(headers)}`;

    const cachedPromise = soqlGetRequestPromiseCache[cacheKey];
    if (cachedPromise) {
      return cachedPromise;
    }

    const soqlGetRequestPromise = new Promise(
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

    soqlGetRequestPromiseCache[cacheKey] = soqlGetRequestPromise;

    return soqlGetRequestPromise;

  };

  function escapeColumnName(columnName) {
    return '`{0}`'.format(columnName);
  }

  function pathForQuery(queryString) {
    const datasetUid = self.getConfigurationProperty('datasetUid');
    const readFromNbe = self.getOptionalConfigurationProperty('readFromNbe', true);
    let path = `api/id/${datasetUid}.json?${queryString}`;
    if (readFromNbe) {
      path = path + '&$$read_from_nbe=true&$$version=2.1';
    }

    return path;
  }

  function buildNumberRange(dataTypeName, min, max) {
    switch (dataTypeName) {
      case 'money':
      case 'number':
        return {
          rangeMin: _.toNumber(min),
          rangeMax: _.toNumber(max)
        };

      case 'calendar_date':
        return {
          rangeMin: _.toString(min),
          rangeMax: _.toString(max)
        };
    }
  }

  function getNumberColumnStats(column) {
    const { fieldName, dataTypeName, cachedContents } = column;

    if (_.has(cachedContents, 'smallest') && _.has(cachedContents, 'largest')) {
      return buildNumberRange(
        dataTypeName,
        _.get(cachedContents, 'smallest'),
        _.get(cachedContents, 'largest')
      );
    } else {
      const minAlias = '__min__';
      const maxAlias = '__max__';

      const select = `min(${fieldName}) as ${minAlias}, max(${fieldName}) as ${maxAlias}`;
      const queryString = `$select=${select}`;
      const path = pathForQuery(queryString);

      return makeSoqlGetRequest(path).then((result) => {
        return Promise.resolve(
          buildNumberRange(dataTypeName, result[0][minAlias], result[0][maxAlias])
        );
      });
    }

  }


  function getTextColumnStats(column) {
    const { fieldName, dataTypeName, cachedContents } = column;

    if (_.has(cachedContents, 'top')) {
      return {
        top: _.get(cachedContents, 'top')
      }
    } else {
      const countAlias = '__count__';
      const escapedFieldName = escapeColumnName(fieldName);

      const select = `${escapedFieldName}+as+item,count(*)+as+${countAlias}`;
      const where = `${escapedFieldName}+is+not+null`
      const orderBy = `${countAlias}+DESC`;
      const queryString = `$select=${select}&$where=${where}&$order=${orderBy}&$group=${escapedFieldName}&$limit=25`;
      const path = pathForQuery(queryString);

      return makeSoqlGetRequest(path).then((result) => {
        return {
          top: result
        };
      });
    }
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
   *
   * Each row in the errorBars array is of the format:
   *
   *   [
   *     <first column value>,
   *     <second column value>,
   *     ...
   *   ]
   */
  function mapRowsResponseToTable(columnNames, data, errorBarColumnNames) {
    const nonNullColumnNames = _.without(columnNames, null);
    const table = {
      columns: nonNullColumnNames,
      rows: _.map(data, (datum) => _.at(datum, nonNullColumnNames)),
      // NOTE: The ':id' property will only exist for queries against NBE
      // datasets. Therefore, we can only use rowIds for the row double click
      // event when displaying NBE datasets.
      rowIds: _.map(data, (datum) => String(datum[':id'] || 'null'))
    };

    if (!_.isUndefined(errorBarColumnNames)) {

      table.errorBars = data.map((datum) => {
        const row = [];

        for (var i = 0; i < errorBarColumnNames.length; i++) {
          const column = errorBarColumnNames[i];
          const value = datum.hasOwnProperty(column) ? datum[column] : undefined;
          row.push(value);
        }
      });
    }

    return table;
  }
}

module.exports = SoqlDataProvider;

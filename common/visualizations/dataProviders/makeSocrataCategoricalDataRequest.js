// Vendor Imports
const _ = require('lodash');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
const I18n = require('common/i18n').default;

function makeSocrataCategoricalDataRequest(vif, seriesIndex, maxRowCount) {
  const series = vif.series[seriesIndex];
  const soqlDataProvider = new SoqlDataProvider({
    datasetUid: series.dataSource.datasetUid,
    domain: series.dataSource.domain
  }, true);
  const dimension = SoqlHelpers.dimension(vif, seriesIndex);
  const measure = SoqlHelpers.measure(vif, seriesIndex);
  const errorBarsLower = SoqlHelpers.errorBarsLower(vif, seriesIndex);
  const errorBarsUpper = SoqlHelpers.errorBarsUpper(vif, seriesIndex);
  const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
    vif,
    seriesIndex
  );
  const whereClause = (whereClauseComponents.length > 0) ?
    `WHERE ${whereClauseComponents}` :
    '';
  const groupByClause = SoqlHelpers.aggregationClause(
    vif,
    seriesIndex,
    'dimension'
  );
  const orderByClause = SoqlHelpers.orderByClauseFromSeries(
    vif,
    seriesIndex
  );
  const isUnaggregatedQuery = (
    _.isNull(series.dataSource.dimension.aggregationFunction) &&
    _.isNull(series.dataSource.measure.aggregationFunction)
  );
  // We only want to follow the showOtherCategory code path if that property
  // is set to true AND there is a defined limit.
  const showOtherCategory = (
    _.get(vif, 'configuration.showOtherCategory', false) &&
    _.isNumber(
      _.get(vif, `series[${seriesIndex}].dataSource.limit`, null)
    )
  );
  const limitFromVif = _.get(
    vif,
    `series[${seriesIndex}].dataSource.limit`,
    null
  );
  const limit = limitFromVif !== null && !showOtherCategory ?
    parseInt(limitFromVif, 10) :
    maxRowCount;

  let queryString;
  let errorBarsLowerAlias;
  let errorBarsUpperAlias;

  const fields = [
    `${dimension} AS ${SoqlHelpers.dimensionAlias()}`,
    `${measure} AS ${SoqlHelpers.measureAlias()}`
  ];

  if (!_.isEmpty(errorBarsLower) && !_.isEmpty(errorBarsUpper)) {

    errorBarsLowerAlias = SoqlHelpers.errorBarsLowerAlias();
    errorBarsUpperAlias = SoqlHelpers.errorBarsUpperAlias();

    fields.push(
      `${errorBarsLower} AS ${errorBarsLowerAlias}`,
      `${errorBarsUpper} AS ${errorBarsUpperAlias}`);
  }

  if (isUnaggregatedQuery) {

    // Note that we add one to the limit before making the query so that we can
    // identify when an additional 'other' category query may be necessary.
    queryString = [
      'SELECT',
      fields.join(', '),
      whereClause,
      `ORDER BY ${orderByClause}`,
      'NULL LAST',
      `LIMIT ${limit + 1}`
    ].join(' ');
  } else {

    // Note that we add one to the limit before making the query so that we can
    // identify when an additional 'other' category query may be necessary.
    queryString = [
      'SELECT',
      fields.join(', '),
      whereClause,
      `GROUP BY ${groupByClause}`,
      `ORDER BY ${orderByClause}`,
      'NULL LAST',
      `LIMIT ${limit + 1}`
    ].join(' ');
  }

  return soqlDataProvider.
    query(
      queryString,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias(),
      errorBarsLowerAlias,
      errorBarsUpperAlias
    ).
    then((queryResponse) => {
      const queryResponseRowCount = queryResponse.rows.length;
      const queryResponseUniqueDimensionCount = _.uniq(
        queryResponse.rows.map((row) => row[0])
      ).length;

      if (queryResponseRowCount !== queryResponseUniqueDimensionCount) {
        const error = new Error();

        error.errorMessages = [
          I18n.t(
            'shared.visualizations.charts.common.error_duplicated_dimension_value'
          )
        ];

        throw error;
      }

      if (showOtherCategory) {

        // This turns out to be quite involved, so it has its own function.
        return augmentSocrataDataResponseWithOtherCategory(
          vif,
          seriesIndex,
          maxRowCount,
          queryResponse
        );
      } else {

        // Take all but the last row since we request one more row than we
        // actually want in order to test for the necessity of an 'other'
        // category.
        const actualRows = queryResponse.rows.slice(0, limit);
        const response = {
          columns: queryResponse.columns,
          rows: actualRows
        };

        if (!_.isUndefined(queryResponse.errorBars)) {
          response.errorBars = queryResponse.errorBars;
        }

        return Promise.resolve(response);
      }
    }).
    then(mapQueryResponseToDataTable);
}

/**
 * Given a vif, series index and query response data table, this function will
 * interpret the original vif and the query response in order to generate a
 * second query representing the 'other' category. It will then combine the
 * results of the second query with those of the first, thus augmenting the
 * original response with a new row representing the 'other' category.
 *
 * The 'other' category query:
 *
 * 1. Is subject to all the filters from the original vif that do not affect the
 *    dimension.
 * 2. Is subject to the opposite of the filters on the original vif that affect
 *    the dimension.
 *
 * For example, where the original vif results in the query:
 *
 *   SELECT dimension, COUNT(*)
 *   WHERE
 *     non_dimension = '5' AND
 *     dimension = '3'
 *
 * ...the 'other' category vif results in the query:
 *
 *   SELECT '(Other)', COUNT(*)
 *   WHERE
 *     non_dimension = '5' AND
 *     dimension != '3' OR
 *     (non_dimension = '5' AND dimension IS NULL)
 *
 * Put another way, assuming the COUNT aggregation, the sum of all the
 * non-'other' category measure values and the 'other' category measure value
 * should equal the total number of rows matching the filters in the original
 * vif, if any, that do not apply to the dimension column.
 */
function augmentSocrataDataResponseWithOtherCategory(
  vif,
  seriesIndex,
  maxRowCount,
  queryResponse
) {

  const otherCategoryVif = _.cloneDeep(vif);
  const series = otherCategoryVif.series[seriesIndex];
  const dimension = SoqlHelpers.dimension(otherCategoryVif, seriesIndex);
  // Since it is primarily used to build query strings, SoqlHelpers.dimension()
  // returns the dimension for the specified series from the vif quoted with
  // backticks. Since we also want to compare the dimension column's name with
  // other strings, we need to have a version of the dimension that is not
  // quoted as well (dimensionColumnName in this case).
  const dimensionColumnName = dimension.replace(/`/g, '');
  const dimensionIndex = queryResponse.columns.indexOf(
    SoqlHelpers.dimensionAlias()
  );
  const limitFromVif = _.get(
    otherCategoryVif,
    `series[${seriesIndex}].dataSource.limit`,
    null
  );
  // If there is no limit defined in the vif then use the implementation's
  // default.
  const limit = (limitFromVif !== null) ?
    parseInt(limitFromVif, 10) :
    maxRowCount;
  // In order to properly generate the 'other' category query, we need to
  // separate the original vif's filters into those filtering the dimension
  // column and those not filtering the dimension column.
  const allFilters = _.get(
    otherCategoryVif,
    `series[${seriesIndex}].dataSource.filters`,
    []
  );
  const nonDimensionFilters = allFilters.
    filter((filter) => {
      return filter.columnName !== dimensionColumnName;
    });
  // We also need to utilize the dimension values that came back in the original
  // query so that we know which values to exclude from the 'other' category.
  //
  // Note that we take up-to-limit rows, which in this case will be one fewer
  // than actually came back in the query response (since we add one to the
  // limit when we make the original query to determine when we need to make an
  // 'other' category query).
  const dimensionValues = queryResponse.rows.slice(0, limit).map(
    (row) => _.isUndefined(row[dimensionIndex]) ? null : row[dimensionIndex]
  );

  /**
   * The process of generating a request for the 'other' category has two parts.
   * First, we need to synthesize a vif that represents opposite query of the
   * original vif. This is done by adding/inverting filters on the vif that do
   * not affect the dimension column, and then by generating an additional where
   * clause component that selects the opposite of the dimension values in the
   * original query response.
   */

  /**
   * Step 1: Create a vif that represents the 'other' category.
   */

  const dimensionFilterArguments = dimensionValues.map((dimensionValue) => {

    return (_.isNull(dimensionValue)) ?
      { operator: 'IS NOT NULL' } :
      { operator: '!=', operand: dimensionValue };
  });

  const dimensionFilters = [
    {
      'function': 'binaryOperator',
      columnName: dimensionColumnName,
      arguments: dimensionFilterArguments,
      joinOn: 'AND'
    }
  ];

  let otherCategoryFilters = dimensionFilters.concat(nonDimensionFilters);

  _.set(
    otherCategoryVif,
    `series[${seriesIndex}].dataSource.filters`,
    otherCategoryFilters
  );

  const nonDimensionWhereClauseComponent = nonDimensionFilters.
    map(SoqlHelpers.filterToWhereClauseComponent).
    map(_.negate(_.isEmpty)).
    join(' AND ');

  /**
   * Step 2: Generate a query using the synthesized 'other' category vif.
   */

  let otherCategoryWhereClauseComponents = SoqlHelpers.
    whereClauseFilteringOwnColumn(
      otherCategoryVif,
      seriesIndex
    );

  // If the other request contained nulls, we need to select nulls explicitly to prevent
  // Core from omitting the null values. By the time we get to here, queryResponse.rows looks like
  // this: [[value, count], [value, count]] (for example: [['1', '1'], [undefined, '1']]). While
  // the value is actually null, Core fails to return a value to accompany the null value's count
  // (remember, Core doesn't think that null should be meaningful), which then becomes undefined
  // when we parse Core's response.
  const hasNullValuesInOther = _.some(_.map(queryResponse.rows.slice(limit), dimensionIndex), _.isUndefined);
  if (hasNullValuesInOther) {
    const nullValueWhere = SoqlHelpers.filterToWhereClauseComponent({
      columnName: dimensionColumnName,
      'function': 'isNull',
      arguments: { isNull: true }
    });
    otherCategoryWhereClauseComponents += ` OR ${nullValueWhere}`;
  }

  const isUnaggregatedQuery = (
    _.isNull(series.dataSource.dimension.aggregationFunction) &&
    _.isNull(series.dataSource.measure.aggregationFunction)
  );
  const otherCategoryAggregationClause = SoqlHelpers.aggregationClause(
    otherCategoryVif,
    seriesIndex,
    'measure'
  );
  const otherCategoryLabel = I18n.t(
    'shared.visualizations.charts.common.other_category'
  );

  let otherCategoryWhereClause = '';
  let otherCategoryQueryString;

  if (
    otherCategoryWhereClauseComponents.length > 0 &&
    nonDimensionWhereClauseComponent.length > 0
  ) {

    otherCategoryWhereClause = `
      WHERE
        ${otherCategoryWhereClauseComponents} AND
        ${nonDimensionWhereClauseComponent}`;
  } else if (otherCategoryWhereClauseComponents.length > 0) {
    otherCategoryWhereClause = `WHERE ${otherCategoryWhereClauseComponents}`;
  } else if (nonDimensionWhereClauseComponent.length > 0) {
    otherCategoryWhereClause = `WHERE ${nonDimensionWhereClauseComponent}`;
  }

  if (isUnaggregatedQuery) {
    const measureColumnName = _.get(series, 'dataSource.measure.columnName', null);
    const measureClause = (_.isNull(measureColumnName)) ?
      'COUNT(*)' :
      `SUM(\`${measureColumnName}\`)`;

    otherCategoryQueryString = [
      'SELECT',
        `'${otherCategoryLabel}' AS ${SoqlHelpers.dimensionAlias()},`,
        `${measureClause} AS ${SoqlHelpers.measureAlias()}`,
      otherCategoryWhereClause,
      `LIMIT ${maxRowCount}`
    ].join(' ');
  } else {

    otherCategoryQueryString = [
      'SELECT',
        `'${otherCategoryLabel}' AS ${SoqlHelpers.dimensionAlias()},`,
        `${otherCategoryAggregationClause} AS ${SoqlHelpers.measureAlias()}`,
      otherCategoryWhereClause,
      `LIMIT ${maxRowCount}`
    ].join(' ');
  }

  const soqlDataProvider = new SoqlDataProvider({
    datasetUid: series.dataSource.datasetUid,
    domain: series.dataSource.domain
  }, true);

  return soqlDataProvider.
    query(
      otherCategoryQueryString,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias()
    ).
    then((otherCategoryQueryResponse) => {

      // Note that once again we are taking [0..limit] rows instead of
      // all of them, since we artificially increased the limit by one
      // in order to determine whether or not we needed to make an
      // 'other' category query.
      const actualRows = queryResponse.rows.slice(0, limit);

      // If the limit is higher than the number of total rows then
      // otherCategoryQueryResponse will come back with no rows; in this
      // case there is no need to modify the original queryResponse.
      if (otherCategoryQueryResponse.rows.length > 0) {
        actualRows.push(otherCategoryQueryResponse.rows[0]);
      }

      const response = {
        columns: queryResponse.columns,
        rows: actualRows
      };

      if (!_.isUndefined(queryResponse.errorBars)) {
        const actualErrorBars = queryResponse.errorBars.slice(0, limit);

        if (otherCategoryQueryResponse.rows.length > 0) {
          actualErrorBars.push([otherCategoryLabel, null, null]);
        }

        response.errorBars = actualErrorBars;
      }

      return response;
    }).
    catch(() => {
      const error = new Error();

      error.errorMessages = [
        I18n.t(
          'shared.visualizations.charts.common.error_other_category_query_failed'
        )
      ];

      throw error;
    });
}

function mapQueryResponseToDataTable(queryResponse) {
  const dataTable = queryResponse;
  const dimensionIndex = dataTable.columns.indexOf(SoqlHelpers.dimensionAlias());
  const measureIndex = dataTable.columns.indexOf(SoqlHelpers.measureAlias());

  dataTable.columns[dimensionIndex] = 'dimension';
  dataTable.columns[measureIndex] = 'measure';

  dataTable.rows.forEach((row) => {

    if (_.isUndefined(row[dimensionIndex])) {
      row[dimensionIndex] = null;
    }

    row[measureIndex] = getNumberValue(row[measureIndex]);
  });

  if (!_.isUndefined(dataTable.errorBars)) {

    dataTable.errorBars = dataTable.errorBars.map((row) => {

      const dimensionIndex = 0;
      const lowerBoundIndex = 1;
      const upperBoundIndex = 2;
      const newRow = [];

      // Dimension
      newRow[dimensionIndex] = _.isUndefined(row[dimensionIndex]) ? null : row[dimensionIndex];

      // Error bar bounds
      newRow[measureIndex] = [
        getNumberValue(row[lowerBoundIndex]), 
        getNumberValue(row[upperBoundIndex])];

      return newRow;
    });
  }

  return dataTable;
}

function getNumberValue(o) {

  if (_.isUndefined(o) || _.isNull(o)) {
    return null;
  }

  let value;

  try {
    value = Number(o);
  } catch (error) {
    if (window.console && window.console.error) {
      console.error(`Could not convert value to number: ${o}`);
    }
    return null;
  }

  return value;
}

module.exports = makeSocrataCategoricalDataRequest;

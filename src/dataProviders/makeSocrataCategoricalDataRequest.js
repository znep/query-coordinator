// Vendor Imports
const _ = require('lodash');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
const I18n = require('../I18n');

function makeSocrataCategoricalDataRequest(vif, seriesIndex, maxRowCount) {
  const series = vif.series[seriesIndex];
  const soqlDataProvider = new SoqlDataProvider({
    datasetUid: series.dataSource.datasetUid,
    domain: series.dataSource.domain
  });
  const dimension = SoqlHelpers.dimension(vif, seriesIndex);
  const measure = SoqlHelpers.measure(vif, seriesIndex);
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
  const limit = (limitFromVif !== null) ?
    parseInt(limitFromVif, 10) :
    maxRowCount;

  let queryString;

  if (isUnaggregatedQuery) {

    // Note that we add one to the limit before making the query so that we can
    // identify when an additional 'other' category query may be necessary.
    queryString = `
      SELECT
        ${dimension} AS ${SoqlHelpers.dimensionAlias()},
        ${measure} AS ${SoqlHelpers.measureAlias()}
      ${whereClause}
      ORDER BY ${orderByClause}
      NULL LAST
      LIMIT ${limit + 1}`;
  } else {

    // Note that we add one to the limit before making the query so that we can
    // identify when an additional 'other' category query may be necessary.
    queryString = `
      SELECT
        ${dimension} AS ${SoqlHelpers.dimensionAlias()},
        ${measure} AS ${SoqlHelpers.measureAlias()}
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY ${orderByClause}
      NULL LAST
      LIMIT ${limit + 1}`;
  }

  return soqlDataProvider.
    query(
      queryString.replace(/[\n\s]+/g, ' '),
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias()
    ).
    then((queryResponse) => {
      const queryResponseRowCount = queryResponse.rows.length;
      const queryResponseUniqueDimensionCount = _.uniq(
        queryResponse.rows.map((row) => row[0])
      ).length;

      if (queryResponseRowCount !== queryResponseUniqueDimensionCount) {
        const error = new Error();

        error.errorMessages = [
          I18n.translate(
            'visualizations.common.error_duplicated_dimension_value'
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

        return Promise.resolve(
          {
            columns: queryResponse.columns,
            rows: actualRows
          }
        );
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
  const isFilteringOnDimensionColumn = (
    allFilters.length !== nonDimensionFilters.length
  );
  // We also need to utilize the dimension values that came back in the original
  // query so that we know which values to exclude from the 'other' category.
  //
  // Note that we take [0..limit] rows, which in this case will be one fewer
  // than actually came back in the query response (since we add one to the
  // limit when we make the original query to determine when we need to make an
  // 'other' category query).
  const dimensionValues = queryResponse.rows.slice(0, limit).map(
    (row) => row[dimensionIndex]
  );
  // We also need to know if any of the dimension values that came back in the
  // original query were null, since we need to add an 'AND IS NOT NULL' filter
  // if so, and an 'OR IS NULL' filter if not.
  const nonNullDimensionValues = dimensionValues.filter(
    (dimensionValue) => !_.isUndefined(dimensionValue)
  );
  const dimensionValuesIncludeNull = (
    dimensionValues.length !== nonNullDimensionValues.length
  );

  let dimensionFilters;
  // The reason there is a 'additionalWhereClauseComponent':
  //
  // 1. In SoQL, doing the opposite of a query like "SELECT * WHERE
  //    column_name = 'x'" is not as simple as doing a second query like
  //    "SELECT * WHERE column_name != 'x'". This is because SQL does not
  //    include rows where 'column_name' is null in the set of returned
  //    rows.
  //
  // 2. This is, at least in our case, not what we want, so we need to
  //    add another condition to the WHERE clause allowing 'column_name'
  //    to not equal 'x' or to be null. The naive way to do this would be
  //    to just combine the two into a query like "SELECT * WHERE
  //    column_name != 'x' OR column_name IS NULL".
  //
  // 3. That naive way works ok as long as you do not have any other
  //    where clause statements that apply to columns other than
  //    column_name. For example, if a user wants to see the number of
  //    rows in the table for each crime_type, but with a filter on
  //    police_district applied so that only rows representing crimes in
  //    a specific police district are counted) we need to apply the
  //    filters not affecting the column being selected to both the
  //    inequality ("column_name != 'x'" in the example above) and also
  //    the negation of the null state ("column_name IS NULL in the
  //    example above). Filters applied to the column being selected are,
  //    in this implementation, considered 'dimensionFilters' and those
  //    applied to orthogonal columns 'nonDimensionFilters'. A concrete
  //    example of this kind of query is:
  //
  //      SELECT *
  //      WHERE
  //        orthogonal_column_name = 'y' AND column_name != 'x'
  //      OR
  //        (orthogonal_column_name = 'y' AND column_name IS NULL)
  //
  // 4. The result of all of this is that, at least in the case where we
  //    are applying nonDimensionFilters, is that we need to have the
  //    ability to create nested where clauses constraints using
  //    parentheses which are furthermore joined to the existing where
  //    clause using an OR operator and not the AND assumed by the way we
  //    serialize filter objects into SoQL query strings.
  //
  // 5. Since this requirement only ever comes about in the implementation
  //    of the 'show other category' functionality, we have chosen to kick
  //    the can down the road a little bit and not update the VIF format
  //    to allow heirarchical filter objects but rather just operate on
  //    the query string for this specific case. We do this by setting
  //    'additionalWhereClauseComponent' (which is initialized as an
  //    empty string) to the query substring we would eventually want to
  //    construct using string interpolation when we need to make use of
  //    this sort of query, and then appending this variable to the where
  //    clause generated by the VIF's filters in all cases, since when it
  //    is an empty string it will have no effect. None of this process
  //    takes place in a context in which we would need to represent any
  //    of these contortions in the VIF itself; rather, this is all
  //    implicit in the user selecting the 'show "other" category'
  //    configuration option.
  let additionalWhereClauseComponent = '';

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

  // If the vif is not currently filtering on the dimension, then all we
  // need to do is add != filters for each dimension value present in the
  // original query response.
  if (!isFilteringOnDimensionColumn) {

    dimensionFilters = nonNullDimensionValues.map((dimensionValue) => {

      return {
        'function': 'binaryOperator',
        columnName: dimensionColumnName,
        arguments: {
          operator: '!=',
          operand: dimensionValue
        }
      };
    });

    // If there were any null dimension values, then we need to add an
    // additional 'not null' constraint on the other query.
    //
    // See large comment above original assignment of
    // 'additionalWhereClauseComponent' for details on why we are
    // not using VIF filters to represent this part of the where clause.
    if (dimensionValuesIncludeNull) {
      additionalWhereClauseComponent = `\`${dimensionColumnName}\` IS NOT NULL`;
    // Otherwise, we need to add an additional 'is not null' constraint
    // instead (SoQL will not include rows where the value in question
    // is null in responses to COUNT queries unless you explicitly ask
    // for it, which causes the dimension values and the 'other' category
    // value to not correctly sum to the number of rows in the dataset).
    //
    // See the explanation at the top of this conditional group as to
    // why this cannot simply be done using an isNull filter object.
    } else {
      additionalWhereClauseComponent = `\`${dimensionColumnName}\` IS NULL`;
    }
  // If the vif is currently filtering on the dimension (as we do when
  // compiling data for grouped charts) then we need to invert those
  // filters affecting the dimension as opposed to just adding != filters
  // on the dimension as we would do in the simpler case.
  } else {

    const invertBinaryOperatorFilter = (filter) => {
      const invertOperator = (operator) => {

        switch (operator) {
          case '=': return '!=';
          case '!=': return '=';
          case '>=': return '<';
          case '<=': return '>';
          case '>': return '<=';
          case '<': return '>=';
          case 'IS NULL': return 'IS NOT NULL';
          case 'IS NOT NULL': return 'IS NULL';
        }
      };

      if (_.isArray(filter.arguments)) {

        return filter.arguments.map((filterArgument) => {
          const operator = filterArgument.operator;
          const invertedArguments = {
            operator: invertOperator(operator)
          };

          if (operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
            invertedArguments.operand = filterArgument.operand;
          }

          return {
            'function': 'binaryOperator',
            columnName: filter.columnName,
            arguments: invertedArguments
          };
        });
      } else {

        const operator = filter.arguments.operator;
        const invertedArguments = {
          operator: invertOperator(filter.arguments.operator)
        };

        if (operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
          invertedArguments.operand = filter.arguments.operand;
        }

        return [
          {
            'function': 'binaryOperator',
            columnName: filter.columnName,
            arguments: invertedArguments
          }
        ];
      }
    };
    const invertIsNullFilter = (filter) => {

      // Note that we are returning an array with a single element because
      // the inverse of a single binaryOperatorFilters might be multiple
      // filters (this can happen if the filter is doing an OR join on
      // multiple arguments, in which case the inverse would be an AND
      // join, which is not supported by the array-of-argument-objects
      // use case, necessitating our creating multiple independent filters
      // instead.
      return [
        {
          'function': 'isNull',
          columnName: filter.columnName,
          arguments: {
            isNull: !filter.arguments.isNull
          }
        }
      ];
    };
    const nonDimensionFiltersVif = _.cloneDeep(vif);
    nonDimensionFiltersVif.series[0].dataSource.filters =
      nonDimensionFilters;
    const nonDimensionFiltersWhereClauseComponents = SoqlHelpers.
      whereClauseFilteringOwnColumn(
        nonDimensionFiltersVif,
        seriesIndex
      );

    // Invert all of the filters affecting the dimension column.
    dimensionFilters = _.flatMap(
      allFilters.
        filter((filter) => {
          return filter.columnName === dimensionColumnName;
        }).
        map((filter) => {

          switch (filter.function) {

            case 'binaryOperator':
              return invertBinaryOperatorFilter(filter);

            case 'isNull':
              return invertIsNullFilter(filter);

            default:
              return null;
          }
        }).
        filter((filter) => !_.isNull(filter))
    );

    // If there were any null dimension values, then we need to add an
    // additional 'not null' constraint on the other query.
    //
    // See large comment above original assignment of
    // 'additionalWhereClauseComponent' for details on why we are
    // not using VIF filters to represent this part of the where clause.
    if (dimensionValuesIncludeNull) {

      additionalWhereClauseComponent = ` (
        ${nonDimensionFiltersWhereClauseComponents} AND
        \`${dimensionColumnName}\` IS NOT NULL
      )`;
    // Otherwise, we need to add an additional 'is not null' constraint
    // instead (SoQL will not include rows where the value in question
    // is null in responses to COUNT queries unless you explicitly ask
    // for it, which causes the dimension values and the 'other' category
    // value to not correctly sum to the number of rows in the dataset).
    //
    // See the explanation at the top of this conditional group as to
    // why this cannot simply be done using an isNull filter object.
    } else {

      additionalWhereClauseComponent = ` (
        ${nonDimensionFiltersWhereClauseComponents} AND
        \`${dimensionColumnName}\` IS NULL
      )`;
    }
  }

  let otherCategoryFilters = dimensionFilters.concat(nonDimensionFilters);

  _.set(
    otherCategoryVif,
    `series[${seriesIndex}].dataSource.filters`,
    otherCategoryFilters
  );

  /**
   * Step 2: Generate a query using the synthesized 'other' category vif.
   */

  const otherCategoryWhereClauseComponents = SoqlHelpers.
    whereClauseFilteringOwnColumn(
      otherCategoryVif,
      seriesIndex
    );
  const isUnaggregatedQuery = (
    _.isNull(series.dataSource.dimension.aggregationFunction) &&
    _.isNull(series.dataSource.measure.aggregationFunction)
  );
  const otherCategoryAggregationClause = SoqlHelpers.aggregationClause(
    otherCategoryVif,
    seriesIndex,
    'measure'
  );
  const otherCategoryLabel = I18n.translate(
    'visualizations.common.other_category'
  );

  let otherCategoryWhereClause = '';
  let otherCategoryQueryString;

  if (
    otherCategoryWhereClauseComponents.length > 0 &&
    additionalWhereClauseComponent.length > 0
  ) {

    otherCategoryWhereClause = `
      WHERE ${otherCategoryWhereClauseComponents}
      OR ${additionalWhereClauseComponent}`;
  } else if (otherCategoryWhereClauseComponents.length > 0) {
    otherCategoryWhereClause = `WHERE ${otherCategoryWhereClauseComponents}`;
  } else if (additionalWhereClauseComponent.length > 0) {
    otherCategoryWhereClause = `WHERE ${additionalWhereClauseComponent}`;
  }

  if (isUnaggregatedQuery) {

    otherCategoryQueryString = `
      SELECT
        '${otherCategoryLabel}' AS ${SoqlHelpers.dimensionAlias()},
        COUNT(*) AS ${SoqlHelpers.measureAlias()}
      ${otherCategoryWhereClause}
      LIMIT ${maxRowCount}`;
  } else {

    otherCategoryQueryString = `
      SELECT
        '${otherCategoryLabel}' AS ${SoqlHelpers.dimensionAlias()},
        ${otherCategoryAggregationClause} AS ${SoqlHelpers.measureAlias()}
      ${otherCategoryWhereClause}
      LIMIT ${maxRowCount}`;
  }

  // Since we're using values from first query as filters, we have to url
  // encode query string. Characters like `&` come with surprises.
  const uriEncodedOtherCategoryQueryString = encodeURIComponent(
    otherCategoryQueryString.replace(/[\n\s]+/g, ' ')
  );
  const soqlDataProvider = new SoqlDataProvider({
    datasetUid: series.dataSource.datasetUid,
    domain: series.dataSource.domain
  });

  return soqlDataProvider.
    query(
      uriEncodedOtherCategoryQueryString,
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

      return {
        columns: queryResponse.columns,
        rows: actualRows
      };
    }).
    catch(() => {
      const error = new Error();

      error.errorMessages = [
        I18n.translate(
          'visualizations.common.error_other_category_query_failed'
        )
      ];

      throw error;
    });
}

function mapQueryResponseToDataTable(queryResponse) {
  const dataTable = queryResponse;
  const dimensionIndex = dataTable.columns.indexOf(SoqlHelpers.dimensionAlias());
  const measureIndex = dataTable.columns.indexOf(SoqlHelpers.measureAlias());

  let valueAsNumber;

  dataTable.columns[dimensionIndex] = 'dimension';
  dataTable.columns[measureIndex] = 'measure';

  dataTable.rows.forEach((row) => {

    try {

      if (_.isUndefined(row[dimensionIndex])) {
        row[dimensionIndex] = null;
      }

      if (_.isUndefined(row[measureIndex])) {
        valueAsNumber = null;
      } else {
        valueAsNumber = Number(row[measureIndex]);
      }
    } catch (error) {

      if (window.console && window.console.error) {

        console.error(
          `Could not convert measure value to number: ${row[measureIndex]}`
        );
      }

      valueAsNumber = null;
    }

    row[measureIndex] = valueAsNumber;
  });

  return dataTable;
}

module.exports = makeSocrataCategoricalDataRequest;

// Vendor Imports
const _ = require('lodash');
var utils = require('socrata-utils');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
const I18n = require('../I18n');
const makeSocrataCategoricalDataRequest = require('./makeSocrataCategoricalDataRequest');
// Constants
const MAX_GROUP_COUNT = 12;

function getData(vif, options) {

  /**
   * The purpose of this function is to ask for up to LIMIT + 1 unique dimension
   * values and add them to the state that gets passed to each successive
   * function so that we know how many dimension values will require grouping
   * queries, and also if we need to show a dimension '(Other)' category.
   */
  function addDimensionValuesToState(state) {

    utils.assertHasProperties(
      state,
      'vif',
      'columnName',
      'soqlDataProvider'
    );

    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      state.vif,
      0
    );
    const whereClause = (whereClauseComponents.length > 0) ?
      `WHERE ${whereClauseComponents}` :
      '';
    const orderByParameter = _.get(
      state.vif,
      'series[0].dataSource.orderBy.parameter',
      'dimension'
    );
    const aliasForOrderByParameter = (orderByParameter === 'dimension') ?
      SoqlHelpers.dimensionAlias() :
      SoqlHelpers.measureAlias();
    const orderBySort = _.get(
      state.vif,
      'series[0].dataSource.orderBy.sort',
      'ASC'
    ).toUpperCase();
    const limitFromVif = _.get(state.vif, 'series[0].dataSource.limit', null);
    const limit = (_.isNumber(limitFromVif)) ?
      parseInt(limitFromVif, 10) :
      options.MAX_ROW_COUNT;
    const dimensionQueryString = [
      'SELECT',
        `\`${state.columnName}\` AS ${SoqlHelpers.dimensionAlias()},`,
        `COUNT(*) AS ${SoqlHelpers.measureAlias()}`,
      whereClause,
      `GROUP BY \`${state.columnName}\``,
      `ORDER BY ${aliasForOrderByParameter} ${orderBySort}`,
      'NULL LAST',
      `LIMIT ${limit + 1}`
    ].join(' ');

    return state.soqlDataProvider.query(
      dimensionQueryString,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias()
    ).
      then((dimensionValues) => {

        // If the 'showOtherCategory' property is enabled in the vif AND there
        // are more than 'limit' unique dimension values, then we
        // need to make '(Other)' category queries for the dimension column.
        state.dimensionRequiresOtherCategory = (
          _.get(state.vif, 'configuration.showOtherCategory', false) &&
          dimensionValues.rows.length > limit
        );

        state.dimensionValues = dimensionValues.rows.
          // We asked for one more dimension value than we actually want to test
          // if we need to show an '(Other)' category for dimension values, so
          // we need to take one fewer than the total when actually recording
          // dimension values for future use.
          slice(0, limit).
          map((row) => {

            return _.isUndefined(row[0]) ?
              null :
              row[0];
          });

        return state;
      });
  }

  /**
   * The purpose of this function is to ask for up to LIMIT + 1 unique grouping
   * values and add them to the state that gets passed to each successive
   * function so that we know how many and which grouping queries to make for
   * each dimension value, and also if we need to show a grouping '(Other)'
   * category.
   */
  function addGroupingValuesToState(state) {

    utils.assertHasProperties(
      state,
      'vif',
      'groupingColumnName',
      'soqlDataProvider'
    );

    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      state.vif,
      0
    );
    const whereClause = (whereClauseComponents.length > 0) ?
      `WHERE ${whereClauseComponents}` :
      '';
    const sortOrder = _.get(
      state.vif,
      'series[0].dataSource.orderBy.sort',
      'ASC'
    ).toUpperCase();
    const groupingQueryString = `
      SELECT
        \`${state.groupingColumnName}\` AS ${SoqlHelpers.dimensionAlias()}
      ${whereClause}
      GROUP BY \`${state.groupingColumnName}\`
      ORDER BY ${SoqlHelpers.dimensionAlias()} ${sortOrder}
      LIMIT ${MAX_GROUP_COUNT + 1}`;

    return state.soqlDataProvider.query(
      groupingQueryString,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias()
    ).
      then((groupingValues) => {

        // If there are more than MAX_GROUP_COUNT distinct values in the
        // grouping_column, then we need to make '(Other)' category queries for
        // the grouping column.
        state.groupingRequiresOtherCategory = (
          groupingValues.rows.length > MAX_GROUP_COUNT
        );

        state.groupingValues = groupingValues.rows.
          // We asked for one more grouping value than we actually want to test
          // if we need to show an '(Other)' category for grouping values, so we
          // need to take one fewer than the total when actually recording
          // grouping values for future use.
          slice(0, MAX_GROUP_COUNT).
          map((row) => {

            return _.isUndefined(row[0]) ?
              null :
              row[0];
          });

        return state;
      });
  }

  /**
   * This function is a real doozy. In the simplest case, we need to break up
   * the total number of rows for each distinct value in the dimension column
   * by their distinct values in the grouping column.
   *
   * Moreover, because there are two different cases in which we might need to
   * make '(Other)' category requests, we end up generating a lot of vifs which
   * are then passed to the default 'makeSocrataCategoricalDataRequest'
   * mechanism, the results of which queries are then merged back into a single
   * data table object by the following
   * 'mapGroupingDataResponsesToMultiSeriesTable' function.
   *
   * The two types of '(Other)' category that we need to accommodate are:
   *
   *   1. If the user has enabled the 'showOtherCategory' property in the vif,
   *      then we need to generate a dimension value (the groups rendered along
   *      the dimension axis, same as with non-grouped charts) that represents
   *      the inverse of the dimension values that are being drawn.
   *
   *   2. If there are more distinct values in the grouping column than
   *      MAX_GROUP_COUNT, we also need to construct an '(Other)' category for
   *      each dimension value that represents the inverse of the grouping
   *      values being drawn FOR EACH DIMENSION VALUE, as well as for the
   *      dimension '(Other)' category as described in point 1 if the user has
   *      enabled the 'showOtherCategory' property in the vif.
   *
   * Finally, because the types of requests we need to build to get all these
   * values differ slightly to how the '(Other)' category request of type 1 is
   * constructed by the underlying 'makeSocrataCategoricalDataRequest' in the
   * non-grouping case, we explicitly disable the 'showOtherCategory' property
   * in the vifs we construct for grouping purposes in order to avoid the
   * automatic '(Other)' category functionality in
   * 'makeSocrataCategoricalDataRequest' because it will generate subtle-ly
   * incorrect results. It may be possible to reconcile these two places that
   * make '(Other)' category requests or generate more complex queries in order
   * to make fewer independent requests, but for the sake of clarity and
   * correctness no work has been done on this yet.
   *
   * The queries we need to generate should, if the 'showOtherCategory' property
   * is enabled in the vif, result in all rows being represented on the chart.
   *
   * For example, consider the following data with the artificially-low limits
   * of 2 for both the 'limit' property in the vif and MAX_GROUP_COUNT:
   *
   * dimension_column as d      grouping_column as g
   * =====================      ====================
   *      a                          x
   *      b                          y
   *      c                          z
   *
   * We need to generate the following queries. In order to refer to the various
   * types in comments in the code, and to disambiguate these types from the
   * example values in dimension_column and grouping_column above, I have named
   * the types of queries after animals:
   *
   *            | Anteater query:  ...WHERE d = 'a' AND g = 'x'
   *       'a' -| Anteater query:  ...WHERE d = 'a' AND g = 'y'
   *            | Beaver query:    ...WHERE d = 'a' AND (g != 'x' AND g != 'y')
   *
   *            | Anteater query:  ...WHERE d = 'b' AND g = 'x'
   *       'b' -| Anteater query:  ...WHERE d = 'b' AND g = 'y'
   *            | Beaver query:    ...WHERE d = 'b' AND (g != 'x' AND g != 'y')
   *
   *            | Chincilla query: ...WHERE (d != 'a' AND d != 'b') AND g = 'x'
   * '(Other)' -| Chincilla query: ...WHERE (d != 'a' AND d != 'b') AND g = 'y'
   *            | Dingo query:     ...WHERE (d != 'a' AND d != 'b') AND
   *                                        (g != 'x' AND g != 'y')
   *
   * Note that in this idealized example world, selecting 'd != "a"' will result
   * in all rows where d is not 'a' or d is null; this is not how SoQL works
   * however, so in actually generating these idealized queries we also need to
   * add an 'OR d IS NULL' or 'OR d IS NOT NULL' to all queries using the '!='
   * operator on dimension_column based on whether one of the distinct dimension
   * values being drawn on the chart (e.g. ['a', 'b'] in the example above) is
   * null.
   *
   * We must also do the same thing for queries using the '!=' operator on
   * grouping_column based on whether one of the distinct grouping values being
   * drawn on the chart (e.g. ['x', 'y'] in the example above is null.
   */
  function makeGroupingDataRequests(state) {
    const filtersFromVif = _.get(
      state.vif,
      'series[0].dataSource.filters',
      []
    );
    const getBinaryOperatorFilterArguments = (operand, overrideOperator) => {
      const operator = (_.isUndefined(overrideOperator)) ?
        '=' :
        overrideOperator;

      return (_.isNull(operand)) ?
        { operator: (operator === '=') ? 'IS NULL' : 'IS NOT NULL' } :
        { operator: operator, operand: operand };
    };
    const generateGroupingVifWithFilters = (filtersForGroupingVif) => {
      const groupingVif = _.cloneDeep(state.vif);

      _.unset(groupingVif, 'configuration.showOtherCategory');
      _.unset(groupingVif, 'series[0].dataSource.limit');
      _.unset(groupingVif, 'series[0].dataSource.orderBy');
      _.set(
        groupingVif,
        'series[0].dataSource.filters',
        filtersForGroupingVif
      );

      return groupingVif;
    };
    const groupingValuesIncludeNull = _.includes(
      state.groupingValues,
      null
    );
    const dimensionValuesIncludeNull = _.includes(
      state.dimensionValues,
      null
    );
    const groupingData = [];
    const otherCategoryName = I18n.translate(
      'visualizations.common.other_category'
    );

    // First group dimension values by grouping value. If the dimension value is
    // 'dogs' and we are grouping on age, we should make a separate query for
    // 'dogs' for each distinct age value. If there are more distinct age values
    // than MAX_GROUP_COUNT, then we will do the next step, which is to make one
    // additional request for 'dogs' where the age value is none of the existing
    // distinct values we are querying here.
    state.dimensionValues.forEach((dimensionValue) => {

      /**
       * Anteater queries
       */
      state.groupingValues.forEach((groupingValue) => {
        const groupingValuesFilters = _.cloneDeep(filtersFromVif);

        groupingValuesFilters.push(
          {
            'function': 'binaryOperator',
            columnName: state.columnName,
            arguments: getBinaryOperatorFilterArguments(dimensionValue)
          }
        );
        groupingValuesFilters.push(
          {
            'function': 'binaryOperator',
            columnName: state.groupingColumnName,
            arguments: getBinaryOperatorFilterArguments(groupingValue)
          }
        );

        groupingData.push({
          vif: generateGroupingVifWithFilters(groupingValuesFilters),
          dimensionValue,
          groupingValue
        });
      });

      /**
       * Beaver queries
       */

      // Next invert each of the grouping values to get the 'other' category
      // per dimension value (if there are more than MAX_GROUP_COUNT grouping
      // values per dimension value).
      if (state.groupingRequiresOtherCategory) {
        const invertedGroupingValuesFilters = _.cloneDeep(filtersFromVif);

        invertedGroupingValuesFilters.push(
          {
            'function': 'binaryOperator',
            columnName: state.columnName,
            arguments: getBinaryOperatorFilterArguments(dimensionValue)
          }
        );

        // If one of the grouping values is null, we don't need to force nulls
        // to be counted by the other category queries, so we can just add the
        // one filter excluding the grouping value in question.
        if (groupingValuesIncludeNull) {

          const invertedGroupingValuesFilterArguments = state.groupingValues.
            map((groupingValue) => {
              return getBinaryOperatorFilterArguments(groupingValue, '!=');
            });

          invertedGroupingValuesFilters.push(
            {
              'function': 'binaryOperator',
              columnName: state.groupingColumnName,
              arguments: invertedGroupingValuesFilterArguments,
              joinOn: 'AND'
            }
          );

        // If none of the grouping values are null, then we need to explicitly
        // factor in null values when deriving the grouping value's '(Other)'
        // category by not only excluding the grouping value in question but
        // also asking for null values.
        } else {

          state.groupingValues.forEach((groupingValue) => {

            invertedGroupingValuesFilters.push(
              {
                'function': 'binaryOperator',
                columnName: state.groupingColumnName,
                arguments: [
                  getBinaryOperatorFilterArguments(groupingValue, '!='),
                  { operator: 'IS NULL' }
                ],
                joinOn: 'OR'
              }
            );
          });
        }

        groupingData.push({
          vif: generateGroupingVifWithFilters(invertedGroupingValuesFilters),
          dimensionValue,
          groupingValue: otherCategoryName
        });
      }
    });

    /**
     * Chinchilla queries
     */

    // Third, do the same inversion we did for grouping values but this time for
    // dimension values, in order to generate the '(Other)' dimension category
    // (except for the '(Other) (Other)' case, which is handled by the Dingo
    // query.
    if (state.dimensionRequiresOtherCategory) {
      state.groupingValues.forEach((groupingValue) => {
        const invertedDimensionValuesFilters = _.cloneDeep(filtersFromVif);

        invertedDimensionValuesFilters.push(
          {
            'function': 'binaryOperator',
            columnName: state.groupingColumnName,
            arguments: getBinaryOperatorFilterArguments(groupingValue)
          }
        );

        if (dimensionValuesIncludeNull) {
          const invertedDimensionValuesFilterArguments = state.dimensionValues.
            map((dimensionValue) => {
              return getBinaryOperatorFilterArguments(dimensionValue, '!=');
            });

          invertedDimensionValuesFilters.push(
            {
              'function': 'binaryOperator',
              columnName: state.columnName,
              arguments: invertedDimensionValuesFilterArguments,
              joinOn: 'AND'
            }
          );
        } else {

          state.dimensionValues.forEach((dimensionValue) => {

            invertedDimensionValuesFilters.push(
              {
                'function': 'binaryOperator',
                columnName: state.columnName,
                arguments: [
                  getBinaryOperatorFilterArguments(dimensionValue, '!='),
                  { operator: 'IS NULL' }
                ],
                joinOn: 'OR'
              }
            );
          });
        }

        groupingData.push({
          vif: generateGroupingVifWithFilters(invertedDimensionValuesFilters),
          dimensionValue: otherCategoryName,
          groupingValue
        });
      });
    }

    /**
     * Dingo query
     */

    // Finally, if both grouping and dimension values need an '(Other)' category
    // then we need to make a final query that excludes all extant dimension and
    // all extant grouping values, which is the '(Other) (Other)' category.
    if (
      state.groupingRequiresOtherCategory &&
      state.dimensionRequiresOtherCategory
    ) {
      const invertedEverythingValuesFilters = _.cloneDeep(filtersFromVif);

      if (groupingValuesIncludeNull) {
        const invertedGroupingValuesFilterArguments = state.groupingValues.map(
          (groupingValue) => {
            return getBinaryOperatorFilterArguments(groupingValue, '!=');
          }
        );

        invertedEverythingValuesFilters.push(
          {
            'function': 'binaryOperator',
            columnName: state.groupingColumnName,
            arguments: invertedGroupingValuesFilterArguments,
            joinOn: 'AND'
          }
        );
      } else {

        state.groupingValues.forEach((groupingValue) => {

          invertedEverythingValuesFilters.push(
            {
              'function': 'binaryOperator',
              columnName: state.groupingColumnName,
              arguments: [
                getBinaryOperatorFilterArguments(groupingValue, '!='),
                { operator: 'IS NULL' }
              ],
              joinOn: 'OR'
            }
          );
        });
      }

      if (dimensionValuesIncludeNull) {
        const invertedDimensionValuesFilterArguments = state.dimensionValues.
          map((dimensionValue) => {
            return getBinaryOperatorFilterArguments(dimensionValue, '!=');
          });

        invertedEverythingValuesFilters.push(
          {
            'function': 'binaryOperator',
            columnName: state.columnName,
            arguments: invertedDimensionValuesFilterArguments,
            joinOn: 'AND'
          }
        );
      } else {

        state.dimensionValues.forEach((dimensionValue) => {

          invertedEverythingValuesFilters.push(
              {
                'function': 'binaryOperator',
                columnName: state.columnName,
                arguments: [
                  getBinaryOperatorFilterArguments(dimensionValue, '!='),
                  { operator: 'IS NULL' }
                ],
                joinOn: 'OR'
              }
          );
        });
      }

      groupingData.push({
        vif: generateGroupingVifWithFilters(invertedEverythingValuesFilters),
        dimensionValue: otherCategoryName,
        groupingValue: otherCategoryName
      });
    }

    const groupingRequests = groupingData.map((groupingDatum) => {

      return makeSocrataCategoricalDataRequest(
        groupingDatum.vif,
        0,
        options.MAX_ROW_COUNT
      );
    });

    return new Promise((resolve, reject) => {

      Promise.all(groupingRequests).then((groupingResponses) => {

        groupingData.forEach((groupingDatum, i) => {

          // If this is an 'other' category query response, then we need to sum
          // all the rows to create a composite 'other' category row. The reason
          // this is necessary is that the query we make for the 'other'
          // category must group on the dimension value.
          if (
            groupingDatum.dimensionValue === otherCategoryName ||
            groupingDatum.groupingValue === otherCategoryName
          ) {
            const measureIndex = groupingResponses[i].columns.indexOf(
              'measure'
            );
            const sumOfRows = _.sumBy(groupingResponses[i].rows, measureIndex);

            groupingDatum.data = {
              columns: groupingResponses[i].columns,
              rows: [
                [groupingDatum.dimensionValue, sumOfRows]
              ]
            };
          } else {
            groupingDatum.data = groupingResponses[i];
          }
        });

        state.groupingData = groupingData;

        resolve(state);
      }).
      catch(reject);
    });
  }

  /**
   * The purpose of this function is to take a collection of query responses
   * and rationalize them into a single correct data table object.
   */
  function mapGroupingDataResponsesToMultiSeriesTable(state) {

    utils.assertHasProperties(
      state,
      'groupingValues',
      'groupingRequiresOtherCategory',
      'groupingData'
    );

    const measureIndex = 1;
    const dataToRenderColumns = ['dimension'].concat(state.groupingValues);

    if (state.groupingRequiresOtherCategory) {
      const otherCategoryName = I18n.translate(
        'visualizations.common.other_category'
      );

      dataToRenderColumns.push(otherCategoryName);
    }

    const uniqueDimensionValues = _.uniq(
      state.groupingData.map((groupingDatum) => groupingDatum.dimensionValue)
    );
    const dataToRenderRows = uniqueDimensionValues.map(
      (uniqueDimensionValue) => {
        const groupingDataForDimension = state.groupingData.filter(
          (groupingDatum) => {
            return groupingDatum.dimensionValue === uniqueDimensionValue;
          }
        );
        const row = [uniqueDimensionValue];

        // Ignore the 'dimension' column, but fill in all the rest from their
        // corresponding groupingDataForDimension collections.
        dataToRenderColumns.slice(1).forEach((groupingValue) => {
          const datumForGroupingValue = _.find(
            groupingDataForDimension,
            (datum) => datum.groupingValue === groupingValue
          );
          const rowValue = _.get(
            datumForGroupingValue,
            `data.rows[0][${measureIndex}]`,
            null
          );

          row.push(rowValue);
        });

        return row;
      }
    );

    state.dataToRender = {
      columns: dataToRenderColumns,
      rows: dataToRenderRows
    };

    return state;
  }

  /**
   * The purpose of this function is to apply the order by specified in the
   * original vif to the composite data table object built by
   * 'mapGroupingDataResponsesToMultiSeriesTable'. This is necessary because
   * we have been combining rows from multiple independent query responses, so
   * we have not been able to rely on the ordering in the responses to be
   * consistent in terms of the overall collection of responses.
   */
  function applyOrderBy(state) {

    utils.assertHasProperties(
      state,
      'vif',
      'dataToRender'
    );

    const dimensionIndex = 0;
    const measureIndex = 1;
    const otherCategoryName = I18n.translate(
      'visualizations.common.other_category'
    );
    const orderByParameter = _.get(
      state.vif,
      'series[0].dataSource.orderBy.parameter',
      'measure'
    ).toLowerCase();
    const orderBySort = _.get(
      state.vif,
      'series[0].dataSource.orderBy.sort',
      'desc'
    ).toLowerCase();
    const orderingByDimension = (orderByParameter === 'dimension');
    const sortValueIndex = (orderingByDimension) ?
      dimensionIndex :
      measureIndex;
    const sumRowMeasureValues = (row) => {

      return _.chain(row.slice(dimensionIndex + 1)).
        sumBy((value) => _.isFinite(value) ? value : 0).
        value();
    };
    const makeComparator = (direction) => {
      const compareValues = (direction === 'asc') ?
        (valueA, valueB) => { return valueA >= valueB; } :
        (valueA, valueB) => { return valueA <= valueB; };
      const compareSums = (direction === 'asc') ?
        (sumOfA, sumOfB) => { return sumOfA >= sumOfB; } :
        (sumOfA, sumOfB) => { return sumOfA <= sumOfB; };

      return (a, b) => {
        // If we are ordering by the dimension, the order should always be:
        //
        // <Non-null dimension values>
        // <Null dimension value> (if present in the dimension values)
        // <Other category>
        //
        // Since the dimension values will all be unique, we do not have to
        // handle some comparisons (e.g. if both a and b are '(Other)' or null).
        //
        // If we are ordering by the measure, the order should always be:
        //
        // <Non-null dimension values and/or other category,
        //  depending on measure>
        // <Null measure values>
        if (orderingByDimension) {
          if (a[sortValueIndex] === otherCategoryName) {
            return 1;
          } else if (b[sortValueIndex] === otherCategoryName) {
            return -1;
          } else if (a[sortValueIndex] === null) {
            return 1;
          } else if (b[sortValueIndex] === null) {
            return -1;
          } else {
            return (compareValues(a[sortValueIndex], b[sortValueIndex])) ?
              1 :
              -1;
          }
        } else {
          const sumOfA = sumRowMeasureValues(a);
          const sumOfB = sumRowMeasureValues(b);

          return (compareSums(sumOfA, sumOfB)) ? 1 : -1;
        }
      };
    };

    state.dataToRender.rows.sort(makeComparator(orderBySort));

    return state;
  }

  const initialState = {
    columnName: _.get(vif, 'series[0].dataSource.dimension.columnName', null),
    // Grouping is only valid on the first defined series, and will
    // override any additional series.
    groupingColumnName: _.get(
      vif,
      'series[0].dataSource.dimension.grouping.columnName',
      null
    ),
    groupingValues: null,
    groupingVifs: null,
    soqlDataProvider: new SoqlDataProvider({
      datasetUid: _.get(vif, 'series[0].dataSource.datasetUid', null),
      domain: _.get(vif, 'series[0].dataSource.domain', null)
    }),
    vif: vif
  };

  // If there is no grouping column name we shouldn't have gotten to this point
  // in the first place, but we can just quit early with here as a backup.
  if (
    initialState.columnName === null ||
    initialState.groupingColumnName === null
  ) {
    return Promise.resolve({columns: [], rows: []});
  }

  return Promise.resolve(initialState).
    then(addDimensionValuesToState).
    then(addGroupingValuesToState).
    then(makeGroupingDataRequests).
    then(mapGroupingDataResponsesToMultiSeriesTable).
    then(applyOrderBy).
    then((state) => {
      return Promise.resolve(state.dataToRender);
    });
}

module.exports = {
  MAX_GROUP_COUNT,
  getData
};
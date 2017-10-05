import _ from 'lodash';
import encoding from 'text-encoding';
import utils from 'common/js_utils';
import SoqlDataProvider from './SoqlDataProvider';
import SoqlHelpers from './SoqlHelpers';
import I18n from 'common/i18n';
import makeSocrataCategoricalDataRequest from './makeSocrataCategoricalDataRequest';
import * as MPH from 'common/visualizations/dataProviders/MonthPredicateHelper';

const MAX_GROUP_COUNT = 12;

function getData(vif, options) {
  const maxGroupCount = _.get(options, 'MAX_GROUP_COUNT', MAX_GROUP_COUNT);

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
        `${SoqlHelpers.aggregationClause(state.vif, 0, 'measure')} AS ${SoqlHelpers.measureAlias()}`,
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
      LIMIT ${maxGroupCount + 1}`;

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
          groupingValues.rows.length > maxGroupCount
        );

        state.groupingValues = groupingValues.rows.
          // We asked for one more grouping value than we actually want to test
          // if we need to show an '(Other)' category for grouping values, so we
          // need to take one fewer than the total when actually recording
          // grouping values for future use.
          slice(0, maxGroupCount).
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
    const generateGroupingVifWithFilters = (filtersForGroupingVif, extras = {}) => {
      const groupingVif = _.cloneDeep(state.vif);

      _.unset(groupingVif, 'configuration.showOtherCategory');
      _.unset(groupingVif, 'series[0].dataSource.limit');
      _.unset(groupingVif, 'series[0].dataSource.orderBy');
      _.set(
        groupingVif,
        'series[0].dataSource.filters',
        filtersForGroupingVif
      );

      return Object.assign(groupingVif, extras);
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
    const otherCategoryName = I18n.t(
      'shared.visualizations.charts.common.other_category'
    );

    const chunkedDimensionValues = chunkArrayByLength(state.dimensionValues);
    const chunkedGroupingValues = chunkArrayByLength(state.groupingValues);

    chunkedDimensionValues.forEach((dimensionValuesCurrentChunk) => {
      chunkedGroupingValues.forEach((groupingValuesCurrentChunk) => {

        /**
         * Setup for Anteater, Beaver, Chinchilla, and Dingo queries
         */

        const nonNullDimensionValuesFilter = {
          function: 'in',
          columnName: state.columnName,
          arguments: _.without(dimensionValuesCurrentChunk, null)
        };

        const nullDimensionFilter = {
          function: 'binaryOperator',
          columnName: state.columnName,
          arguments: getBinaryOperatorFilterArguments(null)
        };

        const nonNullGroupingValuesFilter = {
          function: 'in',
          columnName: state.groupingColumnName,
          arguments: _.without(groupingValuesCurrentChunk, null)
        };

        const invertedNonNullGroupingValuesFilter = {
          function: 'not in',
          columnName: state.groupingColumnName,
          arguments: _.without(groupingValuesCurrentChunk, null)
        };

        const nullGroupingFilter = {
          function: 'binaryOperator',
          columnName: state.groupingColumnName,
          arguments: getBinaryOperatorFilterArguments(null)
        };

        const nonNullGroupingFilter = {
          function: 'binaryOperator',
          columnName: state.groupingColumnName,
          arguments: getBinaryOperatorFilterArguments(null, '!=')
        };

        /**
         * Anteater queries
         */

        groupingData.push({
          vif: generateGroupingVifWithFilters(
            _.cloneDeep(filtersFromVif).concat([
              nonNullDimensionValuesFilter,
              nonNullGroupingValuesFilter
            ]),
            {query: "Anteater 1",
             requireGroupingInSelect: true}
          )
        });

        // XXX: NULL values are handled differently in SOQL when used in = clauses
        // and IN clauses, no clue why. This means we need extra queries to retrieve
        // those results.
        if (dimensionValuesIncludeNull) {
          groupingData.push({
            vif: generateGroupingVifWithFilters(
              _.cloneDeep(filtersFromVif).concat([
                nullDimensionFilter,
                nonNullGroupingValuesFilter
              ]),
              {query: "Anteater 2",
               requireGroupingInSelect: true}
            )
          });
        }

        if (groupingValuesIncludeNull) {
          groupingData.push({
            vif: generateGroupingVifWithFilters(
              _.cloneDeep(filtersFromVif).concat([
                nonNullDimensionValuesFilter,
                nullGroupingFilter
              ]),
              {query: "Anteater 3",
               requireGroupingInSelect: true}
            )
          });
        }

        if (dimensionValuesIncludeNull && groupingValuesIncludeNull) {
          groupingData.push({
            vif: generateGroupingVifWithFilters(
              _.cloneDeep(filtersFromVif).concat([
                nullDimensionFilter,
                nullGroupingFilter
              ]),
              {query: "Anteater 4",
               requireGroupingInSelect: true}
            )
          });
        }

        /**
         * Beaver queries
         */

        groupingData.push({
          vif: generateGroupingVifWithFilters(
            _.cloneDeep(filtersFromVif).concat([
              nonNullDimensionValuesFilter,
              nonNullGroupingFilter,
              invertedNonNullGroupingValuesFilter
            ]),
            {query: "Beaver 1",
             requireGroupingInSelect: false}
          )
        });

        if (dimensionValuesIncludeNull) {
          groupingData.push({
            vif: generateGroupingVifWithFilters(
              _.cloneDeep(filtersFromVif).concat([
                nullDimensionFilter,
                nonNullGroupingFilter,
                invertedNonNullGroupingValuesFilter
              ]),
              {query: "Beaver 2",
               requireGroupingInSelect: false}
            )
          });
        }

        /**
         * Chinchilla queries
         */

        // Third, do the same inversion we did for grouping values but this time for
        // dimension values, in order to generate the '(Other)' dimension category
        // (except for the '(Other) (Other)' case, which is handled by the Dingo
        // query.
        if (state.dimensionRequiresOtherCategory) {
          groupingValuesCurrentChunk.forEach((groupingValue) => {
            const invertedDimensionValuesFilters = _.cloneDeep(filtersFromVif);

            invertedDimensionValuesFilters.push(
              {
                'function': 'binaryOperator',
                columnName: state.groupingColumnName,
                arguments: getBinaryOperatorFilterArguments(groupingValue)
              }
            );

            if (dimensionValuesIncludeNull) {
              const invertedDimensionValuesFilterArguments = dimensionValuesCurrentChunk.
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

              dimensionValuesCurrentChunk.forEach((dimensionValue) => {

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
              query: "Chinchilla",
              vif: generateGroupingVifWithFilters(
                invertedDimensionValuesFilters,
                {query: "Chinchilla",
                 requireGroupingInSelect: false}),
              dimensionValue: otherCategoryName, // XXX: critical
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
            const invertedGroupingValuesFilterArguments = groupingValuesCurrentChunk.map(
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

            groupingValuesCurrentChunk.forEach((groupingValue) => {

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
            const invertedDimensionValuesFilterArguments = dimensionValuesCurrentChunk.
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

            dimensionValuesCurrentChunk.forEach((dimensionValue) => {

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
            vif: generateGroupingVifWithFilters(
              invertedEverythingValuesFilters,
              {query: "Dingo",
               requireGroupingInSelect: false}),
            dimensionValue: otherCategoryName,
            groupingValue: otherCategoryName
          });
        }

      });
    });

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
          if (groupingDatum.vif.query === "Dingo") {
            const measureIndex = groupingResponses[i].columns.indexOf('measure');
            const sumOfRows = _.sumBy(groupingResponses[i].rows, measureIndex);
            groupingDatum.data = {
              columns: groupingResponses[i].columns,
              rows: [
                [groupingDatum.dimensionValue, sumOfRows]
              ]
            };
          }
          // everything else
          else {
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

    const dimensionColumn = 'dimension';
    const dimensionIndex = 0;
    const measureIndex = 1;
    const dimensionLookupTable = _.reduce(
      state.dimensionValues,
      (res, value) => {
        res[value] = true;
        return res;
      },
      {}
    );
    const dataToRenderColumns = [dimensionColumn].concat(state.groupingValues);

    const otherCategoryName = I18n.t('shared.visualizations.charts.common.other_category');
    if (state.groupingRequiresOtherCategory) {
      dataToRenderColumns.push(otherCategoryName);
    }

    // state.groupingData is an array of objects. Each of those objects has a
    // data field. That field must be processed cleanly and return something
    // that matches the expected table, one meant for rendering.

    const table = {};

    state.groupingData.forEach((datum) => {
      if (datum.vif.requireGroupingInSelect) {
        // process 3-column results
        datum.data.rows.forEach((row) => {
          const [dimension, grouping, measure] = row;
          const standardizedDimension = _.isUndefined(dimension) ? null : dimension;
          let path;
          if (dimensionLookupTable[standardizedDimension]) {
            path = [standardizedDimension, grouping];
          } else {
            path = [otherCategoryName, grouping];
          }
          const existing = _.get(table, path, 0);
          _.setWith(table, path, existing + measure, Object);
        });
      } else {
        // process 2-column results
        datum.data.rows.forEach((row) => {
          const [dimension, measure] = row;
          const standardizedDimension = _.isUndefined(dimension) ? null : dimension;
          let path;
          if (dimensionLookupTable[standardizedDimension]) {
            path = [standardizedDimension, datum.groupingValue];
          } else {
            path = [otherCategoryName, datum.groupingValue];
          }
          const existing = _.get(table, path, 0);
          _.setWith(table, path, existing + measure, Object);
        });
      }
    });

    // Convert the table (a map data structure) into an array of rows suitable
    // for rendering, with entries ordered as specified by dataToRenderColumns:
    const nullConverterFn = (x) => { return (x === "null") ? null : x; };
    const otherIndex = _.findIndex(dataToRenderColumns, (x) => x === otherCategoryName);
    const dataToRenderRows = _.map(table, (rowData, dimension) => {
      const realDimension = nullConverterFn(dimension);
      const row = [realDimension];
      const otherColumns = _.difference(_.map(_.keys(rowData), nullConverterFn), dataToRenderColumns);
      dataToRenderColumns.forEach((col) => {
        if (col !== dimensionColumn) {
          row.push(_.get(rowData, col, null));
        }
      });
      // deal with "(Other)" columns
      if (state.groupingRequiresOtherCategory && _.isNull(row[otherIndex])) {
        // find all rowData entries for columns /other/ than the ones requested
        row[otherIndex] = 0;
        otherColumns.forEach((col) => {
          row[otherIndex] += _.get(rowData, col, 0);
        });
      }
      return row;
    });

    return {
      columns: dataToRenderColumns,
      rows: dataToRenderRows
    };
  }

  /**
   * The purpose of this function is to apply the order by specified in the
   * original vif to the composite data table object built by
   * 'mapGroupingDataResponsesToMultiSeriesTable'. This is necessary because
   * we have been combining rows from multiple independent query responses, so
   * we have not been able to rely on the ordering in the responses to be
   * consistent in terms of the overall collection of responses.
   */
  function applyOrderBy(dataTable) {
    const dimensionIndex = 0;
    const measureIndex = 1;

    const otherCategoryName = I18n.t(
      'shared.visualizations.charts.common.other_category'
    );

    const orderBy = _.get(vif, 'series[0].dataSource.orderBy', {});
    const orderByParameter = (orderBy.parameter || 'measure').toLowerCase();
    const orderBySort = (orderBy.sort || 'desc').toLowerCase();
    const orderingByDimension = (orderByParameter === 'dimension');

    const sortValueIndex = (orderingByDimension) ?
      dimensionIndex :
      measureIndex;

    const sumRowMeasureValues = (row) => {
      return _.chain(row.slice(dimensionIndex + 1)).
        sumBy((value) => _.isFinite(value) ? value : 0).
        value();
    };

    // Determine whether all values for ordering are numeric.
    // See note on compare function at bottom.
    const doSortNumeric = _(dataTable.rows).
      map((row) => {
        return orderingByDimension ?
          row[sortValueIndex] :
          sumRowMeasureValues(row);
      }).
      compact().
          every((val) => !_.isNaN(_.toNumber(val)));

    // Determine whether all values for ordering are months in the same language.
    const language = MPH.detectLanguage(_.get(dataTable, `rows.0.${sortValueIndex}`, null));
    const doSortMonths =
      !doSortNumeric &&
      language &&
      _.every(dataTable.rows,
              (row) => !_.isUndefined(MPH.monthIndex(row[sortValueIndex], language)));

    let transformer = _.identity;
    if (doSortNumeric) {
      transformer = _.toNumber;
    }
    else if (doSortMonths) {
      transformer = (x) => _.toNumber(MPH.monthIndex(x, language));
    }

    const compareValues = makeValueComparator(orderBySort, transformer);
    const compareCategoriesToNullAndOther = (a, b) => {
      if (a === otherCategoryName) {
        return 1;
      } else if (b === otherCategoryName) {
        return -1;
      } else if (a === null) {
        return 1;
      } else if (b === null) {
        return -1;
      } else {
        // Categories that aren't null or "other" need to use a different sort.
        return 0;
      }
    };

    const comparator = (a, b) => {
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
      // <Non-null dimension values and/or other category, depending on measure>
      // <Null measure values>
      const categoryA = a[0];
      const categoryB = b[0];
      const sumOfA = sumRowMeasureValues(a);
      const sumOfB = sumRowMeasureValues(b);

      if (orderingByDimension) {
        return compareCategoriesToNullAndOther(categoryA, categoryB) ||
          compareValues(categoryA, categoryB);
      } else {
        return compareValues(sumOfA, sumOfB) ||
          compareCategoriesToNullAndOther(categoryA, categoryB) ||
          compareValues(categoryA, categoryB);
      }
    };

    dataTable.rows.sort(comparator);

    return dataTable;
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
    soqlDataProvider: new SoqlDataProvider(
      {
        datasetUid: _.get(vif, 'series[0].dataSource.datasetUid', null),
        domain: _.get(vif, 'series[0].dataSource.domain', null)
      },
      true),
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
    then(applyOrderBy);
}

// Generalized comparison routine for arbitrary values.
//
// Note that, at this point, we may have lost type information - the results of
// the query might cast everything into strings, which is very inconvenient...
// so we need to stipulate explicitly whether our order comparison should use
// lexicographic or numeric ordering.
//
// NOTE: There's a possibility that we can move this logic further down into
// makeSocrataCategoricalDataRequest, but at time of writing that module isn't
// covered by tests, so the change is too risky to attempt.
function makeValueComparator(direction, transformer = _.identity) {
  const _compare = (direction === 'asc') ? _.gt : _.lt;

  return (a, b) =>  {
    if (a === b) {
      return 0;
    } else {
      return _compare(transformer(a), transformer(b)) ? 1 : -1;
    }
  };
}

function chunkArrayByLength(arr, maxChunkLength = 1400, chunkByBytes = true) {
  const chunkFn = (chunkByBytes
                   ? (str) => (new encoding.TextEncoder('utf-8').encode(str)).length
                   : (str) => _.size(str));
  let res = [];
  let currentChunk = [];
  let currentChunkLength = 0;
  _.forEach(arr, (elt) => {
    currentChunk.push(elt);
    currentChunkLength += chunkFn(elt);
    if (currentChunkLength >= maxChunkLength) {
      res.push(currentChunk);
      currentChunk = [];
      currentChunkLength = 0;
    }
  });
  if (currentChunkLength !== 0) {
    res.push(currentChunk);
  }
  return res;
}

module.exports = {
  MAX_GROUP_COUNT,
  getData,
  chunkArrayByLength
};

// Vendor Imports
const _ = require('lodash');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
const I18n = require('common/i18n').default;
const makeSocrataTimeDataRequest = require('./makeSocrataTimeDataRequest');
// Constants
const MAX_GROUP_COUNT = 12;
const VALID_SORTS = ['asc', 'desc'];
const DEFAULT_SORT = 'asc';

function getData(vif, options) {

  function addPrecisionToState(state) {
    // For grouping, we can assume that the first series is the only one.
    const seriesIndex = 0;

    return options.getPrecisionBySeriesIndex(state.vif, seriesIndex).
      then((precision) => {

        state.precision = precision;

        return state;
      });
  }

  function addDateTruncFunctionToState(state) {

    state.dateTruncFunction = options.mapPrecisionToDateTruncFunction(
      state.precision
    );

    return Promise.resolve(state);
  }

  function addGroupingValuesToState(state) {
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
    // EN-13888 - Multi-series timeline chart errors when adding grouping
    //
    // While it seems like it should work, using the GROUP BY with a columm
    // alias and not the column name results in a 500 response from the backend.
    //
    // EN-13909 has been filed to investigate whether or not this is expected
    // and, if not, if it can be fixed, but in the meantime we are explicitly
    // repeating the grouping column name in the GROUP BY clause.
    const queryString = [
      'SELECT',
      `\`${state.groupingColumnName}\` AS ${SoqlHelpers.dimensionAlias()}`,
      whereClause,
      `GROUP BY \`${state.groupingColumnName}\``,
      `ORDER BY ${SoqlHelpers.dimensionAlias()} ${sortOrder}`,
      `LIMIT ${MAX_GROUP_COUNT}`
    ].join(' ');

    return state.soqlDataProvider.query(
      queryString,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias()
    ).
    then((groups) => {

      state.groupingValues = groups.rows.map((row) => {

        return _.isUndefined(row[0]) ?
          null :
          row[0];
      });

      state.groupingRequiresOtherCategory = (
        state.groupingValues.length >= MAX_GROUP_COUNT
      );

      return state;
    });
  }

  function buildGroupingVifs(state) {

    // Make one vif for each grouping value which results in an identical query
    // as the original vif, just with the added constraint that the grouping
    // column is constrained to the grouping value in question.
    state.groupingVifs = state.groupingValues.map((groupingValue) => {
      const groupingVif = _.cloneDeep(state.vif);
      const firstSeries = groupingVif.series[0];

      let filter;

      if (groupingValue === null) {

        filter = {
          'function': 'isNull',
          columnName: state.groupingColumnName,
          arguments: {
            isNull: false
          }
        };
      } else {

        filter = {
          'function': 'binaryOperator',
          columnName: state.groupingColumnName,
          arguments: {
            operator: '=',
            operand: groupingValue
          }
        };
      }

      firstSeries.dataSource.filters.push(filter);
      firstSeries.label = groupingValue;

      groupingVif.series = [firstSeries];

      return groupingVif;
    });

    return state;
  }

  function makeGroupingDataRequests(state) {
    const dataRequestOptions = {
      dateTruncFunction: state.dateTruncFunction,
      precision: state.precision,
      maxRowCount: options.MAX_ROW_COUNT
    };
    const groupingDataRequests = state.groupingVifs.map((groupingVif) => {

      return makeSocrataTimeDataRequest(
        groupingVif,
        0,
        dataRequestOptions
      );
    });

    return Promise.all(groupingDataRequests).
      then((groupingDataResponses) => {

        state.groupingData = state.groupingValues.map((groupingValue, i) => {

          return {
            group: groupingValue,
            data: groupingDataResponses[i]
          };
        });

        return state;
      });
  }

  function buildGroupingOtherCategoryQueryString(state) {

    // Note that this is not the same thing as an 'other' category in dimension
    // values (which is what the 'showOtherCategory' configuration flag
    // controls. Rather, 'groupingRequiresOtherCategory' indicates that there
    // are more unique groups than the maximum we allow, which maximum is
    // assigned to the MAX_GROUP_COUNT constant.
    if (!state.groupingRequiresOtherCategory) {
      return state;
    }

    const dimension = SoqlHelpers.dimension(state.vif, 0);
    const measure = SoqlHelpers.measure(state.vif, 0);
    const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
      state.vif,
      0
    );
    const additionalGroupingWhereClauseComponents = state.groupingValues.map(
      (groupingValue) => {

        if (groupingValue === null) {
          return `(${state.groupingColumnName} IS NOT NULL)`;
        } else {
          // EN-13772 - Multiseries Timeline Error
          //
          // Some categorical values can include single quotes, which causes the
          // SoQL parser to get confused about what the parameter for the where
          // clause component is. SoQL allows for these parameters to include
          // single quotes by treating two consecutive single quotes as an
          // escaped single quote post-parse. We actually were already doing
          // this correctly in the code that was mapping filter arrays to where
          // clauses, but it's not currently flexible enough for us to simply
          // do that here as well. Ideally, the way we represent queries will at
          // some point in the future will be flexible enough to accomplish what
          // we are trying to accomplish here as well, and we can get back to
          // having a single place to worry about stuff like this.
          const encodedGroupingValue = SoqlHelpers.soqlEncodeValue(
            groupingValue
          );

          return `(
            ${state.groupingColumnName} != ${encodedGroupingValue} OR
            ${state.groupingColumnName} IS NULL
          )`;
        }
      }
    ).join(' AND ');
    const whereClause = (whereClauseComponents.length > 0) ?
      `WHERE
        ${whereClauseComponents} AND
        ${additionalGroupingWhereClauseComponents}` :
      `WHERE ${additionalGroupingWhereClauseComponents}`;
    const groupByClause = SoqlHelpers.aggregationClause(
      state.vif,
      0,
      'dimension'
    );
    const orderByClause = SoqlHelpers.orderByClauseFromSeries(
      state.vif,
      0
    );
    const queryString = [
      'SELECT',
      `${state.dateTruncFunction}(${dimension}) AS ${SoqlHelpers.dimensionAlias()},`,
      `${measure} AS ${SoqlHelpers.measureAlias()}`,
      whereClause,
      `GROUP BY ${state.dateTruncFunction}(${groupByClause})`,
      `ORDER BY ${orderByClause}`,
      `LIMIT ${options.MAX_ROW_COUNT}`
    ].join(' ');

    state.groupingOtherCategoryQueryString = queryString;

    return state;
  }

  function makeGroupingOtherCategoryRequest(state) {

    if (!state.groupingRequiresOtherCategory) {
      return state;
    }

    return state.soqlDataProvider.
      query(
        state.groupingOtherCategoryQueryString,
        SoqlHelpers.dimensionAlias(),
        SoqlHelpers.measureAlias()
      ).
      then((queryResponse) => {
        const measureIndex = 1;
        const treatNullValuesAsZero = _.get(
          state.vif,
          'configuration.treatNullValuesAsZero',
          false
        );

        let valueAsNumber;

        queryResponse.rows.
          forEach((row) => {
            const value = row[measureIndex];

            try {

              if (_.isUndefined(value)) {
                valueAsNumber = (treatNullValuesAsZero) ? 0 : null;
              } else {
                valueAsNumber = Number(value);
              }
            } catch (error) {

              console.error(
                `Could not convert measure value to number: ${value}`
              );

              valueAsNumber = null;
            }

            row[measureIndex] = valueAsNumber;
          });

        state.groupingOtherCategoryData = queryResponse;

        return state;
      });
  }

  function mapGroupedDataResponsesToMultiSeriesTable(state) {
    const dimensionIndex = 0;
    const measureIndex = 1;
    const sortFromVif = _.toLower(
      _.get(state.vif, 'series[0].dataSource.orderBy.sort')
    );
    const sortFromVifOrDefault = (_.includes(VALID_SORTS, sortFromVif)) ?
      sortFromVif :
      DEFAULT_SORT;
    const ascendingComparator = (a, b) => (a >= b) ? 1 : -1;
    const descendingComparator = (a, b) => (a <= b) ? 1 : -1;
    const comparator = (sortFromVifOrDefault === 'asc') ?
      ascendingComparator :
      descendingComparator;
    const uniqueDimensionValues = _.uniq(
      _.flatMap(
        state.groupingData.map((groupingData) => {
          return groupingData.data.rows.map((row) => row[dimensionIndex]);
        })
      )
    ).sort(comparator);
    const treatNullValuesAsZero = _.get(
      vif,
      'configuration.treatNullValuesAsZero',
      false
    );

    const dataToRenderColumns = ['dimension'].concat(state.groupingValues);

    if (state.groupingRequiresOtherCategory) {

      const otherCategoryName = I18n.t(
        'shared.visualizations.charts.common.other_category'
      );

      dataToRenderColumns.push(otherCategoryName);
    }

    const dataToRenderRows = uniqueDimensionValues.map(
      (uniqueDimensionValue) => {
        const row = [uniqueDimensionValue];

        state.groupingData.forEach((groupingData) => {
          const groupingRowForDimension = _.find(
            groupingData.data.rows,
            (groupingRow) => {
              return groupingRow[dimensionIndex] === uniqueDimensionValue;
            }
          );

          // The measure value is null (or zero, if the treatNullValuesAsZero
          // configuration property on the vif is set to true) if a
          // corresponding dimension value is not found in the response from the
          // backend.
          if (_.isUndefined(groupingRowForDimension)) {
            row.push((treatNullValuesAsZero) ? 0 : null);
          // Otherwise, it is the measure value from the row that corresponds to
          // the dimension value in question.
          } else {
            row.push(groupingRowForDimension[measureIndex]);
          }
        });

        return row;
      }
    );

    if (state.groupingRequiresOtherCategory) {

      dataToRenderRows.forEach((dataToRenderRow) => {
        const dimensionValue = dataToRenderRow[dimensionIndex];
        const otherCategoryRow = _.find(
          state.groupingOtherCategoryData.rows,
          (groupingOtherCategoryRow) => {
            return groupingOtherCategoryRow[dimensionIndex] === dimensionValue;
          }
        );

        // The measure value is null (or zero, if the treatNullValuesAsZero
        // configuration property on the vif is set to true) if a corresponding
        // dimension value is not found in the response from the backend.
        if (_.isUndefined(otherCategoryRow)) {
          dataToRenderRow.push((treatNullValuesAsZero) ? 0 : null);
        // Otherwise, it is the measure value from the row that corresponds to
        // the dimension value in question.
        } else {
          dataToRenderRow.push(otherCategoryRow[measureIndex]);
        }
      });
    }

    state.dataToRender = {
      columns: dataToRenderColumns,
      rows: dataToRenderRows,
      precision: state.precision
    };

    return state;
  }

  const initialState = {
    columnName: _.get(vif, 'series[0].dataSource.dimension.columnName', null),
    // Grouping is only valid on the first defined series, and will override any
    // additional series.
    groupingColumnName: _.get(
      vif,
      'series[0].dataSource.dimension.grouping.columnName',
      null
    ),
    groupingValues: null,
    groupingVifs: null,
    groupingOtherCategoryUriEncodedQueryString: null,
    soqlDataProvider: new SoqlDataProvider({
      datasetUid: _.get(vif, 'series[0].dataSource.datasetUid', null),
      domain: _.get(vif, 'series[0].dataSource.domain', null)
    }),
    vif
  };

  // If there is no grouping column name we shouldn't have gotten to this point
  // in the first place, but we can just quit early with here as a backup.
  if (
    initialState.columnName === null || initialState.groupingColumnName === null
  ) {
    return Promise.resolve({ columns: [], rows: [] });
  }

  return Promise.resolve(initialState).
    then(addPrecisionToState).
    then(addDateTruncFunctionToState).
    then(addGroupingValuesToState).
    then(buildGroupingVifs).
    then(makeGroupingDataRequests).
    then(buildGroupingOtherCategoryQueryString).
    then(makeGroupingOtherCategoryRequest).
    then(mapGroupedDataResponsesToMultiSeriesTable).
    then((state) => {
      return state.dataToRender;
    });
}

module.exports = {
  MAX_GROUP_COUNT,
  getData
};

// Vendor Imports
const _ = require('lodash');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
const I18n = require('../I18n');
const makeSoqlDataRequest = require('./makeSoqlDataRequest');
// Constants
const MAX_GROUP_COUNT = 12;

function getData(vif, maxRowCount) {

  function addDimensionValuesToState(state) {
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
    const limitFromVif = _.get(state.vif, 'series[0].dataSource.limit', null);
    const limit = (_.isNumber(limitFromVif)) ?
      parseInt(limitFromVif, 10) :
      maxRowCount;
    const groupingQueryString = `
      SELECT
        \`${state.columnName}\` AS ${SoqlHelpers.dimensionAlias()},
        COUNT(*) AS ${SoqlHelpers.measureAlias()}
      ${whereClause}
      GROUP BY \`${state.columnName}\`
      ORDER BY ${SoqlHelpers.dimensionAlias()} ${sortOrder}
      NULL LAST
      LIMIT ${limit}`;
    const uriEncodedQueryString = encodeURIComponent(
      groupingQueryString.replace(/[\n\s]+/g, ' ').trim()
    );

    return state.soqlDataProvider.query(
      uriEncodedQueryString,
      SoqlHelpers.dimensionAlias(),
      SoqlHelpers.measureAlias()
    ).
      then((dimensionValues) => {

        state.dimensionValues = dimensionValues.rows.map((row) => {

          return _.isUndefined(row[0]) ?
            null :
            row[0];
        });

        return state;
      });
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
    const groupingQueryString = `
      SELECT
        \`${state.groupingColumnName}\` AS ${SoqlHelpers.dimensionAlias()}
      ${whereClause}
      GROUP BY \`${state.groupingColumnName}\`
      ORDER BY ${SoqlHelpers.dimensionAlias()} ${sortOrder}
      LIMIT ${MAX_GROUP_COUNT}`;
    const uriEncodedQueryString = encodeURIComponent(
      groupingQueryString.replace(/[\n\s]+/g, ' ').trim()
    );

    return state.soqlDataProvider.query(
      uriEncodedQueryString,
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

  function makeGroupingDataRequests(state) {

    state.groupingVifs = state.groupingValues.map((groupingValue) => {
      const groupingVif = _.cloneDeep(state.vif);
      const firstSeries = groupingVif.series[0];
      const limitFromVif = _.get(state.vif, 'series[0].dataSource.limit', null);

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

      if (limitFromVif !== null) {

        // If there is a limit in the vif, then we need to ensure that we are
        // selecting the same dimension values for each group request. This is
        // accomplished by adding additional filters for only those values.
        //
        // Because we need to join these with OR and not AND, it means we have
        // to use a single binaryOperator filter and therefore cannot also use
        // the isNull filter like we would on the grouping value below.
        const dimensionValueFilterArguments = state.dimensionValues.
          map((dimensionValue) => {

            if (dimensionValue === null) {
              return null;
            } else {

              return {
                operator: '=',
                operand: dimensionValue
              };
            }
          }).
          filter((dimensionValueFilter) => {
            return dimensionValueFilter !== null;
          });

        filter = {
          'function': 'binaryOperator',
          columnName: state.columnName,
          arguments: dimensionValueFilterArguments
        };

        firstSeries.dataSource.filters.push(filter);
      }

      firstSeries.label = groupingValue;

      groupingVif.series = [firstSeries];

      return groupingVif;
    });

    const groupingDataRequests = state.groupingVifs.map((groupingVif) => {
      return makeSoqlDataRequest(groupingVif, 0, maxRowCount);
    });

    return new Promise((resolve, reject) => {

      Promise.all(groupingDataRequests).
        then((groupingDataResponses) => {

          state.groupingData = state.groupingValues.map((groupingValue, i) => {

            return {
              group: groupingValue,
              data: groupingDataResponses[i]
            };
          });

          resolve(state);
        }).
        catch(reject);
    });
  }

  function makeDimensionValueOtherCategoryRequests(state) {

    // If we need to collapse additional group values into an 'other' category.
    // Note that this is not the same thing as an 'other' category in dimension
    // values (which is what the 'showOtherCategory' configuration flag
    // controls. Rather, 'groupingRequiresOtherCategory' indicates that there
    // are more unique groups than the maximum we allow, which maximum is
    // assigned to the MAX_GROUP_COUNT constant.
    if (!state.groupingRequiresOtherCategory) {
      return Promise.resolve(state);
    } else {

      state.dimensionValueOtherCategoryVifs = state.dimensionValues.map(
        (dimensionValue) => {
          const otherCategoryVif = _.cloneDeep(state.vif);
          const filters = state.groupingValues.map((groupingValue) => {
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
                  operator: '!=',
                  operand: groupingValue
                }
              };
            }

            return filter;
          });

          const baseFilter = {
            'function': 'binaryOperator',
            columnName: state.columnName,
            arguments: {
              operator: '=',
              operand: dimensionValue
            }
          };

          filters.push(baseFilter);

          otherCategoryVif.series[0].dataSource.filters = filters;
          otherCategoryVif.series[0].label = I18n.translate(
            'visualizations.common.other_category'
          );

          return otherCategoryVif;
        }
      );

      const dimensionValueOtherCategoryDataRequests =
        state.dimensionValueOtherCategoryVifs.map((dimensionValueOtherCategoryVif) => {
          return makeSoqlDataRequest(dimensionValueOtherCategoryVif, 0, maxRowCount);
        });

      return new Promise((resolve, reject) => {

        Promise.all(dimensionValueOtherCategoryDataRequests).
          then((dimensionValueOtherCategoryDataResponses) => {

            state.dimensionValueOtherCategoryData =
              state.dimensionValues.map((dimensionValue, i) => {

                return {
                  dimensionValue: dimensionValue,
                  data: dimensionValueOtherCategoryDataResponses[i]
                };
              });

            resolve(state);
          }).
          catch(reject);
      });
    }
  }

  function mapGroupedDataResponsesToMultiSeriesTable(state) {
    const dimensionIndex = 0;
    const measureIndex = 1;
    const sortFromVifOrDefault = _.get(
      state.vif,
      'series[0].dataSource.orderBy.sort',
      'asc'
    ).toLowerCase();
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

    const dataToRenderColumns = ['dimension'].concat(state.groupingValues);

    if (state.groupingRequiresOtherCategory) {

      const otherCategoryName = I18n.translate(
        'visualizations.common.other_category'
      );

      dataToRenderColumns.push(otherCategoryName);
    }

    const dataToRenderRows = uniqueDimensionValues.map((uniqueDimensionValue) => {
      const row = [uniqueDimensionValue];

      state.groupingData.forEach((groupingData) => {
        const groupingRowForDimension = _.find(
          groupingData.data.rows,
          (groupingRow) => groupingRow[dimensionIndex] === uniqueDimensionValue
        );
        const measureValue = (groupingRowForDimension) ?
          groupingRowForDimension[measureIndex] :
          null;

        row.push(measureValue);
      });

      return row;
    });

    if (state.groupingRequiresOtherCategory) {

      dataToRenderRows.forEach((dataToRenderRow) => {
        const dimensionValue = dataToRenderRow[dimensionIndex];
        const otherCategoryForDimension = _.find(
          state.dimensionValueOtherCategoryData,
          (otherCategoryRow) => (
            otherCategoryRow.dimensionValue === dimensionValue
          )
        );
        const measureValue = _.get(
          otherCategoryForDimension,
          `data.rows[0][${measureIndex}]`,
          null
        );

        dataToRenderRow.push(measureValue);
      });
    }

    state.dataToRender = {
      columns: dataToRenderColumns,
      rows: dataToRenderRows
    };

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
    then(makeDimensionValueOtherCategoryRequests).
    then(mapGroupedDataResponsesToMultiSeriesTable).
    then((state) => {
      return Promise.resolve(state.dataToRender);
    });
}

module.exports = {
  MAX_GROUP_COUNT: MAX_GROUP_COUNT,
  getData: getData
};

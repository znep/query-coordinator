// Vendor Imports
const _ = require('lodash');
// Project Imports
const I18n = require('../I18n');
const makeSocrataCategoricalDataRequest = require('./makeSocrataCategoricalDataRequest');

function getData(vif, options) {
  const dataRequests = vif.series.map((series, seriesIndex) => {
    const type = _.get(series, 'dataSource.type');

    switch (type) {

      case 'socrata.soql':
        return makeSocrataCategoricalDataRequest(
          vif,
          seriesIndex,
          options.MAX_ROW_COUNT
        );

      default:
        return Promise.reject(
          `Invalid/unsupported series dataSource.type: "${type}".`
        );
    }
  });

  function mapUngroupedDataResponsesToMultiSeriesTable(dataResponses) {
    const dimensionIndex = 0;
    const measureIndex = 1;
    const measureLabels = vif.series.map((series) => {
      return _.get(series, 'label', '');
    });
    const uniqueDimensionValues = _.uniq(
      _.flatMap(
        dataResponses.map((dataResponse) => {
          return dataResponse.rows.map((row) => row[dimensionIndex]);
        })
      )
    );
    const dataToRenderColumns = ['dimension'].concat(measureLabels);
    const dataToRenderRows = uniqueDimensionValues.map(
      (uniqueDimensionValue) => {
        const row = [uniqueDimensionValue];

        dataResponses.forEach((dataResponse) => {
          const rowForDimension = _.find(
            dataResponse.rows,
            (dataResponseRow) => {
              return dataResponseRow[dimensionIndex] === uniqueDimensionValue;
            }
          );
          const measureValue = (rowForDimension) ?
            rowForDimension[measureIndex] :
            null;

          row.push(measureValue);
        });

        return row;
      }
    );

    return {
      columns: dataToRenderColumns,
      rows: dataToRenderRows
    };
  }

  // It appears necessary to do a sort before we return the data table because
  // we may have been combining rows from multiple independent query responses,
  // and some dimension values may not be present in all responses if they had
  // no corresponding measure values.
  function applyOrderBy(dataTable) {
    const dimensionIndex = 0;
    const measureIndex = 1;
    const otherCategoryName = I18n.translate(
      'visualizations.common.other_category'
    );
    const orderByParameter = _.get(
      vif,
      'series[0].dataSource.orderBy.parameter',
      'measure'
    ).toLowerCase();
    const orderBySort = _.get(
      vif,
      'series[0].dataSource.orderBy.sort',
      'desc'
    ).toLowerCase();
    const orderingByDimension = (orderByParameter === 'dimension');
    const sortValueIndex = (orderingByDimension) ?
      dimensionIndex :
      measureIndex;
    const makeComparator = (direction) => {
      const compareValues = (direction === 'asc') ?
        (valueA, valueB) => { return valueA >= valueB; } :
        (valueA, valueB) => { return valueA <= valueB; };

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

          if (a[sortValueIndex] === null) {
            return -1;
          } else if (b[sortValueIndex] === null) {
            return 1;
          } else {
            return (compareValues(a[sortValueIndex], b[sortValueIndex])) ?
              1 :
              -1;
          }
        }
      };
    };

    dataTable.rows.sort(makeComparator(orderBySort));

    return dataTable;
  }

  return new Promise((resolve, reject) => {

    Promise.
      all(dataRequests).
      then(mapUngroupedDataResponsesToMultiSeriesTable).
      then(applyOrderBy).
      then(resolve).
      catch(reject);
  });
}

module.exports = {
  getData
};

// Vendor Imports
const _ = require('lodash');
// Project Imports
const I18n = require('../I18n');
const makeSoqlDataRequest = require('./makeSoqlDataRequest');

function getData(vif, maxRowCount) {
  const dataRequests = vif.series.map((series, seriesIndex) => {
    const type = _.get(series, 'dataSource.type');

    switch (type) {

      case 'socrata.soql':
        return makeSoqlDataRequest(vif, seriesIndex, maxRowCount);

      default:
        return Promise.reject(
          `Invalid/unsupported series dataSource.type: "${type}".`
        );
    }
  });

  function mapUngroupedDataResponsesToMultiSeriesTable(dataResponses) {
    const dimensionIndex = 0;
    const measureIndex = 1;
    const sortFromVifOrDefault = _.get(
      vif,
      'series[0].dataSource.orderBy.sort',
      'asc'
    ).toLowerCase();
    const ascendingComparator = (a, b) => (a >= b) ? 1 : -1;
    const descendingComparator = (a, b) => (a <= b) ? 1 : -1;
    const comparator = (sortFromVifOrDefault === 'asc') ?
      ascendingComparator :
      descendingComparator;
    const measureLabels = vif.series.map((series, i) => {
      const seriesLabel = _.get(series, 'label', '');

      return (_.isEmpty(seriesLabel)) ?
        (I18n.translate('visualizations.common.unlabeled_measure_prefix') + i) :
        seriesLabel;
    });
    const uniqueDimensionValues = _.uniq(
      _.flatMap(
        dataResponses.map((dataResponse) => {
          return dataResponse.rows.map((row) => row[dimensionIndex]);
        })
      )
    ).sort(comparator);

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

  return new Promise((resolve, reject) => {

    Promise.
      all(dataRequests).
      then(mapUngroupedDataResponsesToMultiSeriesTable).
      then((dataToRender) => {
        resolve(dataToRender);
      }).
      catch(reject);
  });
}

module.exports = {
  getData: getData
};

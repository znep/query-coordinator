// Vendor Imports
const _ = require('lodash');
// Project Imports
const I18n = require('common/i18n').default;
const makeSocrataTimeDataRequest = require('./makeSocrataTimeDataRequest');
// Constants
const VALID_SORTS = ['asc', 'desc'];
const DEFAULT_SORT = 'asc';

function getData(vif, options) {
  const dataRequests = vif.series.map((series, seriesIndex) => {
    const type = _.get(series, 'dataSource.type');

    switch (type) {

      case 'socrata.soql':
        return options.getPrecisionBySeriesIndex(vif, seriesIndex).
          then((precision) => {
            const dateTruncFunction = options.mapPrecisionToDateTruncFunction(
              precision
            );
            const dataRequestOptions = {
              dateTruncFunction: dateTruncFunction,
              precision: precision,
              maxRowCount: options.MAX_ROW_COUNT
            };

            // Note that we cache this within the scope of getUngroupedData so
            // that we can have access to each series' precision later on down
            // the promise chain.
            precisions.push(precision);

            return makeSocrataTimeDataRequest(
              vif,
              seriesIndex,
              dataRequestOptions
            );
          });

      default:
        return Promise.reject(
          `Invalid/unsupported series dataSource.type: "${type}".`
        );
    }
  });

  // We accumulate each series' precision so that we can pass the finest-
  // grained one along to the visualization renderer, which uses a precision
  // to determine how to draw the dimension scale.
  let precisions = [];

  function mapUngroupedDataResponsesToMultiSeriesTable(dataResponses) {
    const dimensionIndex = 0;
    const measureIndex = 1;
    const sortFromVif = _.toLower(
      _.get(vif, 'series[0].dataSource.orderBy.sort')
    );
    const sortFromVifOrDefault = (_.includes(VALID_SORTS, sortFromVif)) ?
      sortFromVif :
      DEFAULT_SORT;
    const ascendingComparator = (a, b) => (a >= b) ? 1 : -1;
    const descendingComparator = (a, b) => (a <= b) ? 1 : -1;
    const comparator = (sortFromVifOrDefault === 'asc') ?
      ascendingComparator :
      descendingComparator;
    const measureLabels = vif.series.map((series, i) => {
      const seriesLabel = _.get(series, 'label', '');

      return (_.isEmpty(seriesLabel)) ?
        (I18n.t('shared.visualizations.charts.common.unlabeled_measure_prefix') + i) :
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

    let finestGrainedPrecision = 'year';

    if (precisions.indexOf('day') >= 0) {
      finestGrainedPrecision = 'day';
    } else if (precisions.indexOf('month') >= 0) {
      finestGrainedPrecision = 'month';
    }

    return {
      columns: dataToRenderColumns,
      rows: dataToRenderRows,
      precision: finestGrainedPrecision
    };
  }

  return Promise.
    all(dataRequests).
    then(mapUngroupedDataResponsesToMultiSeriesTable);
}

module.exports = {
  getData
};

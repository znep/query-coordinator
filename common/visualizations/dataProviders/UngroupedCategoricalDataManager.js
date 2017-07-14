// Vendor Imports
const _ = require('lodash');
// Project Imports
const I18n = require('common/i18n').default;
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
      return _.get(series, 'dataSource.measure.label', '');
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

    // Determine whether all values for ordering are numeric.
    // See note on compare function at bottom.
    const doSortNumeric = _(dataTable.rows).
      map((row) => row[sortValueIndex]).
      compact().
      every((val) => !_.isNaN(_.toNumber(val)));

    const compareValues = makeValueComparator(orderBySort, doSortNumeric);
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
      // If we are ordering by the measure, the order should always respect the
      // measure's value, subsorted for equal values with the Other category
      // and the null category sorted to the end of an equivalency group.
      const categoryA = a[0];
      const categoryB = b[0];
      const valueA = a[sortValueIndex];
      const valueB = b[sortValueIndex];

      if (orderingByDimension) {
        return compareCategoriesToNullAndOther(categoryA, categoryB) ||
          compareValues(categoryA, categoryB);
      } else {
        return compareValues(valueA, valueB) ||
          compareCategoriesToNullAndOther(categoryA, categoryB) ||
          compareValues(categoryA, categoryB);
      }
    };

    dataTable.rows.sort(comparator);

    return dataTable;
  }

  return Promise.
    all(dataRequests).
    then(mapUngroupedDataResponsesToMultiSeriesTable).
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
function makeValueComparator(direction, numeric) {
  const _compare = (direction === 'asc') ? _.gt : _.lt;
  const _transform = numeric ? _.toNumber : _.identity;

  return (a, b) =>  {
    if (a === b) {
      return 0;
    } else {
      return _compare(_transform(a), _transform(b)) ? 1 : -1;
    }
  };
}

module.exports = {
  getData
};

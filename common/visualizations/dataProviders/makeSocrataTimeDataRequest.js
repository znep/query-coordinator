// Vendor Imports
const _ = require('lodash');
const moment = require('moment');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
// Constants
const MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';

function makeSocrataTimeDataRequest(vif, seriesIndex, options) {
  const series = vif.series[seriesIndex];
  const soqlDataProvider = new SoqlDataProvider({
    datasetUid: _.get(series, 'dataSource.datasetUid'),
    domain: _.get(series, 'dataSource.domain')
  });
  const dimension = SoqlHelpers.dimension(vif, seriesIndex);
  const measure = SoqlHelpers.measure(vif, seriesIndex);
  const whereClauseComponents = SoqlHelpers.whereClauseFilteringOwnColumn(
    vif,
    seriesIndex
  );
  const dateGuardClauseComponent = [
    `${dimension} IS NOT NULL AND`,
    `${dimension} < '${MAX_LEGAL_JAVASCRIPT_DATE_STRING}' AND`,
    '(1=1)'
  ].join(' ');
  const whereClause = (whereClauseComponents.length > 0) ?
    `WHERE ${whereClauseComponents} AND ${dateGuardClauseComponent}` :
    `WHERE ${dateGuardClauseComponent}`;
  const groupByClause = SoqlHelpers.aggregationClause(
    vif,
    seriesIndex,
    'dimension'
  );
  const limit = options.maxRowCount + 1;
  const isUnaggregatedQuery = (
    _.isNull(series.dataSource.dimension.aggregationFunction) &&
    _.isNull(series.dataSource.measure.aggregationFunction)
  );

  let queryString;

  const requireGroupingInSelect = vif.requireGroupingInSelect;

  // If there is no aggregation, we do not select the dimension with a
  // `date_trunc` function, but rather just ask for the actual values.
  if (isUnaggregatedQuery) {
    queryString = [
      'SELECT',
      `${dimension} AS ${SoqlHelpers.dimensionAlias()},`,
      `${measure} AS ${SoqlHelpers.measureAlias()}`,
      whereClause,
      `LIMIT ${limit}`
    ].join(' ');
  } else if (requireGroupingInSelect) {
    queryString = [
      'SELECT',
      `${options.dateTruncFunction}(${dimension}) AS ${SoqlHelpers.dimensionAlias()},`,
      `${vif.groupingColumnName} AS ${SoqlHelpers.groupingAlias()},`,
      `${measure} AS ${SoqlHelpers.measureAlias()}`,
      whereClause,
      `GROUP BY ${options.dateTruncFunction}(${groupByClause}), ${SoqlHelpers.groupingAlias()}`,
      `LIMIT ${limit}`
    ].join(' ');
  } else {
    queryString = [
      'SELECT',
      `${options.dateTruncFunction}(${dimension}) AS ${SoqlHelpers.dimensionAlias()},`,
      `${measure} AS ${SoqlHelpers.measureAlias()}`,
      whereClause,
      `GROUP BY ${options.dateTruncFunction}(${groupByClause})`,
      `LIMIT ${limit}`
    ].join(' ');
  }

  return soqlDataProvider.query(
    queryString,
    SoqlHelpers.dimensionAlias(),
    SoqlHelpers.measureAlias(),
    null,
    null,
    (requireGroupingInSelect ? SoqlHelpers.groupingAlias() : null)
  ).
    then((queryResponse) => {
      const dimensionIndex = queryResponse.columns.indexOf(
        SoqlHelpers.dimensionAlias()
      );
      const groupingIndex = queryResponse.columns.indexOf(
        SoqlHelpers.groupingAlias()
      );
      const measureIndex = queryResponse.columns.indexOf(
        SoqlHelpers.measureAlias()
      );
      const typeComponents = _.get(vif, `series[${seriesIndex}].type`, '').
        split('.');
      const typeVariant = _.defaultTo(typeComponents[1], 'area');
      const treatNullValuesAsZero = _.get(
        vif,
        'configuration.treatNullValuesAsZero',
        false
      );

      queryResponse.columns[dimensionIndex] = 'dimension';
      queryResponse.columns[measureIndex] = 'measure';
      if (groupingIndex !== -1) {
        queryResponse.columns[groupingIndex] = 'grouping';
      }

      // The dimension comes back as an ISO-8601 date, which means we can sort
      // dimension values lexically. This sort puts the dates in ascending
      // order, and the following forEach will cast numbers-as-strings to
      // numbers and undefined measure values as null.
      queryResponse.rows.
        sort((a, b) => (a[dimensionIndex] <= b[dimensionIndex]) ? -1 : 1).
        // Note that because we are using a forEach and then assigning to the
        // argument provided by the forEach, we cannot use e.g. _.sortBy since
        // the collection it returns will be a clone of the original, not a
        // reference to it, and as such the reassignment-in-place will be done
        // on something that gets thrown away.
        forEach((row) => {
          const value = row[measureIndex];

          if (_.isUndefined(value)) {
            row[measureIndex] = (treatNullValuesAsZero) ? 0 : null;
          } else {
            row[measureIndex] = Number(value);
          }
        });

      let rows;

      if (typeVariant === 'area') {
        // If there are no values in a specific interval (according to the
        // date_trunc_* function) then we will not get a response row for that
        // interval.
        //
        // This complicates our ability to render gaps in the timeline for these
        // intervals, since d3 will just interpolate over them.
        //
        // The solution is to explicitly provide null values for intervals with
        // no values, which means that we need to expand the result rows into an
        // equivalent set in which the domain is monotonically increasing.
        //
        // This is only necessary for (or relevant to) area charts, however,
        // since the normal interpolation behavior is actually what we want for
        // the 'line' variant (a simple line chart, not an area chart).
        rows = forceDimensionMonotonicity(
          vif,
          seriesIndex,
          options.precision,
          queryResponse
        );
      } else {
        rows = addBlankRowAfterLastRow(
          vif,
          dimensionIndex,
          queryResponse.rows
        );
      }

      return {
        columns: queryResponse.columns,
        rows,
        precision: options.precision
      };

    });
}

function incrementDateByPrecision(startDate, precision) {

  function incrementDateByYear() {
    const year = (parseInt(startDate.substring(0, 4), 10) + 1);
    const restOfDatetime = startDate.substring(4, 23);

    return `${year}${restOfDatetime}`;
  }

  function incrementDateByMonth() {
    const restOfDatetime = startDate.substring(7, 23);

    let year = parseInt(startDate.substring(0, 4), 10);
    let month = parseInt(startDate.substring(5, 7), 10) + 1;

    if (month === 13) {
      month = 1;
      year++;
    }

    month = _.padStart(month.toString(), 2, '0');

    return `${year}-${month}${restOfDatetime}`;
  }

  function incrementDateByDay() {

    return new Date(
      // Note that we need to append 'Z' to the date string here in order for
      // Firefox and IE to not apply a timezone offset based on the user's
      // timezone. In other words, if you instantiate a date object from a
      // floating timestamp in ISO-8601 format (e.g.
      // "2015-07-08T00:00:00.000"), Firefox and IE will return a UTC date
      // that has been shifted by your current timezone (in GMT-0700 it gets
      // changed to "2015-07-08T07:00:00.000Z"), whereas Chrome will just
      // display the original date in your current timezone while not changing
      // the date in terms of UTC.
      //
      // This adjustment does not happen if you pass a date string that is
      // explicitly in UTC, hence the 'Z' getting appended to startDate below.
      new Date(startDate + 'Z').getTime() +
      (24 * 60 * 60 * 1000)
    ).
      toISOString().
      substring(0, 23);
  }

  switch (precision) {

    case 'year': return incrementDateByYear();
    case 'month': return incrementDateByMonth();
    case 'day': return incrementDateByDay();

    default:
      throw new Error(
        `Cannot increment date by invalid precision "${precision}".`
      );
  }
}

// This is necessary to get area variant series to correctly show
// discontinuities in the data; otherwise intervals with no value (which are not
// returned by the SoQL API and must be inferred) will not be rendered, but
// rather interpolated over, which misrepresents the data.
//
// XXX: This tightly-coupled code needed a workaround to handle grouped results
// correctly. Tough cookies. The idea is: grouped results just need a single
// entry, with no specified group, for each "monotonic" time interval. However,
// they typically come in with more than one existing entry for each time
// interval already present. The existing algorithm here can only handle single
// dimension values, and cannot easily be forced to operate in other ways.
function forceDimensionMonotonicity(vif, seriesIndex, precision, dataTable) {
  let rows;
  if (vif.requireGroupingInSelect) {
    rows = _.uniqBy(dataTable.rows, (row) => row[0]);
  } else {
    rows = dataTable.rows;
  }

  if (rows.length === 0) {
    return rows;
  }

  const dimensionIndex = dataTable.columns.indexOf('dimension');
  const startDate = rows[0][dimensionIndex];
  const endDate = rows[rows.length - 1][dimensionIndex];
  const endDateMoment = moment(endDate, moment.ISO_8601);
  const startDateMoment = moment(startDate, moment.ISO_8601);
  const treatNullValuesAsZero = _.get(
    vif,
    'configuration.treatNullValuesAsZero',
    false
  );
  const monotonicRows = [
    [
      startDate,
      (treatNullValuesAsZero) ? 0 : null
    ]
  ];

  let monotonicRowCount;
  let i = 1;
  let lastRowStartDate;
  let nextRowStartDate;
  let lastRowVisited = 0;
  let duration;

  switch (precision) {
    case 'year':
      // Just do full year subtraction here.  If our timespan included a leap year,
      // moment's duration.asYears() returned a fractional year (i.e. 5.002), which
      // we were ceil-ing and getting an extra year in our monotonicRowCount.
      //
      const years = endDateMoment.toDate().getFullYear() - startDateMoment.toDate().getFullYear();
      monotonicRowCount = years + 1;
      break;

    case 'month':
      duration = moment.duration(endDateMoment.diff(startDateMoment));
      monotonicRowCount = Math.ceil(duration.asMonths()) + 1;
      break;

    case 'day':
      duration = moment.duration(endDateMoment.diff(startDateMoment));
      monotonicRowCount = Math.ceil(duration.asDays() + 1);
      break;

    default:
      throw new Error(
        'Invalid precision: "{0}"'.format(precision)
      );
  }

  while (i < monotonicRowCount) {
    lastRowStartDate = monotonicRows[i - 1][0];
    nextRowStartDate = incrementDateByPrecision(lastRowStartDate, precision);

    monotonicRows.push(
      [
        nextRowStartDate,
        (treatNullValuesAsZero) ? 0 : null
      ]
    );

    i++;
  }

  rows.forEach((row) => {

    for (let j = lastRowVisited; j < monotonicRows.length; j++) {

      if (monotonicRows[j][0] === row[0]) {
        monotonicRows[j][1] = row[1];
        lastRowVisited = 1;
        break;
      }
    }
  });

  // If we are treating null values as zero and the last datum also happens to
  // be zero, d3 will not draw enough space on the right side of the chart for
  // the user to be able to highlight the last datum. In this case, we need to
  // force the last value to actually be null in order for the last non-null,
  // non-zero value to be highlightable.
  if (
    treatNullValuesAsZero &&
    monotonicRows[monotonicRows.length - 1][1] === 0
  ) {

    monotonicRows[monotonicRows.length - 1][1] = null;
  }

  if (vif.requireGroupingInSelect) {
    // Now, we take the monotonic rows, transform them into 3-column results to
    // include grouping, remove entries we already have in the original, and
    // append /that/ to the original rows result. Also, yay linear search. This
    // assumes layout and ignores different column indices. Then again, so does
    // the rest of "forceDimensionMonotonicity".
    const arbitraryGroupingRow = _.find(
      dataTable.rows,
      (row) => !_.isNull(row[1]) && !_.isUndefined(row[1])
    );
    const arbitraryGrouping = arbitraryGroupingRow ? arbitraryGroupingRow[1] : "";
    const monotonicRowsWithGrouping = monotonicRows.map((row) => {
      const [dimension, measure] = row;
      return [dimension, arbitraryGrouping, measure];
    });
    const monotonicRowsNotPresentInOriginal = _.filter(
      monotonicRowsWithGrouping,
      (row) => {
        return !_.some(dataTable.rows, (originalRow) => {
          return originalRow[0] === row[0];
        });
      }
    );
    return dataTable.rows.concat(monotonicRowsNotPresentInOriginal);
  } else {
    return monotonicRows;
  }
}

// This is necessary to get line variant series to render the last point in the
// series with enough space on its right to be a target for the highlight and
// flyout. It should only be used for line variant series.
function addBlankRowAfterLastRow(vif, dimensionIndex, rows) {
  const secondToLastRowDatetime = new Date(
    rows[rows.length - 2][dimensionIndex]
  );
  const lastRowDatetime = new Date(rows[rows.length - 1][dimensionIndex]);
  const lastRowIntervalInMilliseconds = (
    lastRowDatetime.getTime() - secondToLastRowDatetime.getTime()
  );
  const treatNullValuesAsZero = _.get(
    vif,
    'configuration.treatNullValuesAsZero',
    false
  );
  const blankRow = [null, null];
  const dimensionValue = new Date(
    lastRowDatetime.getTime() +
    lastRowIntervalInMilliseconds
  ).
    toISOString().
    substring(0, 23);
  const measureValue = (treatNullValuesAsZero) ? 0 : null;

  if (dimensionIndex === 0) {
    blankRow[0] = dimensionValue;
    blankRow[1] = measureValue;
  } else {
    blankRow[0] = measureValue;
    blankRow[1] = dimensionValue;
  }

  return rows.concat(
    [
      blankRow
    ]
  );
}

module.exports = makeSocrataTimeDataRequest;

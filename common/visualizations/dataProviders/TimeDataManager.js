// Vendor Imports
const _ = require('lodash');
const moment = require('moment');
// Project Imports
const SoqlDataProvider = require('./SoqlDataProvider');
const SoqlHelpers = require('./SoqlHelpers');
const GroupedTimeDataManager = require('./GroupedTimeDataManager');
const UngroupedTimeDataManager = require('./UngroupedTimeDataManager');
// Constants
const MAX_ROW_COUNT = 1000;
const MAX_GROUP_COUNT = GroupedTimeDataManager.MAX_GROUP_COUNT;
const VALID_PRECISION_VALUES = ['year', 'month', 'day'];
const MAX_LEGAL_JAVASCRIPT_DATE_STRING = '9999-01-01';

/**
 * Public Functions
 */

function getData(vif) {
  const isGrouping = !_.isNull(
    _.get(
      vif,
      'series[0].dataSource.dimension.grouping.columnName',
      null
    )
  );
  const options = {
    MAX_ROW_COUNT,
    getPrecisionBySeriesIndex,
    mapPrecisionToDateTruncFunction
  };

  if (isGrouping) {
    return GroupedTimeDataManager.getData(vif, options);
  } else {
    return UngroupedTimeDataManager.getData(vif, options);
  }
}

function getPrecisionBySeriesIndex(vif, seriesIndex) {
  const precisionFromVif = _.toLower(
    _.get(vif, `series[${seriesIndex}].dataSource.precision`)
  );

  if (_.includes(VALID_PRECISION_VALUES, precisionFromVif)) {
    return Promise.resolve(precisionFromVif);
  } else {
    const soqlDataProvider = new SoqlDataProvider({
      datasetUid: _.get(
        vif,
        `series[${seriesIndex}].dataSource.datasetUid`,
        null
      ),
      domain: _.get(
        vif,
        `series[${seriesIndex}].dataSource.domain`,
        null
      )
    });
    const dimension = SoqlHelpers.dimension(vif, seriesIndex);
    const queryString = `
      SELECT
        min(${dimension}) AS ${SoqlHelpers.dimensionAlias()},
        max(${dimension}) AS ${SoqlHelpers.measureAlias()}
      WHERE ${dimension} < \'${MAX_LEGAL_JAVASCRIPT_DATE_STRING}\'`;
    const uriEncodedQueryString = encodeURIComponent(
      queryString.replace(/[\n\s]+/g, ' ').trim()
    );

    return soqlDataProvider.getRows(
      [
        SoqlHelpers.dimensionAlias(),
        SoqlHelpers.measureAlias()
      ],
      `$query=${uriEncodedQueryString}`
    ).
      then((response) => {
        const { columns, rows } = response;
        const startDateIndex = _.indexOf(
          columns,
          SoqlHelpers.dimensionAlias()
        );
        const endDateIndex = _.indexOf(
          columns,
          SoqlHelpers.measureAlias()
        );

        let domainStartDate = moment(
          rows[0][startDateIndex],
          moment.ISO_8601
        );
        let domainEndDate = moment(
          rows[0][endDateIndex],
          moment.ISO_8601
        );

        // Reject the response if the domain is somehow invalid, since that
        // means that we won't be able to render this series in any case.
        if (!domainStartDate.isValid() || !domainEndDate.isValid()) {

          throw new Error(
            'Timeline domain is invalid: ' +
            `[${domainStartDate}, ${domainEndDate}]`
          );
        }

        const is1YearLater = domainStartDate.add(1, 'years').
          isAfter(domainEndDate);
        const is19YearsLater = domainStartDate.add(19, 'years').
          isAfter(domainEndDate);

        // Otherwise, return the precision as a string. Moment objects are
        // inherently mutable. Therefore, the .add() call in the first condition
        // will need to be accounted for in the second condition. We're doing
        // this instead of just cloning the objects because moment.clone() is
        // surprisingly slow (something like 40ms).
        let precision;

        if (is1YearLater) {
          precision = 'day';
        // We're actually checking for 20 years but have already added one to
        // the original domain start date in the if block above.
        } else if (is19YearsLater) {
          precision = 'month';
        } else {
          precision = 'year';
        }

        return precision;
      });
  }
}

function mapPrecisionToDateTruncFunction(precision) {

  switch (precision) {

    case 'year': return 'date_trunc_y';
    case 'month': return 'date_trunc_ym';
    case 'day': return 'date_trunc_ymd';

    default:
      throw new Error(
        `Encountered invalid precision "${precision}" ` +
        'when mapping to date_trunc function.'
      );
  }
}

module.exports = {
  MAX_ROW_COUNT,
  MAX_GROUP_COUNT,
  getData,
  getPrecisionBySeriesIndex
};

// Calculates measures via direct SoQL calls.
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { SoqlDataProvider, SoqlHelpers } from 'common/visualizations/dataProviders';
import ReportingPeriods from '../lib/reportingPeriods';
import { CalculationTypeNames } from '../lib/constants';
import { assert, assertIsOneOfTypes } from 'common/js_utils';
import { UID_REGEX } from 'common/http/constants';

// Returns true if the given column can be used
// with the given measure, false otherwise.
export const isColumnUsableWithMeasureArgument = (column, measure, argument) => {
  if (!column) { return false; }

  const type = _.get(measure, 'metricConfig.type');
  const renderTypeName = _.get(column, 'renderTypeName');
  const columnIsNumeric = renderTypeName === 'number' || renderTypeName === 'money';

  if (argument === 'dateColumn') {
    return renderTypeName === 'calendar_date';
  }

  if (type === CalculationTypeNames.RECENT) {
    // Special enough to be clearer as a separate path.
    return argument === 'valueColumn' && columnIsNumeric;
  } else {
    // All other types
    const aggregationType = _.get(measure, 'metricConfig.arguments.aggregationType');
    const needsNumericColumn =
      (type === 'rate' && aggregationType === 'sum') ||
      (type === 'sum');

    return columnIsNumeric || !needsNumericColumn;
  }
};

const setupSoqlDataProvider = (measure) => {
  const datasetUid = _.get(measure, 'dataSourceLensUid');
  const domain = _.get(measure, 'domain', window.location.hostname);
  if (!datasetUid) {
    return null;
  }

  const dataProviderConfig = { domain, datasetUid };

  return new SoqlDataProvider(dataProviderConfig);
};

/* Helper functions. Should use BigNumbers where possible. */

const columnConditionWhereClause = (fieldName, columnCondition) => {
  if (columnCondition && fieldName) {
    return SoqlHelpers.filterToWhereClauseComponent({
      columnName: fieldName,
      ...columnCondition
    });
  }
  return null;
};

const joinWhereClauses = (whereClauses) => _(whereClauses).compact().join(' AND ');

// Returns: BigNumber.
const count = async (dataProvider, fieldName, whereClauses) => {
  assert(whereClauses.length > 0, 'At least one where clause must be supplied.');

  const countAlias = '__measure_count_alias__';
  const query = `select count(${fieldName}) as ${countAlias} where ${joinWhereClauses(whereClauses)}`;
  const data = await dataProvider.rawQuery(query);
  return new BigNumber(data[0][countAlias]);
};

// Returns: BigNumber (when rows are present) or null (when no rows are present).
const sum = async (dataProvider, fieldName, whereClauses) => {
  assert(whereClauses.length > 0, 'At least one where clause must be supplied.');

  const sumAlias = '__measure_sum_alias__';

  const query = `select sum(${fieldName}) as ${sumAlias} where ${joinWhereClauses(whereClauses)}`;

  const data = await dataProvider.rawQuery(query);
  if (_.has(data, [0, sumAlias])) {
    return new BigNumber(data[0][sumAlias]);
  } else {
    return null;
  }
};

const excludeNullsFilter = (fieldName) => ({
  columnName: fieldName,
  'function': 'isNull',
  arguments: { isNull: false }
});

/* Measure types
 */

export const calculateCountMeasure = async (
  errors,
  measure,
  dateRangeWhereClause,
  dataProvider = setupSoqlDataProvider(measure) // For test injection
) => {
  const dateColumn = _.get(measure, 'metricConfig.dateColumn');
  const column = _.get(measure, 'metricConfig.arguments.column');

  let value = null;

  if (column && dataProvider && dateRangeWhereClause) {
    const columnCondition = _.get(measure, 'metricConfig.arguments.includeNullValues') ?
      null : excludeNullsFilter(column);

    value = (await count(
      dataProvider,
      column,
      [columnConditionWhereClause(column, columnCondition), dateRangeWhereClause]
    )).toFixed(0); // No sense having decimals for counts.
  } else {
    errors.calculationNotConfigured = !column || !dateColumn;
  }

  return { errors, result: { value } };
};

export const calculateSumMeasure = async (
  errors,
  measure,
  dateRangeWhereClause,
  dataProvider = setupSoqlDataProvider(measure) // For test injection
) => {
  const column = _.get(measure, 'metricConfig.arguments.column');
  const dateColumn = _.get(measure, 'metricConfig.dateColumn');
  const decimalPlaces = _.get(measure, 'metricConfig.display.decimalPlaces');

  let value = null;

  if (column && dataProvider && dateRangeWhereClause) {
    const sumResult = await sum(dataProvider, column, [dateRangeWhereClause]);

    // sum() will return null if there are no values to sum
    value = _.isNil(sumResult) ? sumResult : sumResult.toFixed(decimalPlaces);
    if (value === null) {
      errors.notEnoughData = true;
    }
  } else {
    errors.calculationNotConfigured = !column || !dateColumn;
  }

  return { errors, result: { value } };
};

export const calculateRecentValueMeasure = async (errors, measure, endDate) => {
  const dataProvider = setupSoqlDataProvider(measure);
  const valueColumn = _.get(measure, 'metricConfig.arguments.valueColumn');
  const dateColumn = _.get(measure, 'metricConfig.dateColumn');
  const decimalPlaces = _.get(measure, 'metricConfig.display.decimalPlaces');

  let value = null;

  if (endDate && valueColumn && dateColumn && dataProvider) {
    const endDateSoql = SoqlHelpers.soqlEncodeValue(endDate.toDate());
    const dateColumnEncoded = SoqlHelpers.soqlEncodeColumnName(dateColumn);

    const where = `${dateColumnEncoded} < ${endDateSoql} AND ${valueColumn} is not null`;
    const data = await dataProvider.rawQuery(
      `select ${valueColumn} where ${where} order by ${dateColumn} DESC limit 1`
    );

    value = _.get(data, [0, valueColumn], null);

    if (_.isNil(value)) {
      // There are no rows with non-null values for the selected date column
      errors.noRecentValue = true;
    } else {
      value = new BigNumber(value).toFixed(decimalPlaces);
    }
  } else {
    errors.calculationNotConfigured = !valueColumn || !dateColumn;
  }

  return { errors, result: { value } };
};

export const calculateRateMeasure = async (
  errors,
  measure,
  dateRangeWhereClause,
  dataProvider = setupSoqlDataProvider(measure) // For test injection
) => {
  const {
    aggregationType,
    numeratorColumn,
    numeratorColumnCondition,
    denominatorColumn,
    fixedDenominator
  } = _.get(measure, 'metricConfig.arguments', {});

  const denominatorIncludeNullValues = _.get(
    measure,
    'metricConfig.arguments.denominatorIncludeNullValues',
    true
  );

  if (aggregationType && aggregationType !== CalculationTypeNames.COUNT) {
    assert(
      denominatorIncludeNullValues,
      'Excluding null values from non-count Rate measure numerator is nonsensical'
    );
  }

  const dateColumn = _.get(measure, 'metricConfig.dateColumn');
  const decimalPlaces = _.get(measure, 'metricConfig.display.decimalPlaces');
  const asPercent = _.get(measure, 'metricConfig.display.asPercent');

  const numeratorOk = !!numeratorColumn;
  const denominatorOk = (denominatorColumn || !_.isEmpty(fixedDenominator));

  errors.calculationNotConfigured = !numeratorOk || !denominatorOk;

  if (aggregationType && (numeratorOk || denominatorOk) && dataProvider && dateRangeWhereClause) {
    const numeratorColumnConditionWhereClause =
      columnConditionWhereClause(numeratorColumn, numeratorColumnCondition);

    let numeratorPromise; // Note: This will get filters added soon.
    let denominatorPromise = _.isEmpty(fixedDenominator) ?
      null :
      Promise.resolve(fixedDenominator);

    // Come up with promises for numerator and denominator.
    // If either numerator or denominator have the possibility
    // of calculating, we should proceed. The app will provide
    // partial results in edit mode even if half of the fraction
    // is not fully-specified.
    switch (aggregationType) {
      case CalculationTypeNames.COUNT: {
        numeratorPromise = numeratorColumn ?
          count(
            dataProvider, numeratorColumn, [numeratorColumnConditionWhereClause, dateRangeWhereClause]
          ) : null;

        const denominatorColumnConditionWhereClause = denominatorIncludeNullValues ?
          null :
          columnConditionWhereClause(denominatorColumn, excludeNullsFilter(denominatorColumn));

        denominatorPromise = denominatorPromise ||
          (denominatorColumn ?
            count(
              dataProvider, denominatorColumn, [denominatorColumnConditionWhereClause, dateRangeWhereClause]
            ) : null);

        break;
      }
      case CalculationTypeNames.SUM:
        numeratorPromise = numeratorColumn ?
          sum(dataProvider, numeratorColumn, [numeratorColumnConditionWhereClause, dateRangeWhereClause]) :
          null;

        denominatorPromise = denominatorPromise ||
          (denominatorColumn ? sum(dataProvider, denominatorColumn, [dateRangeWhereClause]) : null);
        break;
      default:
        throw new Error(`Unknown aggregation type: ${aggregationType}`);
    }

    let numerator = await numeratorPromise;
    let denominator = await denominatorPromise;
    if (numerator) { numerator = new BigNumber(numerator); }
    if (denominator) { denominator = new BigNumber(denominator); }

    const calculation = {};
    if (numerator) { calculation.numerator = numerator.toString(); }
    if (denominator) {
      calculation.denominator = denominator.toString();
      errors.dividingByZero = denominator.isZero();
    }
    if (numerator && denominator) {
      if (errors.dividingByZero) {
        calculation.value = null;
      } else {
        calculation.value = numerator.dividedBy(denominator).
          times(asPercent ? '100' : '1').
          toFixed(decimalPlaces);
      }
    } else {
      errors.notEnoughData = true;
    }

    return { errors, result: { ...calculation } };
  } else {
    errors.calculationNotConfigured =
      !numeratorOk || !denominatorOk || !aggregationType || !dateColumn;

    // Special case: If the denominator is fixed, we can always at least return that.
    if (!_.isEmpty(fixedDenominator)) {
      errors.dividingByZero = new BigNumber(fixedDenominator).isZero();

      return {
        errors,
        result: {
          denominator: fixedDenominator.toString()
        }
      };
    }

    return { errors };
  }
};

export const calculateMeasure = async (measure, dateRange) => {
  assertIsOneOfTypes(measure, 'object');
  // Our error detection logic needs to be very robust and be able to provide sensible guidance to the user
  // in common cases. The easiest way we came up with is to have an errors hash that we poke error states
  // into as we go along.
  const errors = {};

  const calculationType = _.get(measure, 'metricConfig.type');
  const dateColumn = _.get(measure, 'metricConfig.dateColumn');
  const reportingPeriod = _.get(measure, 'metricConfig.reportingPeriod');
  // Did the user even specify a reporting period?
  errors.noReportingPeriodConfigured = !ReportingPeriods.isConfigValid(reportingPeriod);
  // ... and if they did, does it give us a valid date range for today's value?
  errors.noReportingPeriodAvailable = !dateRange;

  errors.dataSourceNotConfigured = !UID_REGEX.test(measure.dataSourceLensUid);

  // A blank dateRange can happen if:
  //   * The start date is in the future, or
  //   * The period type is "closed" and we haven't closed any reporting periods (i.e.,
  //     it's 1/1/2018, the period length is 1 year, and the first period started on 6/01/2017).
  const dateRangeWhereClause = (dateRange && dateColumn) ? dateRange.asSoQL(dateColumn) : null;

  switch (calculationType) {
    case CalculationTypeNames.COUNT:
      return calculateCountMeasure(errors, measure, dateRangeWhereClause);
    case CalculationTypeNames.SUM:
      return calculateSumMeasure(errors, measure, dateRangeWhereClause);
    case CalculationTypeNames.RECENT:
      return calculateRecentValueMeasure(
        errors,
        measure,
        dateRange ? dateRange.end : null,
        dateColumn
      );
    case CalculationTypeNames.RATE:
      return calculateRateMeasure(errors, measure, dateRangeWhereClause);
    case undefined:
      errors.calculationNotConfigured = true;
      return { errors };
    default:
      throw new Error(`Unknown calculation type: ${calculationType}`);
  }
};

// getMetricSeries and getMetricValue return one or more "measure computation result" objects. These objects
// are designed to not only communicate the computed value (if one is available), but also communicate the
// reason, if any, for a computed value being unavailable. Each object takes this form:
//
// {
//   result: String (usually from BigNumber#toFixed). The computed value. May not be present if an
//     exceptional condition is present.
//   numerator: string (Rate measures only)
//   denominator: string (Rate measures only)
//
//   dividingByZero: Boolean (Rate measures only). Indicates the denominator is zero.
//   dataSourceNotConfigured: Boolean. If set to true, indicates that the data source is not configured.
//   noRecentValue: Boolean (Recent Value measures only). If set to true, the selected reference date column
//     does not contain any non-null values.
//   noReportingPeriodAvailable: Boolean. If set to true, indicates that no reporting period is usable
//     (this can happen if the start date is in the future, or we're using closed reporting periods and
//     no period has closed yet).
//   noReportingPeriodConfigured: Boolean. If set to true, indicates that no reporting period was set
//     by the user.
//   calculationNotConfigured: Boolean. Indicates an insufficiently-specified calculation.
// }
export const getMetricSeries = async (measure) => {
  const reportingPeriod = _.get(measure, 'metricConfig.reportingPeriod');
  if (!ReportingPeriods.isConfigValid(reportingPeriod)) {
    return [];
  }

  const reportingPeriods = new ReportingPeriods(measure.metricConfig.reportingPeriod).seriesToDate();

  const measureResultsPerReportingPeriod = await Promise.all(
    reportingPeriods.map((dateRange) => {
      return calculateMeasure(measure, dateRange);
    })
  );

  return Promise.resolve(
    measureResultsPerReportingPeriod.map((measureResult, i) => {
      const startDate = reportingPeriods[i].start.format('YYYY-MM-DDTHH:mm:ss.SSS');
      const result = measureResult.result.value;
      const value = _.isNil(result) ? result : parseFloat(result);

      return [startDate, value];
    }),
  );
};

// For the number-only embed/metric preview card in the editor.
export const getMetricValue = async (measure) => {
  const reportingPeriod = _.get(measure, 'metricConfig.reportingPeriod');

  // Note - this may be undefined in either branch.
  const period = ReportingPeriods.isConfigValid(reportingPeriod) ?
    new ReportingPeriods(measure.metricConfig.reportingPeriod).forReportedMetricValue() :
    undefined;

  return await calculateMeasure(measure, period);
};

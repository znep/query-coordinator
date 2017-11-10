// Calculates measures via direct SoQL calls.
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { SoqlDataProvider } from 'common/visualizations/dataProviders';
import { CalculationTypeNames } from '../lib/constants';
import { assertIsOneOfTypes } from 'common/js_utils';

const setupSoqlDataProvider = (measure) => {
  const datasetUid = _.get(measure, 'metric.dataSource.uid');
  if (!datasetUid) {
    return null;
  }

  const dataProviderConfig = {
    domain: window.location.hostname,
    datasetUid
  };

  return new SoqlDataProvider(dataProviderConfig);
};

/* Helper functions. Should use BigNumbers where possible. */

// Returns: BigNumber.
const count = async (dataProvider, fieldName, excludeNullValues) => {
  if (!excludeNullValues) {
    return new BigNumber(await dataProvider.getRowCount());
  }

  const countAlias = '__measure_count_alias__';
  const data = await dataProvider.rawQuery(`select count(${fieldName}) as ${countAlias}`);
  return new BigNumber(data[0][countAlias]);
};

// Returns: BigNumber.
const sum = async (dataProvider, fieldName) => {
  const sumAlias = '__measure_sum_alias__';

  const data = await dataProvider.rawQuery(`select sum(${fieldName}) as ${sumAlias}`);
  return new BigNumber(data[0][sumAlias]);
};

/* Measure types
 * Should generally return objects like:
 * {
 *   result: string (usually from BigNumber#toFixed),
 *   // calculation-specific fields:
 *   numerator: string (Rate)
 *   denominator: string (Rate)
 *   dividingByZero: bool (Rate)
 * }
 *
 * If any parts of the calculation are not defined (i.e., missing a required
 * field), the corresponding properties should not be specified. For instance,
 * here's what a Rate calculation with an invalid denominator should return:
 * {
 *   numerator: BigNumber<XXX>
 * }
 *
 * And here is what an undefined sum calculation should return:
 * { }
 */

export const calculateCountMeasure = async (measure) => {
  const dataProvider = setupSoqlDataProvider(measure);
  const column = _.get(measure, 'metric.arguments.column');
  if (!dataProvider || !column) {
    return {};
  }

  const result = await count(
    dataProvider,
    column,
    _.get(measure, 'metric.arguments.excludeNullValues')
  );

  return {
    result: result.toFixed(0) // No sense having decimals for counts.
  };
};

export const calculateSumMeasure = async (measure) => {
  const dataProvider = setupSoqlDataProvider(measure);
  const column = _.get(measure, 'metric.arguments.column');
  const decimalPlaces = _.get(measure, 'metric.display.decimalPlaces');

  if (!dataProvider || !column) {
    return {};
  }

  return {
    result: (await sum(dataProvider, column)).toFixed(decimalPlaces)
  };
};

export const calculateRecentValueMeasure = async (measure) => {
  const dataProvider = setupSoqlDataProvider(measure);
  const valueColumnFieldName = _.get(measure, 'metric.arguments.valueColumn');
  const dateColumnFieldName = _.get(measure, 'metric.arguments.dateColumn');
  const decimalPlaces = _.get(measure, 'metric.display.decimalPlaces');

  if (!dataProvider || !valueColumnFieldName || !dateColumnFieldName) {
    return {};
  }
  const data = await dataProvider.rawQuery(
    `select ${valueColumnFieldName} order by ${dateColumnFieldName} DESC limit 1`
  );

  return {
    result: new BigNumber(_.values(data[0])[0]).toFixed(decimalPlaces)
  };
};

export const calculateRateMeasure = async (measure, dataProvider = setupSoqlDataProvider(measure)) => {
  const {
    aggregationType,
    numeratorColumn,
    denominatorColumn,
    numeratorExcludeNullValues,
    denominatorExcludeNullValues,
    fixedDenominator
  } = _.get(measure, 'metric.arguments', {});

  const decimalPlaces = _.get(measure, 'metric.display.decimalPlaces');
  const asPercent = _.get(measure, 'metric.display.asPercent');

  if (!dataProvider) {
    return {};
  }

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
    case CalculationTypeNames.COUNT:
      numeratorPromise = numeratorColumn ?
        count(dataProvider, numeratorColumn, numeratorExcludeNullValues) :
        null;

      denominatorPromise = denominatorPromise ||
        (denominatorColumn ? count(dataProvider, denominatorColumn, denominatorExcludeNullValues) : null);
      break;
    case CalculationTypeNames.SUM:
      numeratorPromise = numeratorColumn ?
        sum(dataProvider, numeratorColumn) :
        null;

      denominatorPromise = denominatorPromise ||
        (denominatorColumn ? sum(dataProvider, denominatorColumn) : null);
      break;
    case undefined:
      // Numerator column cannot be computed if we don't have an aggregation.
      // However, we can compute the denominator if it is fixed.
      // We don't need to do anything here as denominatorPromise will
      // already be set up for us - we just need to avoid the default:
      // case.
      break;
    default:
      throw new Error(`Unknown aggregation type: ${aggregationType}`);
  }

  let numerator = await numeratorPromise;
  let denominator = await denominatorPromise;
  if (numerator) { numerator = new BigNumber(numerator); }
  if (denominator) { denominator = new BigNumber(denominator); }

  const calculation = {};
  if (numerator) { calculation.numerator = numerator.toFixed(decimalPlaces); }
  if (denominator) {
    calculation.denominator = denominator.toFixed(decimalPlaces);
    calculation.dividingByZero = denominator.isZero();
  }
  if (numerator && denominator) {
    calculation.result = numerator.dividedBy(denominator).
      times(asPercent ? '100' : '1').
      toFixed(decimalPlaces);
  }

  return calculation;
};

export const calculateMeasure = async (measure) => {
  assertIsOneOfTypes(measure, 'object');

  const calculationType = _.get(measure, 'metric.type');

  if (_.isUndefined(calculationType)) {
    return {}; // Calculation undefined, but that's fine. See comment at top of section.
  }

  assertIsOneOfTypes(calculationType, 'string');

  switch (calculationType) {
    case CalculationTypeNames.COUNT:
      return calculateCountMeasure(measure);
    case CalculationTypeNames.SUM:
      return calculateSumMeasure(measure);
    case CalculationTypeNames.RECENT_VALUE:
      return calculateRecentValueMeasure(measure);
    case CalculationTypeNames.RATE:
      return calculateRateMeasure(measure);
    default:
      throw new Error(`Unknown calculation type: ${calculationType}`);
  }
};

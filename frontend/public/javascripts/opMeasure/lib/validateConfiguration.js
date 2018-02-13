import _ from 'lodash';

import { NUMERIC_COLUMN_TYPES } from 'common/authoring_workflow/constants';
import {
  CalculationTypes,
  RateAggregationTypes
} from 'common/performance_measures/lib/constants';

// Given a metric configuration and the metadata of the data source, returns a
// structured set of possible error states. Each error state is true if a
// misconfiguration has been detected or false otherwise.
//
// Errors that depend on the contents of the data source, including the result
// of a metric calculation, are not validated.
//
// The validator makes no assumptions about its arguments; its extra-cautious
// behavior helps ensure that we never throw and always return the same shape.
//
// IMPORTANT: In order to keep the code simple, the sub-keys are matched with
// translation keys and the EditTabs constants. Changes should be kept in sync.

export default function validateConfiguration(metric, viewMetadata) {
  return {
    calculation: validateCalculation(metric, viewMetadata),
    dataSource: validateDataSource(viewMetadata),
    reportingPeriod: validateReportingPeriod(metric)
  };
}

function validateCalculation(metric, viewMetadata) {
  const type = _.get(metric, 'type');

  const isCountCalculation = type === CalculationTypes.COUNT;
  const isRateCalculation = type === CalculationTypes.RATE;
  const isRecentValueCalculation = type === CalculationTypes.RECENT;
  const isSumCalculation = type === CalculationTypes.SUM;
  const rateAggregationType = _.get(metric, 'arguments.aggregationType');
  const requiresNumericColumn = isRecentValueCalculation || isSumCalculation ||
    (isRateCalculation && rateAggregationType === RateAggregationTypes.SUM);
  const hasNumericColumn = _.isArray(_.get(viewMetadata, 'columns')) &&
    _.some(
      viewMetadata.columns,
      (column) => _.includes(NUMERIC_COLUMN_TYPES, column.dataTypeName)
    );

  // We could expand most of these validations to check for a column that exists
  // in the view metadata.
  const noCountColumn = isCountCalculation &&
    _.isNil(_.get(metric, 'arguments.column'));
  const noDenominatorColumn = isRateCalculation &&
    _.isNil(_.get(metric, 'arguments.denominatorColumn')) &&
    _.isNil(_.get(metric, 'arguments.fixedDenominator'));
  const noNumeratorColumn = isRateCalculation &&
    _.isNil(_.get(metric, 'arguments.numeratorColumn'));
  const noNumericColumn = requiresNumericColumn && !hasNumericColumn;
  const noRecentValueColumn = isRecentValueCalculation &&
    _.isNil(_.get(metric, 'arguments.valueColumn'));
  const noReferenceDateColumn = _.isNil(_.get(metric, 'dateColumn'));
  const noSumColumn = isSumCalculation &&
    _.isNil(_.get(metric, 'arguments.column'));

  // We could expand this validation to check that the detected value belongs to
  // the corresponding enum.
  const noRateAggregation = isRateCalculation && _.isNil(rateAggregationType);

  return {
    noCountColumn,
    noDenominatorColumn,
    noNumeratorColumn,
    noNumericColumn,
    noRateAggregation,
    noRecentValueColumn,
    noReferenceDateColumn,
    noSumColumn
  };
}

function validateDataSource(viewMetadata) {
  // We could expand this validation to check for a non-empty set of columns.
  const noDataSource = !_.isPlainObject(viewMetadata);

  return {
    noDataSource
  };
}

function validateReportingPeriod(metric) {
  // We could expand these validation to ensure that the detected values belong
  // to the corresponding enums.
  const noPeriodType = _.isNil(_.get(metric, 'reportingPeriod.type'));
  const noPeriodSize = _.isNil(_.get(metric, 'reportingPeriod.size'));

  // We could expand this validation to ensure that the detected value is a
  // valid date.
  const noStartDate = _.isNil(_.get(metric, 'reportingPeriod.startDate'));

  return {
    noPeriodSize,
    noPeriodType,
    noStartDate
    // TODO: targetsOutOfSync
  };
}

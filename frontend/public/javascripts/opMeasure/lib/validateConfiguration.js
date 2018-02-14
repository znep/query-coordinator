import _ from 'lodash';

import { NUMERIC_COLUMN_TYPES } from 'common/authoring_workflow/constants';
import {
  CalculationTypes,
  RateAggregationTypes
} from 'common/performance_measures/lib/constants';

// Given a metric configuration, the metadata of the data source, and the set of
// columns that are usable for the metric, returns a structured set of possible
// error states. Each error state is true if a misconfiguration has been
// detected or false otherwise.
//
// Errors that depend on the contents of the data source, including the result
// of a metric calculation, are not validated.
//
// The validator makes no assumptions about its arguments; its extra-cautious
// behavior helps ensure that we never throw and always return the same shape.
//
// IMPORTANT: In order to keep the code simple, the sub-keys are matched with
// translation keys and the EditTabs constants. Changes should be kept in sync.

export default function validateConfiguration(
  metric,
  viewMetadata,
  displayableFilterableColumns
) {
  return {
    calculation: validateCalculation(metric, displayableFilterableColumns),
    dataSource: validateDataSource(viewMetadata, displayableFilterableColumns),
    reportingPeriod: validateReportingPeriod(metric)
  };
}

function validateCalculation(metric, columns) {
  const type = _.get(metric, 'type');

  const isCountCalculation = type === CalculationTypes.COUNT;
  const isRateCalculation = type === CalculationTypes.RATE;
  const isRecentValueCalculation = type === CalculationTypes.RECENT;
  const isSumCalculation = type === CalculationTypes.SUM;
  const rateAggregationType = _.get(metric, 'arguments.aggregationType');
  const requiresNumericColumn = isRecentValueCalculation || isSumCalculation ||
    (isRateCalculation && rateAggregationType === RateAggregationTypes.SUM);
  const hasNumericColumn = _.isArray(columns) &&
    _.some(columns, (column) => _.includes(NUMERIC_COLUMN_TYPES, column.dataTypeName));

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

function validateDataSource(viewMetadata, columns) {
  // We could expand this validation to check for a non-empty set of columns.
  //
  // NOTE: There are four reasonable states for the data source, as far as
  // determining its existence:
  //
  // * measure.dataSourceLensUid: nil, dataSourceView: nil => no selection
  // * measure.dataSourceLensUid: 4x4, dataSourceView: empty object => fetching
  // * measure.dataSourceLensUid: 4x4, dataSourceView: view => valid selection
  // * measure.dataSourceLensUid: 4x4, dataSourceView: nil => invalid selection
  //
  // This validation concerns itself with the first and last cases. Although we
  // don't technically have a data source in the second case, it is a transient
  // state in which we optimistically assert existence, knowing that we'll
  // resolve to a correct and stable state and re-trigger validation shortly.
  const noDataSource = !_.isPlainObject(viewMetadata);

  // We can only speak definitively about column presence/absence when a view
  // can be found. An empty object is provided during the in-flight state.
  const noDateColumn = !_.isEmpty(viewMetadata) &&
    !_.some(columns, { dataTypeName: 'calendar_date' });

  return {
    noDataSource,
    noDateColumn
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

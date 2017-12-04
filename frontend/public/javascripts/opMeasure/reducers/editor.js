import _ from 'lodash';

import { assert, assertIsNumber, assertIsOneOfTypes } from 'common/js_utils';

import validate from './validate';
import actions from '../actions';
import { CalculationTypeNames } from '../lib/constants';
import { isColumnUsableWithMeasureArgument } from '../measureCalculator';

const validateActionRegex = /^VALIDATE_/;

// Convenience mutator for the measure being edited.
// warning: _.merge will ignore undefined values so in the scenario where a value is
// 'unset', it is best to explicitly pass in null which _is_ handled by _.merge
const updateMeasureProperty = (state, propertyPath, value) => ({
  ...state,
  measure: _.merge({}, state.measure, _.set({}, propertyPath, value))
});

const setCalculationType = (state, type) => {
  // Changing type clears everything under 'metric' other than the data source.
  // This is by design.
  assert(
    _.includes(_.values(CalculationTypeNames), type),
    `Unknown calculation type given: ${type}`
  );

  const currentDataSource = _.get(state, 'measure.metric.dataSource');
  const newState = {
    ...state
  };

  _.set(newState, 'measure.metric', {
    type,
    dataSource: currentDataSource
  });

  // Set some defaults for calculation types.
  switch (type) {
    case CalculationTypeNames.COUNT:
      _.set(newState, 'measure.metric.arguments.includeNullValues', true);
      break;
    case CalculationTypeNames.RATE:
      // TODO Reconcile the fact that it doesn't always make sense to include null
      // values in the denominator (i.e., sums).
      _.set(newState, 'measure.metric.arguments.denominatorIncludeNullValues', true);
      break;
    default: // pass
  }

  return newState;
};

// Initial state for the edit modal reducer.
const initialState = _.constant({
  isEditing: false,
  measure: {},
  pristineMeasure: {},
  validationErrors: validate().validationErrors
});

// Edit modal reducer.
// Governs all form updates, as well as initialize/open and close events.
export default (state = initialState(), action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  // Delegate to sub-reducer for validation.
  if (validateActionRegex.test(action.type)) {
    return validate(state, action);
  }

  // Need to cloneDeep the state since react/redux only does a shallow comparison so when we pass a 'measure'
  // prop, changes to nested properties such as 'metric' does not trigger rerendering`
  state = _.cloneDeep(state);

  switch (action.type) {
    case actions.editor.SET_DATA_SOURCE_UID: {
      const newState = { ...state };
      _.set(newState, 'measure.metric.dataSource', {
        uid: action.uid
      });
      return newState;
    }
    case actions.editor.RECEIVE_DATA_SOURCE_METADATA: {
      assertIsNumber(action.rowCount);
      assertIsOneOfTypes(action.dataSourceViewMetadata, 'object');

      const newState = {
        ...state,
        cachedRowCount: action.rowCount,
        dataSourceViewMetadata: action.dataSourceViewMetadata,
        displayableFilterableColumns: action.displayableFilterableColumns
      };

      return setCalculationType(newState, CalculationTypeNames.COUNT); // Clear any existing measure config.
    }
    case actions.editor.SET_CALCULATION_TYPE: {
      return setCalculationType(state, action.calculationType);
    }

    case actions.editor.SET_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');
      return updateMeasureProperty(state, 'metric.arguments.column', action.fieldName);

    case actions.editor.SET_VALUE_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');
      return updateMeasureProperty(state, 'metric.arguments.valueColumn', action.fieldName);

    case actions.editor.SET_AGGREGATION_TYPE: {
      assertIsOneOfTypes(action.aggregationType, 'string');
      assert(
        _.get(state, 'measure.metric.type') === 'rate',
        'This action only makes sense for rate measures today.'
      );

      const newState = updateMeasureProperty(
        state,
        'metric.arguments.aggregationType',
        action.aggregationType
      );

      // Changing aggregation type changes the set of columns that are valid for the numerator
      // and denominator (i.e., it makes sense to count on a date column, but it does not make
      // sense to sum a date column).
      // If the numerator/denominator columns are valid, keep them. If not, clear them.
      let { numeratorColumn, denominatorColumn } = _.get(state, 'measure.metric.arguments') || {};
      numeratorColumn = _.find(state.dataSourceViewMetadata.columns, { fieldName: numeratorColumn });
      denominatorColumn = _.find(state.dataSourceViewMetadata.columns, { fieldName: denominatorColumn });

      if (!isColumnUsableWithMeasureArgument(numeratorColumn, newState.measure, 'numerator')) {
        _.unset(newState, 'measure.metric.arguments.numeratorColumn');
        _.unset(newState, 'measure.metric.arguments.numeratorColumnCondition');
      }
      if (!isColumnUsableWithMeasureArgument(denominatorColumn, newState.measure, 'denominator')) {
        _.unset(newState, 'measure.metric.arguments.denominatorColumn');
      }

      return newState;
    }

    case actions.editor.SET_NUMERATOR_COLUMN: {
      assert(
        _.get(state, 'measure.metric.type') === 'rate',
        'This action only makes sense for rate measures.'
      );
      assertIsOneOfTypes(action.fieldName, 'string');
      const newState = updateMeasureProperty(state, 'metric.arguments.numeratorColumn', action.fieldName);
      _.unset(newState, 'measure.metric.arguments.numeratorColumnCondition');
      return newState;
    }

    case actions.editor.SET_NUMERATOR_COLUMN_CONDITION:
      assert(
        _.get(state, 'measure.metric.type') === 'rate',
        'This action only makes sense for rate measures today.'
      );
      return _.set(state, 'measure.metric.arguments.numeratorColumnCondition', action.condition);

    case actions.editor.SET_DENOMINATOR_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');
      // Cant have both Denominator Column and Fixed Denominator
      _.unset(state, 'measure.metric.arguments.fixedDenominator');
      return updateMeasureProperty(state, 'metric.arguments.denominatorColumn', action.fieldName);

    case actions.editor.SET_FIXED_DENOMINATOR:
      _.unset(state, 'measure.metric.arguments.denominatorColumn');
      return updateMeasureProperty(state, 'metric.arguments.fixedDenominator', action.denominator);

    case actions.editor.SET_DATE_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');

      return updateMeasureProperty(state, 'metric.arguments.dateColumn', action.fieldName);

    case actions.editor.SET_ANALYSIS:
      return updateMeasureProperty(state, 'metadata.analysis', action.analysis);

    case actions.editor.TOGGLE_INCLUDE_NULL_VALUES: {
      const currentValue = _.get(state, 'measure.metric.arguments.includeNullValues', true);
      return updateMeasureProperty(state, 'metric.arguments.includeNullValues', !currentValue);
    }

    case actions.editor.TOGGLE_DENOMINATOR_INCLUDE_NULL_VALUES: {
      const currentValue = _.get(state, 'measure.metric.arguments.denominatorIncludeNullValues', true);
      return updateMeasureProperty(state, 'metric.arguments.denominatorIncludeNullValues', !currentValue);
    }

    case actions.editor.SET_DECIMAL_PLACES:
      return updateMeasureProperty(state, 'metric.display.decimalPlaces', action.places);

    case actions.editor.SET_UNIT_LABEL:
      return updateMeasureProperty(state, 'metric.display.label', action.label);

    case actions.editor.TOGGLE_DISPLAY_AS_PERCENT: {
      const currentValue = _.get(state, 'measure.metric.display.asPercent');
      return updateMeasureProperty(state, 'metric.display.asPercent', !currentValue);
    }

    case actions.editor.SET_START_DATE:
      return updateMeasureProperty(state, 'metric.reportingPeriod.startDate', action.startDate);

    case actions.editor.SET_METHODS:
      return updateMeasureProperty(state, 'metadata.methods', action.methods);

    case actions.editor.SET_DESCRIPTION:
      return updateMeasureProperty(state, 'description', action.description);

    case actions.editor.SET_NAME:
      return updateMeasureProperty(state, 'name', action.name);

    case actions.editor.SET_SHORT_NAME:
      return updateMeasureProperty(state, 'shortName', action.shortName);

    case actions.editor.OPEN_EDIT_MODAL: {
      let nextState = {
        ...state,
        isEditing: true,
        measure: action.measure,
        pristineMeasure: action.measure
      };

      // If no calculation type is set, defaults to 'count'
      const currentType = _.get(nextState, 'measure.metric.type');
      if (_.isEmpty(currentType)) {
        nextState = setCalculationType(nextState, CalculationTypeNames.COUNT);
      }

      return nextState;
    }

    case actions.editor.CANCEL_EDIT_MODAL:
    case actions.editor.ACCEPT_EDIT_MODAL_CHANGES:
      return {
        ...state,
        isEditing: false
      };

    default:
      return state;
  }
};

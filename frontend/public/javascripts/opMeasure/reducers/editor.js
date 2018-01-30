import _ from 'lodash';

import { assert, assertIsNumber, assertIsString, assertIsOneOfTypes } from 'common/js_utils';
import { CalculationTypeNames, EditTabs } from 'common/performance_measures/lib/constants';
import { isColumnUsableWithMeasureArgument } from 'common/performance_measures/measureCalculator';

import validate from './validate';
import actions from '../actions';

const validateActionRegex = /^VALIDATE_/;

// Convenience mutator for the measure being edited.
// warning: _.merge will ignore undefined values so in the scenario where a value is
// 'unset', it is best to explicitly pass in null which _is_ handled by _.merge
const updateMeasureProperty = (state, propertyPath, value) => ({
  ...state,
  measure: _.merge({}, state.measure, _.set({}, propertyPath, value))
});

const setCalculationType = (state, type) => {
  // Changing type clears almost everything under 'metricConfig'.
  // This is by design.
  assert(
    _.includes(_.values(CalculationTypeNames), type),
    `Unknown calculation type given: ${type}`
  );

  const existingType = _.get(state, 'measure.metricConfig.type');
  if (type === existingType) {
    return state;
  }

  const newState = _.cloneDeep(state);

  _.set(newState, 'measure.metricConfig', {
    type
  });

  const pathsToKeep = [
    'measure.metricConfig.reportingPeriod',
    'measure.metricConfig.dateColumn'
  ];

  pathsToKeep.forEach((path) => {
    if (_.has(state, path)) {
      _.set(newState, path, _.get(state, path));
    }
  });

  // Set some defaults for calculation types.
  switch (type) {
    case CalculationTypeNames.COUNT:
      _.set(newState, 'measure.metricConfig.arguments.includeNullValues', true);
      break;
    case CalculationTypeNames.RATE:
      // TODO Reconcile the fact that it doesn't always make sense to include null
      // values in the denominator (i.e., sums).
      _.set(newState, 'measure.metricConfig.arguments.denominatorIncludeNullValues', true);
      break;
    default: // pass
  }

  return newState;
};

const resetDataSource = (state) => {
  const { measure, errors } = state;
  const defaultCalculationType = CalculationTypeNames.COUNT;

  return {
    ...state,
    measure: {
      ...measure,
      dataSourceLensUid: null,
      metricConfig: {
        type: defaultCalculationType
      }
    },
    cachedRowCount: undefined,
    dataSourceView: null,
    displayableFilterableColumns: [],
    errors: {
      ...errors,
      fetchDataSourceViewError: false,
      setDataSourceMetadataError: false
    }
  };
};

// Initial state for the edit modal reducer.
export const INITIAL_STATE = Object.freeze({
  isEditing: false,
  activePanel: EditTabs.GENERAL_INFO,
  measure: {},
  pristineMeasure: {},
  pristineCoreView: {},
  validationErrors: validate().validationErrors
});

// Edit modal reducer.
// Governs all form updates, as well as initialize/open and close events.
export default (state = _.cloneDeep(INITIAL_STATE), action) => {
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
    case actions.editor.SET_ACTIVE_PANEL: {
      return {
        ...state,
        activePanel: action.panelId
      };
    }

    case actions.editor.SET_DATA_SOURCE_METADATA_SUCCESS: {
      const { uid, rowCount, dataSourceView, displayableFilterableColumns } = action;
      // N.B.: This action is dispatched when the editor is loaded. It does not imply the user
      // chose a new data source - we could just be loading an existing measure.
      // This means that we won't touch the metricConfig - if the user is switching data
      // sources, dispatch a SET_DATA_SOURCE_UID first to reset the metricConfig to defaults.
      assertIsString(uid);
      assertIsNumber(rowCount);
      assertIsOneOfTypes(dataSourceView, 'object');

      // We need to clear out any stale metricConfig data, now that we
      // have a new data source. The easiest way is to call our reset helper function.
      state = resetDataSource(state);
      const { measure } = state;

      return {
        ...state,
        measure: {
          ...measure,
          dataSourceLensUid: uid
        },
        cachedRowCount: rowCount,
        dataSourceView: dataSourceView,
        displayableFilterableColumns: displayableFilterableColumns,
        errors: {
          fetchDataSourceViewError: false,
          setDataSourceMetadataError: false
        }
      };
    }

    // Invalid state: dataset fetch request failed
    case actions.editor.FETCH_DATA_SOURCE_VIEW_FAIL: {
      const { errors } = state;

      return {
        ...state,
        errors: {
          ...errors,
          fetchDataSourceViewError: true
        }
      };
    }

    // Invalid state: set dataset metadata failed due to missing calendar_date column
    case actions.editor.SET_DATA_SOURCE_METADATA_FAIL: {
      const { errors } = state;

      return {
        ...state,
        errors: {
          ...errors,
          setDataSourceMetadataError: true
        }
      };
    }

    // Default state: no dataset selected
    case actions.editor.RESET_DATA_SOURCE: {
      return resetDataSource(state);
    }

    case actions.editor.SET_CALCULATION_TYPE: {
      return setCalculationType(state, action.calculationType);
    }

    case actions.editor.SET_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');
      return updateMeasureProperty(state, 'metricConfig.arguments.column', action.fieldName);

    case actions.editor.SET_VALUE_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');
      return updateMeasureProperty(state, 'metricConfig.arguments.valueColumn', action.fieldName);

    case actions.editor.SET_AGGREGATION_TYPE: {
      assertIsOneOfTypes(action.aggregationType, 'string');
      assert(
        _.get(state, 'measure.metricConfig.type') === 'rate',
        'This action only makes sense for rate measures today.'
      );

      const newState = updateMeasureProperty(
        state,
        'metricConfig.arguments.aggregationType',
        action.aggregationType
      );

      // Changing aggregation type changes the set of columns that are valid for the numerator
      // and denominator (i.e., it makes sense to count on a date column, but it does not make
      // sense to sum a date column).
      // If the numerator/denominator columns are valid, keep them. If not, clear them.
      let { numeratorColumn, denominatorColumn } = _.get(state, 'measure.metricConfig.arguments') || {};
      numeratorColumn = _.find(state.dataSourceView.columns, { fieldName: numeratorColumn });
      denominatorColumn = _.find(state.dataSourceView.columns, { fieldName: denominatorColumn });

      if (!isColumnUsableWithMeasureArgument(numeratorColumn, newState.measure, 'numerator')) {
        _.unset(newState, 'measure.metricConfig.arguments.numeratorColumn');
        _.unset(newState, 'measure.metricConfig.arguments.numeratorColumnCondition');
      }
      if (!isColumnUsableWithMeasureArgument(denominatorColumn, newState.measure, 'denominator')) {
        _.unset(newState, 'measure.metricConfig.arguments.denominatorColumn');
      }

      return newState;
    }

    case actions.editor.SET_NUMERATOR_COLUMN: {
      assert(
        _.get(state, 'measure.metricConfig.type') === 'rate',
        'This action only makes sense for rate measures.'
      );
      assertIsOneOfTypes(action.fieldName, 'string');
      const newState = updateMeasureProperty(
        state,
        'metricConfig.arguments.numeratorColumn',
        action.fieldName
      );
      _.unset(newState, 'measure.metricConfig.arguments.numeratorColumnCondition');
      return newState;
    }

    case actions.editor.SET_NUMERATOR_COLUMN_CONDITION:
      assert(
        _.get(state, 'measure.metricConfig.type') === 'rate',
        'This action only makes sense for rate measures today.'
      );
      return _.set(state, 'measure.metricConfig.arguments.numeratorColumnCondition', action.condition);

    case actions.editor.SET_DENOMINATOR_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');
      // Cant have both Denominator Column and Fixed Denominator
      _.unset(state, 'measure.metricConfig.arguments.fixedDenominator');
      return updateMeasureProperty(state, 'metricConfig.arguments.denominatorColumn', action.fieldName);

    case actions.editor.SET_FIXED_DENOMINATOR:
      _.unset(state, 'measure.metricConfig.arguments.denominatorColumn');
      return updateMeasureProperty(state, 'metricConfig.arguments.fixedDenominator', action.denominator);

    case actions.editor.SET_DATE_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');

      return updateMeasureProperty(state, 'metricConfig.dateColumn', action.fieldName);

    case actions.editor.SET_ANALYSIS:
      return updateMeasureProperty(state, 'metadata.analysis', action.analysis);

    case actions.editor.TOGGLE_INCLUDE_NULL_VALUES: {
      const currentValue = _.get(state, 'measure.metricConfig.arguments.includeNullValues', true);
      return updateMeasureProperty(state, 'metricConfig.arguments.includeNullValues', !currentValue);
    }

    case actions.editor.TOGGLE_DENOMINATOR_INCLUDE_NULL_VALUES: {
      const currentValue = _.get(state, 'measure.metricConfig.arguments.denominatorIncludeNullValues', true);
      return updateMeasureProperty(
        state,
        'metricConfig.arguments.denominatorIncludeNullValues',
        !currentValue
      );
    }

    case actions.editor.SET_DECIMAL_PLACES:
      return updateMeasureProperty(state, 'metricConfig.display.decimalPlaces', action.places);

    case actions.editor.SET_UNIT_LABEL:
      return updateMeasureProperty(state, 'metricConfig.display.label', action.label);

    case actions.editor.TOGGLE_DISPLAY_AS_PERCENT: {
      const currentValue = _.get(state, 'measure.metricConfig.display.asPercent');
      return updateMeasureProperty(state, 'metricConfig.display.asPercent', !currentValue);
    }

    case actions.editor.SET_START_DATE:
      return updateMeasureProperty(state, 'metricConfig.reportingPeriod.startDate', action.startDate);

    case actions.editor.SET_PERIOD_TYPE:
      return updateMeasureProperty(state, 'metricConfig.reportingPeriod.type', action.periodType);

    case actions.editor.SET_PERIOD_SIZE:
      return updateMeasureProperty(state, 'metricConfig.reportingPeriod.size', action.periodSize);

    case actions.editor.SET_METHODS:
      return updateMeasureProperty(state, 'metadata.methods', action.methods);

    case actions.editor.SET_DESCRIPTION:
      return _.set(state, 'coreView.description', action.description);

    case actions.editor.SET_NAME:
      return _.set(state, 'coreView.name', action.name);

    case actions.editor.SET_SHORT_NAME:
      return _.set(state, 'measure.metadata.shortName', action.shortName);

    case actions.editor.OPEN_EDIT_MODAL: {
      const editorDataSourceLensUid = _.get(state, 'measure.dataSourceLensUid');

      let nextState = {
        activePanel: EditTabs.GENERAL_INFO,
        isEditing: true,
        coreView: { ...action.coreView },
        measure: { ...action.measure },
        pristineCoreView: _.cloneDeep(action.coreView),
        pristineMeasure: _.cloneDeep(action.measure),
        validationErrors: validate().validationErrors
      };

      // Generally, it makes sense to clear out the state and start fresh when opening the edit modal.
      // However, in the scenario where the user selects a data source, accepts, then opens the edit modal
      // again, we need to re-populate the datasource data
      if (action.viewDataSourceLensUid === editorDataSourceLensUid) {
        nextState.cachedRowCount = state.cachedRowCount;
        nextState.dataSourceView = state.dataSourceView;
        nextState.displayableFilterableColumns = state.displayableFilterableColumns;
      }

      // If no calculation type is set, defaults to 'count'
      const currentType = _.get(nextState, 'measure.metricConfig.type');
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

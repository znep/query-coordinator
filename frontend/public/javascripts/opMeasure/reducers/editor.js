import _ from 'lodash';

import { assertIsNumber, assertIsOneOfTypes } from 'common/js_utils';
import actions from '../actions';
import { CalculationTypeNames } from '../lib/constants';

// Convenience mutator for the measure being edited.
// warning: _.merge will ignore undefined values so in the scenario where a value is
// 'unset', it is best to explicitly pass in null which _is_ handled by _.merge
const updateMeasureProperty = (state, propertyPath, value) => ({
  ...state,
  measure: _.merge({}, state.measure, _.set({}, propertyPath, value))
});

// Initial state for the edit modal reducer.
const initialState = _.constant({
  isEditing: false,
  measure: {},
  pristineMeasure: {}
});

// Edit modal reducer.
// Governs all form updates, as well as initialize/open and close events.
export default (state = initialState(), action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  // TODO: We're running on a razor's edge due to the shallow props comparison done by
  // React and Connect. It's very easy to cause updates to not propagate to components.
  // Consider cloning the entire state tree deeply on every update.
  switch (action.type) {
    case actions.editor.SET_DATA_SOURCE_UID: {
      const newState = { ...state };
      _.set(newState, 'measure.metric.dataSource', {
        uid: action.uid
      });
      return newState;
    }
    case actions.editor.RECEIVE_DATA_SOURCE_METADATA:
      assertIsNumber(action.rowCount);
      assertIsOneOfTypes(action.dataSourceViewMetadata, 'object');

      return {
        ...state,
        cachedRowCount: action.rowCount,
        dataSourceViewMetadata: action.dataSourceViewMetadata,
        displayableFilterableColumns: action.displayableFilterableColumns
      };

    case actions.editor.SET_CALCULATION_TYPE:
      // Changing type clears everything other than the data source -
      // should we revisit this when we have more than one calculation type implemented?
      return updateMeasureProperty(state, 'metric', {
        type: action.calculationType,
        dataSource: _.get(state, 'measure.metric.dataSource')
      });
    case actions.editor.SET_COLUMN:
      assertIsOneOfTypes(action.fieldName, 'string');

      return updateMeasureProperty(state, 'metric.arguments.column', action.fieldName);

    case actions.editor.SET_ANALYSIS:
      return updateMeasureProperty(state, 'metadata.analysis', action.analysis);

    case actions.editor.TOGGLE_EXCLUDE_NULL_VALUES: {
      const currentValue = _.get(state, 'measure.metric.arguments.excludeNullValues');
      return updateMeasureProperty(state, 'metric.arguments.excludeNullValues', !currentValue);
    }
    case actions.editor.SET_DECIMAL_PLACES:
      return updateMeasureProperty(state, 'metric.display.decimalPlaces', action.places);

    case actions.editor.SET_UNIT_LABEL:
      return updateMeasureProperty(state, 'metric.display.label', action.label);

    case actions.editor.SET_METHODS:
      return updateMeasureProperty(state, 'metadata.methods', action.methods);

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
        nextState = updateMeasureProperty(nextState, 'metric.type', CalculationTypeNames.COUNT);
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

import _ from 'lodash';

import * as actions from '../actions/editor';

// Convenience mutator for the measure being edited.
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

  switch (action.type) {
    case actions.RECEIVE_DATA_SOURCE:
      return updateMeasureProperty(state, 'metric.dataSource', action.dataSource);

    case actions.SET_ANALYSIS:
      return updateMeasureProperty(state, 'metadata.analysis', action.analysis);

    case actions.SET_METHODS:
      return updateMeasureProperty(state, 'metadata.methods', action.methods);

    case actions.CLONE_MEASURE:
      return {
        ...state,
        measure: action.measure,
        pristineMeasure: action.measure
      };

    case actions.OPEN_EDIT_MODAL:
      return {
        ...state,
        isEditing: true
      };

    case actions.CLOSE_EDIT_MODAL:
      return {
        ...state,
        isEditing: false
      };

    default:
      return state;
  }
};

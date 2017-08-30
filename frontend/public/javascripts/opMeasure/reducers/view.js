import _ from 'lodash';

import * as actions from '../actions/view';
import { SaveStates } from '../lib/constants';

// Initial state for the view reducer augments the state passed via ERB.
const initialState = () => {
  const state = window.initialState;

  _.defaults(state, {
    activePane: 'summary',
    isDirty: false,
    saveState: SaveStates.IDLE
  });

  return state;
};

// View reducer.
// Handles on-page navigation, save actions, and updates from the edit modal.
export default (state = initialState(), action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  switch (action.type) {
    case actions.SET_ACTIVE_PANE:
      return {
        ...state,
        activePane: action.activePane
      };

    case actions.UPDATE_MEASURE:
      return {
        ...state,
        isDirty: true,
        measure: action.measure
      };

    default:
      return state;
  }
};

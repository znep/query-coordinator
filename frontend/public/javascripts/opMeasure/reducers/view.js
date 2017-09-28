import _ from 'lodash';

import actions from '../actions';
import { ModeStates, SaveStates } from '../lib/constants';

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
    case actions.view.SET_ACTIVE_PANE:
      return {
        ...state,
        activePane: action.activePane
      };

    case actions.editor.ACCEPT_EDIT_MODAL_CHANGES:
      return {
        ...state,
        isDirty: true,
        measure: action.measure
      };

    case actions.view.ENTER_EDIT_MODE: {
      return {
        ...state,
        mode: ModeStates.EDIT
      };
    }

    case actions.view.ENTER_PREVIEW_MODE:
      return {
        ...state,
        mode: ModeStates.PREVIEW
      };

    default:
      return state;
  }
};

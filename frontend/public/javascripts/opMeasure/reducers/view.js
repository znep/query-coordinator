import _ from 'lodash';

import actions from '../actions';
import { ModeStates, PeriodTypes, SaveStates } from '../lib/constants';

// Initial state for the view reducer augments the state passed via ERB.
const INITIAL_STATE = _.merge({}, window.initialState, {
  activePane: 'summary',
  isDirty: false,
  saveState: SaveStates.IDLE,
  measure: {
    metric: {
      reportingPeriod: {
        type: PeriodTypes.CLOSED
      }
    }
  }
});

// View reducer.
// Handles on-page navigation, save actions, and updates from the edit modal.
export default (state = INITIAL_STATE, action) => {
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

import _ from 'lodash';

import { ModeStates, SaveStates } from 'common/performance_measures/lib/constants';
import actions from '../actions';

// Initial state for the view reducer augments the state passed via ERB.
const INITIAL_STATE = _.merge({}, window.socrata.opMeasure, {
  activePane: 'summary',
  isDirty: false,
  saveState: SaveStates.IDLE
});

// View reducer.
// Handles on-page navigation, save actions, and updates from the edit modal.
export default (state = INITIAL_STATE, action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  switch (action.type) {
    case actions.view.SAVE_START:
      return {
        ...state,
        saving: true,
        saveError: false,
        showSaveToastMessage: false
      };

    case actions.view.SAVE_COMPLETE:
      return {
        ...state,
        isDirty: !!action.error,
        saving: false,
        saveError: !!action.error,
        showSaveToastMessage: true
      };

    case actions.view.CLEAR_SAVE_TOAST:
      return {
        ...state,
        showSaveToastMessage: false
      };

    case actions.view.SET_ACTIVE_PANE:
      return {
        ...state,
        activePane: action.activePane
      };

    case actions.editor.ACCEPT_EDIT_MODAL_CHANGES:
      return {
        ...state,
        isDirty: true,
        measure: action.measure,
        coreView: action.coreView
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

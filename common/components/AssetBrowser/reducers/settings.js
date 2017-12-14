import _ from 'lodash';
import * as actions from '../actions/settings';

export default (state = getInitialState(), action) => {
  switch (action.type) {
    case actions.FETCH_SETTINGS_SUCCESS:
      return {
        ...state,
        ...parseSettings(action.settings)
      };
    case actions.TOGGLE_REAPPROVAL:
      return {
        ...state,
        reapprovalPolicy: toggleReapproval(state.reapprovalPolicy)
      };
    case actions.UPDATE_TASK_PRESET_STATE:
      return {
        ...state,
        ...updatePresetStates(state, action)
      };
    default:
      return state;
  }
};

// HELPERS
const updatePresetStates = (currentState, action) => ({
  presetStates: {
    ...currentState.presetStates,
    [action.taskScope]: action.newPresetState
  }
});

const getInitialState = () => ({
  approvers: window.socrata.initialState.approvers
});

const parseSettings = (settings) => {
  const workflow = settings[0];
  const tasks = workflow.steps[0].tasks;

  // { <scope>: <presetState>, ... }, e.g. { 'official': 'pending' }
  const presetStates = tasks.reduce(
    (myNew, task) => Object.assign({}, myNew, { [task.scope]: task.presetState }),
    {}
  );

  return {
    reapprovalPolicy: workflow.reapprovalPolicy,
    presetStates
  };
};

const toggleReapproval = (currentReapprovalPolicy) => {
  // TODO: hard-coded
  const auto = 'auto';
  const manual = 'manual';

  return currentReapprovalPolicy == auto ? manual : auto;
};

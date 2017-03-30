import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';

/**
 * @class GoalTitleStore
 * @description
 * Handles the various checkpoints of updating a goal's
 * title. See GoalTitleProvider for more information.
 */
export var goalTitleStore = new GoalTitleStore();
export default function GoalTitleStore() {
  _.extend(this, new Store());

  const self = this;
  const state = {
    started: false,
    error: false
  };

  self.register((payload) => {
    switch (payload.action) {
      case Actions.GOAL_TITLE_SAVE_START:
        saveStarted();
        break;
      case Actions.GOAL_TITLE_SAVE_FINISH:
        saveFinished();
        break;
      case Actions.GOAL_TITLE_SAVE_ERROR:
        saveErrored();
        break;
    }
  });

  self.isUpdatingGoalTitle = () => state.started;
  self.hasErroredUpdatingGoalTitle = () => state.error;

  function saveStarted() {
    state.started = true;
    state.error = false;

    self._emitChange();
  }

  function saveFinished() {
    state.started = false;
    state.error = false;

    self._emitChange();
  }

  function saveErrored() {
    state.started = false;
    state.error = true;

    self._emitChange();
  }
}

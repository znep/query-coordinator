import _ from 'lodash';

import Store from './Store';
import Actions from '../Actions';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';

export var goalMigrationStore = new GoalMigrationStore();
export default function GoalMigrationStore() {
  _.extend(this, new Store());
  const self = this;

  const state = {
    isMigrating: false,
    error: null
  };

  self.register(function(payload) {
    switch (payload.action) {
      case Actions.GOAL_MIGRATION_START:
        startMigration();
        break;
      case Actions.GOAL_MIGRATION_END:
        endMigration();
        break;
      case Actions.GOAL_MIGRATION_ERROR:
        errorMigration(payload.error);
        break;
    }
  });

  // Returns true if the narrative migration needs to be run.
  self.needsMigration = () =>
    Environment.OP_GOAL_NARRATIVE_MIGRATION_METADATA && (
      StorytellerUtils.queryParameterMatches('redoGoalMigration', true) ||
      Environment.STORY_DATA.digest === null // Never saved
    );

  // Returns true if the narrative migration needs an overlay (should be false
  // for goals that are brand new).
  self.needsOverlay = () =>
    Environment.OP_GOAL_IS_CONFIGURED || !_.isEmpty(_.get(Environment.OP_GOAL_NARRATIVE_MIGRATION_METADATA, 'narrative'));

  self.isMigrating = () => state.isMigrating;
  self.hasError = () => state.error !== null;
  self.error = () => state.error;

  function startMigration() {
    state.isMigrating = true;
    state.error = null;
    self._emitChange();
  }

  function endMigration() {
    // Ensure that we spend a non-trivial duration in isMigrating=true state.
    _.delay(() => {
      state.isMigrating = false;
      state.error = null;
      self._emitChange();
    }, 2000);
  }

  function errorMigration(payloadError) {
    // Better to fail fast in this case.
    state.isMigrating = false;
    state.error = payloadError;
    self._emitChange();
  }
}

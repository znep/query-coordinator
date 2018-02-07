import { expect } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import GoalTitleStore from 'editor/stores/GoalTitleStore';

describe('GoalTitleStore', () => {
  let dispatcher;
  let goalTitleStore;

  const rewires = () => {
    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);
  };

  const resets = () => {
    StoreAPI.__ResetDependency__('dispatcher');
  };

  beforeEach(() => {
    rewires();
    goalTitleStore = new GoalTitleStore();
  });

  afterEach(() => {
    resets();
  });

  describe('GOAL_TITLE_SAVE_START', () => {
    beforeEach(() => {
      dispatcher.dispatch({ action: Actions.GOAL_TITLE_SAVE_START });
    });

    it('sets isUpdatingGoalTitle to true', () => {
      expect(goalTitleStore.isUpdatingGoalTitle()).to.equal(true);
    });

    it('sets hasErroredUpdatingGoalTitle to false', () => {
      expect(goalTitleStore.hasErroredUpdatingGoalTitle()).to.equal(false);
    });
  });

  describe('GOAL_TITLE_SAVE_FINISH', () => {
    beforeEach(() => {
      dispatcher.dispatch({ action: Actions.GOAL_TITLE_SAVE_FINISH });
    });

    it('sets isUpdatingGoalTitle to false', () => {
      expect(goalTitleStore.isUpdatingGoalTitle()).to.equal(false);
    });

    it('sets hasErroredUpdatingGoalTitle to false', () => {
      expect(goalTitleStore.hasErroredUpdatingGoalTitle()).to.equal(false);
    });
  });

  describe('GOAL_TITLE_SAVE_ERROR', () => {
    beforeEach(() => {
      dispatcher.dispatch({ action: Actions.GOAL_TITLE_SAVE_ERROR });
    });

    it('sets isUpdatingGoalTitle to false', () => {
      expect(goalTitleStore.isUpdatingGoalTitle()).to.equal(false);
    });

    it('sets hasErroredUpdatingGoalTitle to true', () => {
      expect(goalTitleStore.hasErroredUpdatingGoalTitle()).to.equal(true);
    });
  });
});

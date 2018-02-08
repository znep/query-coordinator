import sinon from 'sinon';
import { assert } from 'chai';

import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import GoalMigrationStore, {__RewireAPI__ as GoalMigrationStoreAPI} from 'editor/stores/GoalMigrationStore';

describe('GoalMigrationStore', () => {

  let goalMigrationStore;
  let environment;
  let redoGoalMigration;
  let dispatcher;

  const storytellerUtilsMock = {
    queryParameterMatches: (paramName) => {
      if (paramName !== 'redoGoalMigration') {
        throw new Error(`unexpected param: ${paramName}`);
      }
      return redoGoalMigration;
    }
  };

  beforeEach(() => {
    environment = {
      STORY_DATA: {
        blocks: 'foo',
        digest: null
      }
    };
    redoGoalMigration = false;

    dispatcher = new Dispatcher();
    StoreAPI.__Rewire__('dispatcher', dispatcher);
    GoalMigrationStoreAPI.__Rewire__('Environment', environment);
    GoalMigrationStoreAPI.__Rewire__('StorytellerUtils', storytellerUtilsMock);

    goalMigrationStore = new GoalMigrationStore();
  });

  afterEach(() => {
    StoreAPI.__ResetDependency__('dispatcher');
    GoalMigrationStoreAPI.__ResetDependency__('Environment');
    GoalMigrationStoreAPI.__ResetDependency__('StorytellerUtils');
  });

  function noMigrationData(fn) {
    describe('no story migration data present', fn);
  }

  function withMigrationData(data, fn) {
    describe('with story migration data present', () => {
      beforeEach(() => {
        environment.OP_GOAL_NARRATIVE_MIGRATION_METADATA = data;
      });
      fn();
    });
  }

  function noConfiguredMeasure(fn) {
    describe('no configured measure present', fn);
  }

  function withConfiguredMeasure(fn) {
    describe('with configured measure present', () => {
      beforeEach(() => {
        environment.OP_GOAL_IS_CONFIGURED = true;
      });
      fn();
    });
  }

  function noStoryDigest(fn) {
    describe('no story digest present', fn);
  }

  function withStoryDigest(fn) {
    describe('with story digest present', () => {
      beforeEach(() => {
        environment.STORY_DATA.digest = 'digest';
      });
      fn();
    });
  }

  function redoMigrationNotSet(fn) {
    describe('redoGoalMigration not set', fn);
  }

  function redoMigrationSet(fn) {
    describe('redoGoalMigration set', () => {
      beforeEach(() => {
        redoGoalMigration = true;
      });
      fn();
    });
  }

  describe('needsMigration', () => {

    function expectFalse() {
      it('returns false', () => {
        assert.isNotOk(goalMigrationStore.needsMigration());
      });
    }

    function expectTrue() {
      it('returns true', () => {
        assert.isOk(goalMigrationStore.needsMigration());
      });
    }

    const migrationData = { narrative: [{ stu: 'ff' }] };

    noMigrationData(() => {
      noStoryDigest(() => {
        redoMigrationNotSet(expectFalse);
        redoMigrationSet(expectFalse);
      });
      withStoryDigest(() => {
        redoMigrationNotSet(expectFalse);
        redoMigrationSet(expectFalse);
      });
    });

    withMigrationData(migrationData, () => {
      noStoryDigest(() => {
        redoMigrationNotSet(expectTrue);
        redoMigrationSet(expectTrue);
      });
      withStoryDigest(() => {
        redoMigrationNotSet(expectFalse);
        redoMigrationSet(expectTrue);
      });
    });
  });

  describe('needsOverlay', () => {

    function expectFalse() {
      it('returns false', () => {
        assert.isNotOk(goalMigrationStore.needsOverlay());
      });
    }

    function expectTrue() {
      it('returns true', () => {
        assert.isOk(goalMigrationStore.needsOverlay());
      });
    }

    const emptyNarrative = { narrative: [] };
    const configuredNarrative = { narrative: [{ stu: 'ff' }] };

    withMigrationData(emptyNarrative, () => {
      noConfiguredMeasure(expectFalse);
      withConfiguredMeasure(expectTrue);
    });
    withMigrationData(configuredNarrative, () => {
      noConfiguredMeasure(expectTrue);
      withConfiguredMeasure(expectTrue);
    });
  });

  describe('isMigrating', () => {
    it('becomes true while migrating and becomes false on complete', () => {
      const delayStub = sinon.stub(window._, 'delay').callsFake((fn) => fn());

      assert.isFalse(goalMigrationStore.isMigrating());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      assert.isTrue(goalMigrationStore.isMigrating());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_END });
      assert.isFalse(goalMigrationStore.isMigrating());

      delayStub.restore();
    });

    it('becomes false on error', () => {
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_ERROR });
      assert.isFalse(goalMigrationStore.isMigrating());
    });
  });

  describe('hasError and error', () => {
    it('remains false and null during normal migration', () => {
      assert.isFalse(goalMigrationStore.hasError());
      assert.isNull(goalMigrationStore.error());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      assert.isFalse(goalMigrationStore.hasError());
      assert.isNull(goalMigrationStore.error());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_END });
      assert.isFalse(goalMigrationStore.hasError());
      assert.isNull(goalMigrationStore.error());
    });

    it('reports errors', () => {
      const theError = new Error('sup');
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_ERROR, error: theError });
      assert.isTrue(goalMigrationStore.hasError());
      assert.equal(goalMigrationStore.error(), theError);
    });
  });
});

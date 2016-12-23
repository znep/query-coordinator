import Actions from 'editor/Actions';
import Dispatcher from 'editor/Dispatcher';
import {__RewireAPI__ as StoreAPI} from 'editor/stores/Store';
import GoalMigrationStore, {__RewireAPI__ as GoalMigrationStoreAPI} from 'editor/stores/GoalMigrationStore';

describe('GoalMigrationStore', function() {

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

  beforeEach(function() {
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

  afterEach(function() {
    StoreAPI.__ResetDependency__('dispatcher');
    GoalMigrationStoreAPI.__ResetDependency__('Environment');
    GoalMigrationStoreAPI.__ResetDependency__('StorytellerUtils');
  });

  function noMigrationData(fn) {
    describe('no story migration data present', fn);
  }

  function withMigrationData(fn) {
    describe('with story migration data present', function() {
      beforeEach(function() {
        environment.OP_GOAL_NARRATIVE_MIGRATION_METADATA = { stu: 'ff' };
      });
      fn();
    });
  }

  function noStoryDigest(fn) {
    describe('no story digest present', fn);
  }

  function withStoryDigest(fn) {
    describe('with story digest present', function() {
      beforeEach(function() {
        environment.STORY_DATA.digest = 'digest';
      });
      fn();
    });
  }

  function redoMigrationNotSet(fn) {
    describe('redoGoalMigration not set', fn);
  }

  function redoMigrationSet(fn) {
    describe('redoGoalMigration set', function() {
      beforeEach(function() {
        redoGoalMigration = true;
      });
      fn();
    });
  }

  describe('needsMigration', function() {

    function expectFalse() {
      it('returns false', function() {
        assert.isNotOk(goalMigrationStore.needsMigration());
      });
    }

    function expectTrue() {
      it('returns true', function() {
        assert.isOk(goalMigrationStore.needsMigration());
      });
    }

    noMigrationData(function() {
      noStoryDigest(function() {
        redoMigrationNotSet(function() {
          expectFalse();
        });
        redoMigrationSet(function() {
          expectFalse();
        });
      });
      withStoryDigest(function() {
        redoMigrationNotSet(function() {
          expectFalse();
        });
        redoMigrationSet(function() {
          expectFalse();
        });
      });
    });

    withMigrationData(function() {
      noStoryDigest(function() {
        redoMigrationNotSet(function() {
          expectTrue();
        });
        redoMigrationSet(function() {
          expectTrue();
        });
      });
      withStoryDigest(function() {
        redoMigrationNotSet(function() {
          expectFalse();
        });
        redoMigrationSet(function() {
          expectTrue();
        });
      });
    });
  });

  describe('isMigrating', function() {
    it('becomes true while migrating and becomes false on complete', function() {
      const delayStub = sinon.stub(window._, 'delay', (fn) => fn());

      assert.isFalse(goalMigrationStore.isMigrating());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      assert.isTrue(goalMigrationStore.isMigrating());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_END });
      assert.isFalse(goalMigrationStore.isMigrating());

      delayStub.restore();
    });

    it('becomes false on error', function() {
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_ERROR });
      assert.isFalse(goalMigrationStore.isMigrating());
    });
  });

  describe('hasError and error', function() {
    it('remains false and null during normal migration', function() {
      assert.isFalse(goalMigrationStore.hasError());
      assert.isNull(goalMigrationStore.error());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      assert.isFalse(goalMigrationStore.hasError());
      assert.isNull(goalMigrationStore.error());
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_END });
      assert.isFalse(goalMigrationStore.hasError());
      assert.isNull(goalMigrationStore.error());
    });

    it('reports errors', function() {
      const theError = new Error('sup');
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_START });
      dispatcher.dispatch({ action: Actions.GOAL_MIGRATION_ERROR, error: theError });
      assert.isTrue(goalMigrationStore.hasError());
      assert.equal(goalMigrationStore.error(), theError);
    });
  });
});

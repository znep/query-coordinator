import { assert } from 'chai';
import * as BulkEditActions from 'sections/goals/actions/bulkEdit';
import * as SharedActions from 'sections/shared/actions';
import Immutable from 'immutable';

import reducer from 'sections/goals/reducers/bulkEdit';
describe('bulkEdit reducer', () => {
  const reduce = (action, state) => reducer(Immutable.fromJS(state), action).toJS();
  const reduceAction = (type, data, state) => reduce({
    type: BulkEditActions.types[type],
    data
  }, state);

  const afterSaveStart = reduceAction(
    'saveStart',
    5
  );

  const afterSaveProgressSuccess = reduceAction(
    'saveProgressSuccess'
  );

  const afterSaveProgressErrorNoGoal = reduceAction(
    'saveProgressError'
  );

  const afterSaveProgressErrorWithGoal = reduceAction(
    'saveProgressError',
    { mock: 'goal' }
  );

  const afterSomeErrorsAndSomeSuccess =
    reduceAction(
      'saveFinished',
      null,
      reduceAction('saveProgressSuccess', null, afterSaveProgressErrorWithGoal)
    );

  describe('setPublishingAction', () => {
    it('can set to true', () => {
      assert.propertyVal(
        reduceAction('setPublishingAction', true),
        'publishingAction',
        true
      );
    });
    it('can set to false', () => {
      assert.propertyVal(
        reduceAction('setPublishingAction', false),
        'publishingAction',
        false
      );
    });
  });

  describe('saveStart', () => {
    it('sets saveInProgress', () => {
      assert.deepPropertyVal(afterSaveStart, 'saveStatus.inProgress', true);
    });
    it('sets taskTotalCount', () => {
      assert.deepPropertyVal(afterSaveStart, 'saveStatus.taskTotalCount', 5);
    });
    it('sets taskCompletedCount', () => {
      assert.deepPropertyVal(afterSaveStart, 'saveStatus.taskCompletedCount', 0);
    });
    it('unsets error', () => {
      assert.deepPropertyVal(afterSaveStart, 'saveStatus.error', false);
    });
  });

  describe('saveProgressSuccess', () => {
    it('increments taskCompletedCount', () => {
      assert.deepPropertyVal(afterSaveProgressSuccess, 'saveStatus.taskCompletedCount', 1);
    });
  });

  describe('saveProgressError with goal', () => {
    it('increments taskCompletedCount', () => {
      assert.deepPropertyVal(afterSaveProgressErrorWithGoal, 'saveStatus.taskCompletedCount', 1);
    });
    it('pushes goal onto list of failed goals', () => {
      assert.deepPropertyVal(afterSaveProgressErrorWithGoal, 'saveStatus.failedGoals[0].mock', 'goal');
    });
    it('sets error', () => {
      assert.deepPropertyVal(afterSaveProgressErrorWithGoal, 'saveStatus.error', true);
    });
  });

  describe('saveProgressError without  goal', () => {
    it('leaves taskCompletedCount alone', () => {
      assert.deepPropertyVal(afterSaveProgressErrorNoGoal, 'saveStatus.taskCompletedCount', 0);
    });
    it('leaves list of failed goals alone', () => {
      assert.lengthOf(afterSaveProgressErrorNoGoal.saveStatus.failedGoals, 0);
    });
    it('sets error', () => {
      assert.deepPropertyVal(afterSaveProgressErrorNoGoal, 'saveStatus.error', true);
    });
  });

  describe('saveFinished', () => {
    it('leaves taskCompletedCount alone', () => {
      assert.deepPropertyVal(afterSomeErrorsAndSomeSuccess, 'saveStatus.taskCompletedCount', 2);
    });
    it('leaves list of failed goals alone', () => {
      assert.lengthOf(afterSomeErrorsAndSomeSuccess.saveStatus.failedGoals, 1);
    });
    it('leaves error alone', () => {
      assert.deepPropertyVal(afterSomeErrorsAndSomeSuccess, 'saveStatus.error', true);
    });
    it('unsets saveInProgress', () => {
      assert.deepPropertyVal(afterSomeErrorsAndSomeSuccess, 'saveStatus.inProgress', false);
    });

  });
});

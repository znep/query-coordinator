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
      assert.deepNestedPropertyVal(afterSaveStart, 'saveStatus.inProgress', true);
    });
    it('sets taskTotalCount', () => {
      assert.deepNestedPropertyVal(afterSaveStart, 'saveStatus.taskTotalCount', 5);
    });
    it('sets taskCompletedCount', () => {
      assert.deepNestedPropertyVal(afterSaveStart, 'saveStatus.taskCompletedCount', 0);
    });
    it('unsets error', () => {
      assert.deepNestedPropertyVal(afterSaveStart, 'saveStatus.error', false);
    });
  });

  describe('saveProgressSuccess', () => {
    it('increments taskCompletedCount', () => {
      assert.deepNestedPropertyVal(afterSaveProgressSuccess, 'saveStatus.taskCompletedCount', 1);
    });
  });

  describe('saveProgressError with goal', () => {
    it('increments taskCompletedCount', () => {
      assert.deepNestedPropertyVal(afterSaveProgressErrorWithGoal, 'saveStatus.taskCompletedCount', 1);
    });
    it('pushes goal onto list of failed goals', () => {
      assert.deepNestedPropertyVal(afterSaveProgressErrorWithGoal, 'saveStatus.failedGoals[0].mock', 'goal');
    });
    it('sets error', () => {
      assert.deepNestedPropertyVal(afterSaveProgressErrorWithGoal, 'saveStatus.error', true);
    });
  });

  describe('saveProgressError without  goal', () => {
    it('leaves taskCompletedCount alone', () => {
      assert.deepNestedPropertyVal(afterSaveProgressErrorNoGoal, 'saveStatus.taskCompletedCount', 0);
    });
    it('leaves list of failed goals alone', () => {
      assert.lengthOf(afterSaveProgressErrorNoGoal.saveStatus.failedGoals, 0);
    });
    it('sets error', () => {
      assert.deepNestedPropertyVal(afterSaveProgressErrorNoGoal, 'saveStatus.error', true);
    });
  });

  describe('saveFinished', () => {
    it('leaves taskCompletedCount alone', () => {
      assert.deepNestedPropertyVal(afterSomeErrorsAndSomeSuccess, 'saveStatus.taskCompletedCount', 2);
    });
    it('leaves list of failed goals alone', () => {
      assert.lengthOf(afterSomeErrorsAndSomeSuccess.saveStatus.failedGoals, 1);
    });
    it('leaves error alone', () => {
      assert.deepNestedPropertyVal(afterSomeErrorsAndSomeSuccess, 'saveStatus.error', true);
    });
    it('unsets saveInProgress', () => {
      assert.deepNestedPropertyVal(afterSomeErrorsAndSomeSuccess, 'saveStatus.inProgress', false);
    });
  });
});

import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import mockGoals from '../data/cachedGoals';

import {
  openGoalQuickEdit,
  dismissModal,
  testEdit,
  saveGoalQuickEdit
} from 'actions/quickEditActions';

import {
  OPEN_GOAL_QUICK_EDIT,
  CLOSE_GOAL_QUICK_EDIT,
  REMOVE_GOAL_FROM_CACHE
} from 'actionTypes';

describe('actions/quickEditActions', () => {
  let server;
  const mockStore = configureStore([thunk]);

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore();
  });

  it('openGoalQuickEdit should send goalId to reducer', () => {
    let goalId = 'xxxx-xxxx';
    var returnValue = openGoalQuickEdit(goalId);
    expect(returnValue).to.deep.eq({ type: OPEN_GOAL_QUICK_EDIT, goalId });
  });

  it('closeGoalQuickEdit should send goalId to reducer', () => {
    var returnValue = dismissModal();
    expect(returnValue).to.deep.eq({ type: CLOSE_GOAL_QUICK_EDIT });
  });

  it('saveGoalQuickEdit update goal', done => {
    server.respondWith(xhr => {
      xhr.respond(200, null, JSON.stringify({ version: 'YYYY-MM-DDTHH:MM:SS.SSS+00:00' }));
    });

    const goalId = 'vefh-4ihb';
    const state = {
      goalTableData: {
        cachedGoals: mockGoals
      },
      quickEditForm: {
        goalId: goalId,
        showFailureMessage: false,
        initialFormData: {},
        formData: {}
      }
    };
    const store = mockStore(Immutable.fromJS(state));

    return store.dispatch(saveGoalQuickEdit()).then(() => {
      var executedActions = store.getActions();

      var closeGoalQuickEditAction = _.find(executedActions, {type: CLOSE_GOAL_QUICK_EDIT});
      expect(closeGoalQuickEditAction).to.not.eq(undefined);

      var removeFromCacheAction = _.find(executedActions, {type: REMOVE_GOAL_FROM_CACHE});
      expect(removeFromCacheAction).to.not.eq(undefined);
      expect(removeFromCacheAction.goalId).to.eq(goalId);

      done();
    });
  });
});

import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import mockGoalsById from '../../../data/cachedGoals';
import mockedTranslations from '../../../mockTranslations';

import * as Actions from 'sections/goals/actions/quickEdit';
import * as DataActions from 'sections/goals/actions/data';

const mockGoals = Immutable.fromJS(mockGoalsById).valueSeq().toList().toJS();

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
    var returnValue = Actions.openModal(goalId);
    expect(returnValue.type).to.eq(Actions.types.openModal);
    expect(returnValue.goalId).to.eq(goalId);
  });

  it('closeGoalQuickEdit should send goalId to reducer', () => {
    var returnValue = Actions.closeModal();
    expect(returnValue).to.deep.eq({ type: Actions.types.closeModal });
  });

  it('saveGoalQuickEdit update goal', done => {
      server.respondWith(xhr => {
        xhr.respond(200, null, JSON.stringify({ version: 'YYYY-MM-DDTHH:MM:SS.SSS+00:00' }));
      });

    const goalId = 'vefh-4ihb';
    const state = {
      translations: mockedTranslations,
      goals: {
        data: mockGoals,
        quickEdit: {
          goalId: goalId,
          message: {
            visible: false
          },
          initialFormData: {},
          formData: {}

        }
      }
    };

    const store = mockStore(Immutable.fromJS(state));

    return store.dispatch(Actions.save()).then(() => {
      var executedActions = store.getActions();

      var closeGoalQuickEditAction = _.find(executedActions, { type: Actions.types.closeModal });
      expect(closeGoalQuickEditAction).to.not.eq(undefined);

      var updateGoalAction = _.find(executedActions, { type: DataActions.types.updateById });
      expect(updateGoalAction).to.not.eq(undefined);
      expect(updateGoalAction.goalId).to.eq(goalId);

      done();
    }).catch(done.fail);
  });
});

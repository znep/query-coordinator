import moment from 'moment';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

import mockTranslations from '../../../mockTranslations';

import * as Actions from 'sections/goals/actions';
import * as SharedActions from 'sections/shared/actions';

const START_TIME = moment.utc().toISOString();

const GOALS = [
  { id: 'a', is_public: false, start: moment.utc().add(1, 'day').toISOString(), prevailing_measure: {} },
  { id: 'b', is_public: true, start: moment.utc().toISOString(), prevailing_measure: {} }
];

const mockStore = configureStore([thunk]);
const initialState = Immutable.fromJS({
  translations: mockTranslations,
  goals: {
    data: GOALS,
    bulkEdit: {
      visible: false,
      updateInProgress: false,
      message: {visible: false},
      goal: {}
    }
  }
});


describe('actions/bulkEditActions', () => {
  let store;
  let server;

  beforeEach(() => {
    store = mockStore(initialState);
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(() => {
    server.restore()
  });

  it('updateMultipleGoals should update given goals', (done) => {
    server.respondWith(/goals/, JSON.stringify({ is_public: true, prevailing_measure: { start: START_TIME } }));
    server.respondWith(/goals/, JSON.stringify({ is_public: true, prevailing_measure: { start: START_TIME } }));

    store.dispatch(Actions.BulkEdit.saveGoals(GOALS.map(goal => Immutable.fromJS(goal)), { is_public: true })).then(() => {
      const [ doSideEffect, startInProgress, updateGoals, closeModal ] = store.getActions();

      expect(startInProgress.type).to.eq(SharedActions.types.setModalInProgress);
      expect(updateGoals.type).to.eq(Actions.Data.types.updateAll);
      expect(closeModal.type).to.eq(Actions.BulkEdit.types.closeModal);

      expect(startInProgress.inProgress).to.eq(true);

      expect(updateGoals.goals[0].is_public).to.eq(true);
      expect(updateGoals.goals[1].is_public).to.eq(true);

      expect(updateGoals.goals[0].prevailing_measure.start).to.eq(START_TIME);
      expect(updateGoals.goals[1].prevailing_measure.start).to.eq(START_TIME);

      done();
    }).catch(done.fail);
  });

  it('should dispatch failure action when something went wrong', (done) => {
    server.respondWith(xhr => {
      xhr.respond();
    });

    store.dispatch(Actions.BulkEdit.saveGoals(GOALS.map(goal => Immutable.fromJS(goal)), { is_public: true })).then(() => {
      const [doSideEffect, started, failed] = store.getActions();

      expect(failed.type).to.eq(SharedActions.types.showModalMessage);
      done();
    }).catch(done);
  });

  it('should dispatch a warning message if not all the items have prevailing_measure data', () => {
    const goals = GOALS.concat([{ id: 'not_configured' }]);

    store.dispatch(Actions.BulkEdit.saveGoals(goals.map(goal => Immutable.fromJS(goal))), {});
    const [doSideEffect, notConfigured] = store.getActions();

    expect(notConfigured.type).to.eq(SharedActions.types.showModalMessage);
  });
});

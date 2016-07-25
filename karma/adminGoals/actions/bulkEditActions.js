import _ from 'lodash';
import moment from 'moment';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

import {
  updateMultipleGoals
} from 'actions/bulkEditActions';

import {
  UPDATE_MULTIPLE_ITEMS_STARTED,
  UPDATE_MULTIPLE_ITEMS_SUCCESS,
  UPDATE_MULTIPLE_ITEMS_FAILED,
  CACHED_GOALS_UPDATED
} from 'actionTypes'

const START_TIME = moment.utc().toISOString();

const GOALS = [
  { id: 'a', is_public: false, start: moment.utc().add(1, 'day').toISOString() },
  { id: 'b', is_public: true,  start: moment.utc().toISOString() }
];

const mockStore = configureStore([thunk]);
const initialState = Immutable.fromJS({
  goalTableData: {
    goals: GOALS
  },

  editMultipleItemsForm: {
    visible: false,
    updateInProgress: false,
    showFailureMessage: false,
    goal: {}
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

    store.dispatch(updateMultipleGoals(GOALS.map(goal => Immutable.fromJS(goal)), { is_public: true })).then(() => {
      const [ started, updateGoals, succeeded ] = store.getActions();

      expect(started.type).to.eq(UPDATE_MULTIPLE_ITEMS_STARTED);
      expect(updateGoals.type).to.eq(CACHED_GOALS_UPDATED);
      expect(succeeded.type).to.eq(UPDATE_MULTIPLE_ITEMS_SUCCESS);

      expect(started.goalIds[0]).to.eq('a');
      expect(started.goalIds[1]).to.eq('b');

      expect(updateGoals.goals[0].is_public).to.eq(true);
      expect(updateGoals.goals[1].is_public).to.eq(true);

      expect(updateGoals.goals[0].prevailing_measure.start).to.eq(START_TIME);
      expect(updateGoals.goals[1].prevailing_measure.start).to.eq(START_TIME);

      expect(succeeded.goalIds.length).to.eq(2);
      done();
    }).catch(done);
  });

  it('should dispatch failure action when something went wrong', function (done) {
    server.respondWith(xhr => {
      xhr.respond();
    });

    store.dispatch(updateMultipleGoals(GOALS.map(goal => Immutable.fromJS(goal)), { is_public: true })).then(() => {
      const [started, failed] = store.getActions();

      expect(failed.type).to.eq(UPDATE_MULTIPLE_ITEMS_FAILED);
      done();
    }).catch(done);
  });
});

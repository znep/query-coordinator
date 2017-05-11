import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { createUpload } from 'actions/manageUploads';
import mockPhoenixSocket from '../testHelpers/mockPhoenixSocket';
import mockAPI from '../testHelpers/mockAPI/routes';
import initialState from '../data/baseState';
import * as dsmapiLinks from 'dsmapiLinks';

const mockStore = configureStore([thunk]);

describe('actions/manageUploads', () => {

  describe('actions/manageUploads/createUpload', () => {
    let unmock;

    beforeEach(() => {
      unmock = mockAPI();
    });

    afterEach(() => {
      unmock();
    });

    it('dispatches UPSERT_STARTED action with the filename', done => {
      const store = mockStore(initialState);

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const actions = store.getActions();
          assert.equal(actions[0].type, 'UPSERT_STARTED');
          assert.equal(actions[0].newRecord.filename, 'petty_crimes.csv');

          done();
        });
    });

    it('redirects to ShowOutputSchema preview on successful upload creation', done => {
      const store = mockStore(initialState);

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const actions = store.getActions();

          const redirectAction = actions.filter(action =>
            action.type === '@@router/CALL_HISTORY_METHOD')[0];

          const {payload: redirectPayload} = redirectAction;

          assert.isAtLeast(actions.filter(action => action.type === 'UPSERT_SUCCEEDED').length, 1);
          assert.equal(redirectPayload.method, 'push');
          assert.match(redirectPayload.args[0], /\/dataset\/[a-zA-Z]+\/\w+-\w+\/revisions\/\d\/uploads\/\d+/);

          done();
        });
    });

    it('kicks off an update to the uploads table', done => {
      const store = mockStore(initialState);

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const actions = store.getActions();

          const expectedAction = actions.filter(action =>
            action.type === 'UPDATE_STARTED' && action.tableName === 'uploads');

          assert.isAtLeast(expectedAction.length, 1);

          done();
        });
    });
  });
});

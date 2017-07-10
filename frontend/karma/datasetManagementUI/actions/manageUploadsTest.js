import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import { createUpload } from 'actions/manageUploads';
import mockPhoenixSocket from '../testHelpers/mockPhoenixSocket';
import mockAPI from '../testHelpers/mockAPI';
import * as dsmapiLinks from 'dsmapiLinks';
import wsmock from '../testHelpers/mockSocket';
import rootReducer from 'reducers/rootReducer';
import { bootstrapApp } from 'actions/bootstrap';
import { setFourfour, addLocation } from 'actions/routing';

const mockStore = configureStore([thunk]);

describe('actions/manageUploads', () => {
  describe('actions/manageUploads/createUpload', () => {
    let unmock;
    let unmockWS;
    let store;

    before(() => {
      unmock = mockAPI();
      unmockWS = wsmock();
    });

    after(() => {
      unmock();
      unmockWS.stop();
    });

    beforeEach(() => {
      store = createStore(rootReducer, applyMiddleware(thunk));
      store.dispatch(
        bootstrapApp(
          window.initialState.view,
          window.initialState.revision,
          window.initialState.customMetadataFieldsets
        )
      );

      store.dispatch(
        setFourfour(Object.keys(store.getState().entities.views)[0])
      );

      store.dispatch(
        addLocation({
          locationBeforeTransitions: {
            pathname:
              '/dataset/lklkhkjhg/ky4m-3w3d/revisions/0/uploads/114/schemas/97/output/143',
            search: '',
            hash: '',
            action: 'PUSH',
            key: 'lb01bi',
            query: {}
          }
        })
      );
    });

    it('dispatches API_CALL_STARTED action with the filename', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.equal(actions[0].type, 'API_CALL_STARTED');
          assert.equal(actions[0].params.filename, 'petty_crimes.csv');

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('redirects to ShowOutputSchema preview on successful upload creation', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => {
          const actions = fakeStore.getActions();

          const redirectAction = actions.filter(
            action => action.type === '@@router/CALL_HISTORY_METHOD'
          )[0];

          const { payload: redirectPayload } = redirectAction;

          assert.isAtLeast(
            actions.filter(action => action.type === 'API_CALL_SUCCEEDED')
              .length,
            1
          );
          assert.equal(redirectPayload.method, 'push');
          assert.match(redirectPayload.args[0], /\/uploads/);

          done();
        })
        .catch(err => done(err));
    });

    it('dispatches a CREATE_UPLOAD_SUCCESS action with the correct uploadId', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => {
          const actions = fakeStore.getActions();
          const expectedAction = actions.filter(
            action =>
              action.type === 'CREATE_UPLOAD_SUCCESS' && action.id === 823
          );

          assert.isAtLeast(expectedAction.length, 1);

          done();
        })
        .catch(err => done(err));
    });
  });
});

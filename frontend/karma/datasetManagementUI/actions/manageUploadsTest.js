import { assert } from 'chai';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import { createUpload } from 'actions/manageUploads';
import mockAPI from '../testHelpers/mockAPI';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import rootReducer from 'reducers/rootReducer';
import { bootstrapApp } from 'actions/bootstrap';
import { setFourfour, addLocation } from 'actions/routing';

const socket = mockSocket(
  bootstrapChannels.map(bc => {
    if (bc.evt === 'insert_input_schema') {
      return {
        ...bc,
        channel: 'source:823'
      };
    } else {
      return bc;
    }
  })
);

const mockStore = configureStore([thunk.withExtraArgument(socket)]);

describe('actions/manageUploads', () => {
  describe('actions/manageUploads/createUpload', () => {
    let unmock;
    let store;

    before(() => {
      unmock = mockAPI();
    });

    after(() => {
      unmock();
    });

    beforeEach(() => {
      store = createStore(
        rootReducer,
        applyMiddleware(thunk.withExtraArgument(socket))
      );
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
              '/dataset/lklkhkjhg/ky4m-3w3d/revisions/0/sources/114/schemas/97/output/143',
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
          assert.equal(
            actions[0].params.source_type.filename,
            'petty_crimes.csv'
          );

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('redirects to ShowOutputSchema preview on successful source creation', done => {
      const fakeStore = mockStore(store.getState());
      const fourfour = Object.keys(store.getState().entities.views)[0];

      fakeStore
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, fourfour))
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
          assert.match(redirectPayload.args[0], /\/sources/);

          done();
        })
        .catch(err => done(err));
    });

    it('dispatches a CREATE_UPLOAD_SUCCESS action with the correct sourceId', done => {
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

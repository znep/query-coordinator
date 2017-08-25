import { assert } from 'chai';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import { createUpload } from 'reduxStuff/actions/manageUploads';
import mockAPI from '../testHelpers/mockAPI';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import { addLocation } from 'reduxStuff/actions/history';
import rootReducer from 'reduxStuff/reducers/rootReducer';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';

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

const params = {
  category: 'dataset',
  name: 'dfsdfdsf',
  fourfour: window.initialState.view.id,
  revisionSeq: '0',
  sourceId: '115',
  inputSchemaId: '98',
  outputSchemaId: '144'
};

describe('manageUploads actions', () => {
  describe('createUpload', () => {
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
        addLocation({
          pathname:
            '/dataset/lklkhkjhg/ky4m-3w3d/revisions/0/sources/114/schemas/97/output/143',
          search: '',
          hash: '',
          action: 'PUSH',
          key: 'lb01bi',
          query: {}
        })
      );
    });

    it('dispatches API_CALL_STARTED action with the filename', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, params))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.equal(actions[0].type, 'API_CALL_STARTED');
          assert.equal(
            actions[0].callParams.source_type.filename,
            'petty_crimes.csv'
          );

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('dispatches a CREATE_UPLOAD_SUCCESS action with the correct sourceId', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, params))
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

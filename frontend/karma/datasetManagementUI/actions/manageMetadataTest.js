import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { applyMiddleware, createStore } from 'redux';
import {
  saveDatasetMetadata,
  saveColumnMetadata
} from 'reduxStuff/actions/manageMetadata';
import {
  API_CALL_STARTED,
  SAVE_DATASET_METADATA
} from 'reduxStuff/actions/apiCalls';
import { SHOW_FLASH_MESSAGE } from 'reduxStuff/actions/flashMessage';
import { createUploadSource } from 'reduxStuff/actions/createSource';
import mockAPI from '../testHelpers/mockAPI';
import rootReducer from 'reduxStuff/reducers/rootReducer';
import { setFormErrors } from 'reduxStuff/actions/forms';
import { addLocation } from 'reduxStuff/actions/history';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import state from '../data/initialState';

// create the mock socket and insert it into the fake store
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

describe('manageMetadata actions', () => {
  let unmock;
  let store;
  let revision;
  let params;

  before(() => {
    unmock = mockAPI();
  });

  after(() => {
    unmock();
  });

  beforeEach(() => {
    store = createStore(
      rootReducer,
      state,
      applyMiddleware(thunk.withExtraArgument(socket))
    );

    store.dispatch(
      addLocation({
        pathname:
          '/dataset/lklkhkjhg/kg5j-unyr/revisions/0/sources/114/schemas/97/output/143',
        search: '',
        hash: '',
        action: 'PUSH',
        key: 'lb01bi',
        query: {}
      })
    );

    revision = _.values(state.entities.revisions)[0];

    params = {
      fourfour: 'kg5j-unyr',
      revisionSeq: '0'
    };
  });

  describe('saveDatasetMetadata', () => {
    it('dispatches an api call started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(saveDatasetMetadata(revision, params))
        .then(() => {
          const action = fakeStore.getActions()[1];

          assert.equal(action.type, API_CALL_STARTED);

          assert.equal(action.operation, SAVE_DATASET_METADATA);

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('dispatches edit view action with correct data if server responded with 200-level status', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(saveDatasetMetadata(revision, params))
        .then(() => {
          const action = fakeStore.getActions()[2];

          assert.equal(action.type, 'EDIT_VIEW');

          assert.equal(action.id, '2ttq-aktm');

          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });

  describe('saveColumnMetadata', () => {
    beforeEach(done => {
      store
        .dispatch(createUploadSource({ name: 'petty_crimes.csv' }, true, params))
        .then(() => done());
    });

    it('dispatches an API_CALL_STARTED started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      const osid = Number(
        Object.keys(store.getState().entities.output_schemas)[0]
      );

      fakeStore
        .dispatch(saveColumnMetadata(osid, params))
        .then(() => {
          const action = fakeStore.getActions()[1];

          assert.equal(action.type, 'API_CALL_STARTED');

          assert.equal(action.operation, 'SAVE_COLUMN_METADATA');

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('dispatches a CREATE_NEW_OUTPUT_SCHEMA_SUCCESS action with correct data if server resonds with 200-level status', done => {
      const fakeStore = mockStore(store.getState());
      const osid = Number(
        Object.keys(store.getState().entities.output_schemas)[0]
      );

      fakeStore
        .dispatch(saveColumnMetadata(osid, params))
        .then(() => {
          const action = fakeStore.getActions()[2];
          assert.equal(action.type, 'CREATE_NEW_OUTPUT_SCHEMA_SUCCESS');
          assert.containsAllKeys(action, ['outputSchema', 'transforms', 'outputColumns', 'outputSchemaColumns'])
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});

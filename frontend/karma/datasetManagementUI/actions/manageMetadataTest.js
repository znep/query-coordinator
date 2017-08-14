import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { applyMiddleware, createStore } from 'redux';
import {
  saveDatasetMetadata,
  saveColumnMetadata
} from 'reduxStuff/actions/manageMetadata';
import { API_CALL_STARTED, SAVE_DATASET_METADATA } from 'reduxStuff/actions/apiCalls';
import { SHOW_FLASH_MESSAGE } from 'reduxStuff/actions/flashMessage';
import { createUpload } from 'reduxStuff/actions/manageUploads';
import mockAPI from '../testHelpers/mockAPI';
import {} from '../testHelpers/mockAPI/responses';
import rootReducer from 'reduxStuff/reducers/rootReducer';
import { bootstrapApp } from 'reduxStuff/actions/bootstrap';
import { editView } from 'reduxStuff/actions/views';
import { addLocation } from 'reduxStuff/actions/history';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';

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

  describe('saveDatasetMetadata', () => {
    it('dispatches an api call started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      const fourfour = window.initialState.view.id;

      fakeStore
        .dispatch(saveDatasetMetadata(fourfour))
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

      const fourfour = window.initialState.view.id;

      fakeStore
        .dispatch(saveDatasetMetadata(fourfour))
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

    it('shows an error message if form schema is invalid', () => {
      const fourfour = window.initialState.view.id;

      store.dispatch(
        editView(fourfour, {
          datasetMetadataErrors: [{ fieldName: 'name', message: 'Is Required' }]
        })
      );

      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveDatasetMetadata(fourfour));

      const action = fakeStore.getActions()[2];

      assert.equal(action.type, SHOW_FLASH_MESSAGE);
      assert.equal(action.kind, 'error');
    });

    it('shows field-level errors if form schema is invalid', () => {
      const fourfour = window.initialState.view.id;

      store.dispatch(
        editView(fourfour, {
          datasetMetadataErrors: [{ fieldName: 'name', message: 'Is Required' }]
        })
      );

      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveDatasetMetadata(fourfour));

      const action = fakeStore.getActions()[1];

      assert.equal(action.type, 'EDIT_VIEW');

      assert.deepEqual(action.payload, {
        showErrors: true
      });
    });
  });

  describe('saveColumnMetadata', () => {
    beforeEach(done => {
      store
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, params))
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

    it('dispatches a LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS action with correct data if server resonds with 200-level status', done => {
      const fakeStore = mockStore(store.getState());

      const osid = Number(
        Object.keys(store.getState().entities.output_schemas)[0]
      );

      fakeStore
        .dispatch(saveColumnMetadata(osid, params))
        .then(() => {
          const action = fakeStore.getActions()[2];

          assert.equal(action.type, 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS');
          assert.isTrue(_.has(action, 'outputSchema'));
          assert.isTrue(_.has(action, 'transforms'));
          assert.isTrue(_.has(action, 'outputColumns'));
          assert.isTrue(_.has(action, 'outputSchemaColumns'));

          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});

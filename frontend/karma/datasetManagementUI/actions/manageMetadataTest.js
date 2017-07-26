import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { applyMiddleware, createStore } from 'redux';
import {
  saveDatasetMetadata,
  saveColumnMetadata
} from 'actions/manageMetadata';
import { API_CALL_STARTED, SAVE_DATASET_METADATA } from 'actions/apiCalls';
import { SHOW_FLASH_MESSAGE } from 'actions/flashMessage';
import { createUpload } from 'actions/manageUploads';
import mockAPI from '../testHelpers/mockAPI';
import rootReducer from 'reducers/rootReducer';
import { bootstrapApp } from 'actions/bootstrap';
import { editView } from 'actions/views';
import { setFourfour, addLocation } from 'actions/routing';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';

// create the mock socket and insert it into the fake store
const socket = mockSocket(bootstrapChannels);

const mockStore = configureStore([thunk.withExtraArgument(socket)]);

describe('actions/manageMetadata', () => {
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

  describe('actions/manageMetadata/saveDatasetMetadata', () => {
    it('dispatches an api call started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(saveDatasetMetadata())
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
        .dispatch(saveDatasetMetadata())
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
      const fourfour = Object.keys(store.getState().entities.views)[0];

      store.dispatch(
        editView(fourfour, {
          datasetMetadataErrors: [{ fieldName: 'name', message: 'Is Required' }]
        })
      );

      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveDatasetMetadata());

      const action = fakeStore.getActions()[2];

      assert.equal(action.type, SHOW_FLASH_MESSAGE);
      assert.equal(action.kind, 'error');
    });

    it('shows field-level errors if form schema is invalid', () => {
      const fourfour = Object.keys(store.getState().entities.views)[0];

      store.dispatch(
        editView(fourfour, {
          datasetMetadataErrors: [{ fieldName: 'name', message: 'Is Required' }]
        })
      );

      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveDatasetMetadata());

      const action = fakeStore.getActions()[1];

      assert.equal(action.type, 'EDIT_VIEW');

      assert.deepEqual(action.payload, {
        showErrors: true
      });
    });
  });

  describe('actions/manageMetadata/saveColumnMetadata', () => {
    beforeEach(done => {
      store
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => done());
    });

    it('dispatches an API_CALL_STARTED started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(saveColumnMetadata())
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

    it('dispatches a POLL_FOR_OUTPUT_SCHEMA_SUCCESS action with correct data if server resonds with 200-level status', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(saveColumnMetadata())
        .then(() => {
          const action = fakeStore.getActions()[2];

          assert.equal(action.type, 'POLL_FOR_OUTPUT_SCHEMA_SUCCESS');
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

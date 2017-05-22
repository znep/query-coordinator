import _ from 'lodash';
import { assert } from 'chai';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { applyMiddleware, createStore } from 'redux';
import { saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import {
  UPSERT_SUCCEEDED,
  UPSERT_STARTED,
  UPSERT_FROM_SERVER,
  UPDATE_STARTED,
  SET_VIEW,
  UPDATE_SUCCEEDED
} from 'actions/database';
import {
  API_CALL_STARTED,
  SAVE_DATASET_METADATA
} from 'actions/apiCalls';
import { PRIVATE_CUSTOM_FIELD_PREFIX, CUSTOM_FIELD_PREFIX } from 'lib/customMetadata';
import { SHOW_FLASH_MESSAGE } from 'actions/flashMessage';
import { createUpload } from 'actions/manageUploads';
import mockAPI from '../testHelpers/mockAPI';
import initialState from '../data/baseState';
import { upsertFromServer, edit } from 'actions/database';
import rootReducer from 'reducers';
import wsmock from '../testHelpers/mockSocket';

const mockStore = configureStore([thunk]);

const metadata = {
  id: 'tw7g-jnvn',
  model: {
    name: 'better description',
    tags: [
      'one',
      'two',
      'three'
    ],
    email: 'test@socrata.com',
  },
  colFormModel: {
    'display-name-18133': 'IDs',
    'description-18133': '',
    'field-name-18133': 'mkkk',
    'display-name-18136': 'Case Number',
    'description-18136': '',
    'field-name-18136': 'case_number'
  },
  colFormIsDirty: {
    fields: [
      'field-name-18136'
    ],
    form: true
  },
  colFormSchema: {
    isValid: true,
    fields: {}
  }
};

describe('actions/manageMetadata', () => {
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
    store = createStore(rootReducer, initialState, applyMiddleware(thunk));

    store.dispatch(upsertFromServer('views', metadata));
  });

  describe('actions/manageMetadata/saveDatasetMetadata', () => {
    it('dispatches an api call started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      const fourfour = Object.keys(store.getState().db.views)[0];

      fakeStore.dispatch(saveDatasetMetadata())
        .then(() => {
          const action = store.getActions()[1];

          assert.equal(action.type, API_CALL_STARTED);

          assert.equal(action.operation, SAVE_DATASET_METADATA);

          done();
        })
        .catch(err => {
          done();
        });
    });

    it('dispatches set view action with correct data if server responded with 200-level status', done => {
      const fakeStore = mockStore(store.getState());

      const fourfour = Object.keys(store.getState().db.views)[0];

      fakeStore.dispatch(saveDatasetMetadata())
        .then(() => {
          const action = store.getActions()[2];

          assert.equal(action.type, SET_VIEW);

          assert.equal(action.id, fourfour);

          assert.deepEqual(action.payload, metadata.model);

          done();
        })
        .catch(err => {
          done();
        });
    });

    it('shows an error message if form schema is invalid', () => {
      const fourfour = Object.keys(store.getState().db.views)[0];

      store.dispatch(edit('views', {
        id: fourfour,
        schema: {
          isValid: false
        }
      }));

      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveDatasetMetadata());

      const action = fakeStore.getActions()[1];

      assert.equal(action.type, SHOW_FLASH_MESSAGE);
      assert.equal(action.kind, 'error');
    });

    it('shows field-level errors if form schema is invalid', () => {
      const fourfour = Object.keys(store.getState().db.views)[0];

      store.dispatch(edit('views', {
        id: fourfour,
        schema: {
          isValid: false
        }
      }));

      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveDatasetMetadata());

      const action = fakeStore.getActions()[2];

      assert.equal(action.type, 'EDIT');
      assert.equal(action.tableName, 'views');
      assert.deepEqual(action.updates, {
        id: fourfour,
        displayMetadataFieldErrors: true
      });
    });
  });

  describe('actions/manageMetadata/saveColumnMetadata', () => {
    beforeEach(done => {
      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => done());
    });

    it('dispatches an insert started action with correct data', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveColumnMetadata())
        .then(() => {
          const action = fakeStore.getActions()[1].operations[1];

          assert.equal(action.type, UPSERT_STARTED);

          assert.equal(action.tableName, 'output_schemas');

          done();
        })
        .catch(err => {
          done();
        });
    });

it('dispatches an insert succeeded action with correct data if server resonds with 200-level status', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveColumnMetadata())
        .then(() => {
          const action = fakeStore.getActions()[3];

          assert.equal(action.type, UPSERT_SUCCEEDED);

          assert.equal(action.tableName, 'output_schemas');

          done();
        })
        .catch(err => {
          done();
        });
    });

    it('updates output_schema_columns if insert succeeded', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveColumnMetadata())
        .then(() => {
          const actions = fakeStore.getActions()[5].operations.filter(op =>
            op.tableName === 'output_schema_columns'
            && op.type === 'UPSERT_FROM_SERVER');

          assert.isAtLeast(actions.length, 1);

          done();
        })
        .catch(err => {
          done();
        });
    });

    it('updates transforms and output_columns with any new values', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore.dispatch(saveColumnMetadata())
        .then(() => {
          const ops = fakeStore.getActions()[5].operations;
          const ocActions = ops.filter(op =>
            op.tableName === 'transforms');

          const transformActions = ops.filter(op =>
            op.tableName === 'output_columns');

          assert.isAtLeast(ocActions.length, 1);
          assert.isAtLeast(transformActions.length, 1);
          done();
        });
    });
  });
});

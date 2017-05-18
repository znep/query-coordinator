import _ from 'lodash';
import { expect, assert } from 'chai';
import { saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { mockFetch } from '../testHelpers/mockHTTP';
import mockPhx from '../testHelpers/mockPhoenixSocket';
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
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import initialState from '../data/initialState.js';

const mockStore = configureStore([thunk]);

describe('actions/manageMetadata', () => {

  // TODO: do better job of mocking this out, maybe use nock and have api responses
  // in another file; would also be good to have these return promises so we could
  // ditch setTimeout
  const responses = {
    '/api/views/hehe-hehe': {
      PUT: {
        status: 200,
        response: {
          id: 'hehe-hehe',
          name: 'New Name',
          description: 'New description',
          category: 'New Category'
        }
      },
    },
    '/api/publishing/v1/upload/224/schema/1712': {
      POST: {
        status: 200,
        response: {
          resource: {
            id: 57,
            output_columns: [
              {
                transform: {
                  transform_expr: 'to_number(id)',
                  output_soql_type: 'number',
                  id: 6105,
                  completed_at: '2017-04-03T15:49:34',
                  transform_input_columns: [
                    { input_column_id: 6262 }
                  ],
                },
                position: 0,
                id: 6329,
                field_name: 'mkkk',
                display_name: 'IDs',
                description: null
              },
              {
                transform: {
                  transform_expr: 'case_number',
                  output_soql_type: 'text',
                  id: 6106,
                  completed_at: '2017-04-03T15:49:34',
                  transform_input_columns: [
                    { input_column_id: 6262 }
                  ]
                },
                position: 1,
                id: 6328,
                field_name: 'case_number',
                display_name: 'Case Number',
                description: null
              }
            ],
            inserted_at: '2017-04-04T00:21:53.591073'
          }
        }
      }
    }
  };

  describe('actions/manageMetadata/saveDatasetMetadata', () => {
    it('dispatches an insert started action with correct data', (done) => {
      const { unmockFetch } = mockFetch(responses, done);

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, done);

      const store = mockStore(initialState);

      store.dispatch(saveDatasetMetadata());

      setTimeout(() => {
        const action = store.getActions()[1];

        expect(action.type).to.eq(API_CALL_STARTED);

        expect(action.operation).to.eq(SAVE_DATASET_METADATA);

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });

    it('dispatches set view action with correct data if server responded with 200-level status', (done) => {
      const { unmockFetch } = mockFetch(responses, done);

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, done);

      const store = mockStore(initialState);

      store.dispatch(saveDatasetMetadata());

      setTimeout(() => {
        const action = store.getActions()[2];

        expect(action.type).to.eq(SET_VIEW);

        expect(action.id).to.eq(responses['/api/views/hehe-hehe'].PUT.response.id);

        expect(action.payload).to.deep.eq(responses['/api/views/hehe-hehe'].PUT.response);

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });

    it('shows an error message if form schema is invalid', () => {
      const newState = Object.assign({}, initialState);

      newState.db.views['3kt9-pmvq'].schema = {
        isValid: false
      };

      const store = mockStore(newState);

      store.dispatch(saveDatasetMetadata());

      expect(store.getActions()[1].type).to.eq(SHOW_FLASH_MESSAGE);
      expect(store.getActions()[1].kind).to.eq('error');
    });

    it('shows field-level errors if form schema is invalid', () => {
      const newState = Object.assign({}, initialState);

      newState.db.views['3kt9-pmvq'].schema = {
        isValid: false
      };

      const store = mockStore(newState);

      store.dispatch(saveDatasetMetadata());

      const action = store.getActions()[2];

      expect(action.type).to.eq('EDIT');
      expect(action.tableName).to.eq('views');
      expect(action.updates).to.deep.eq({
        id: '3kt9-pmvq',
        displayMetadataFieldErrors: true
      });
    });

    it('submits custom metadata correctly', (done) => {
      const { unmockFetch } = mockFetch(responses, done);

      const newState = Object.assign({}, initialState);

      newState.db.views['3kt9-pmvq'].schema = {
        isValid: true
      };

      newState.db.views['3kt9-pmvq'].model = {
        ...newState.db.views['3kt9-pmvq'].model,
        [`${CUSTOM_FIELD_PREFIX}-${btoa('fieldset')}-name`]: 'tester',
        [`${PRIVATE_CUSTOM_FIELD_PREFIX}-${btoa('fieldset')}-secret`]: 'big secret'
      };

      const store = mockStore(newState);

      store.dispatch(saveDatasetMetadata());

      setTimeout(() => {
        expect(_.map(store.getActions(), 'type')).to.deep.equal([
          'HIDE_FLASH_MESSAGE',
          'API_CALL_STARTED',
          'SET_VIEW',
          'API_CALL_SUCCEEDED'
        ]);
        unmockFetch();
        done();
      }, 0);
    });
  });

  describe('actions/manageMetadata/saveColumnMetadata', () => {
    it('dispatches an insert started action with correct data', (done) => {
      const { unmockFetch } = mockFetch(responses, () => {});

      const store = mockStore(initialState);

      const unmockPhx = mockPhx({
        'output_schema:57': [],
        'transform_progress:6105': [],
        'transform_progress:6106': [],
      }, () => {});

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const actions = store.getActions();
        const actionTypes = _.map(actions, 'type');
        expect(actionTypes).to.deep.equal([
          'HIDE_FLASH_MESSAGE',
          'API_CALL_STARTED',
          'API_CALL_SUCCEEDED',
          'UPSERT_FROM_SERVER',
          'CHANNEL_JOIN_STARTED',
          'CREATE_TABLE',
          'CHANNEL_JOIN_STARTED',
          'CREATE_TABLE',
          'CHANNEL_JOIN_STARTED',
          'BATCH'
        ]);
        const batchAction = actions[actions.length-1];
        expect(batchAction.operations.map(action => ([action.type, action.tableName]))).to.deep.equal([
          ['UPSERT_FROM_SERVER', 'transforms'],
          ['UPSERT_FROM_SERVER', 'output_columns'],
          ['UPSERT_FROM_SERVER', 'output_schema_columns'],
          ['UPSERT_FROM_SERVER', 'transforms'],
          ['UPSERT_FROM_SERVER', 'output_columns'],
          ['UPSERT_FROM_SERVER', 'output_schema_columns']
        ]);

        unmockFetch();
        unmockPhx();
        done();
      }, 100);
    });

    it('dispatches an insert succeeded action with correct data if server resonds with 200-level status', (done) => {
      const { unmockFetch } = mockFetch(responses, () => {});

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, () => {});

      const store = mockStore(initialState);

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const actions = store.getActions();
        const actionTypes = _.map(actions, 'type');
        expect(actionTypes).to.deep.equal([
          'HIDE_FLASH_MESSAGE',
          'API_CALL_STARTED',
          'API_CALL_SUCCEEDED',
          'UPSERT_FROM_SERVER',
          'CHANNEL_JOIN_STARTED',
          'CREATE_TABLE',
          'CHANNEL_JOIN_STARTED',
          'CREATE_TABLE',
          'CHANNEL_JOIN_STARTED',
          'BATCH'
        ]);
        const batchAction = actions[actions.length-1];
        expect(batchAction.operations.map(action => ([action.type, action.tableName]))).to.deep.equal([
          ['UPSERT_FROM_SERVER', 'transforms'],
          ['UPSERT_FROM_SERVER', 'output_columns'],
          ['UPSERT_FROM_SERVER', 'output_schema_columns'],
          ['UPSERT_FROM_SERVER', 'transforms'],
          ['UPSERT_FROM_SERVER', 'output_columns'],
          ['UPSERT_FROM_SERVER', 'output_schema_columns']
        ]);

        unmockFetch();
        unmockPhx();
        done();
      }, 0);
    });

    it('updates output_schema_columns if insert succeeded', (done) => {
      const { unmockFetch } = mockFetch(responses, ()=> {});

      const unmockPhx = mockPhx({
        'output_schema:57': [],
        'transform_progress:6105': [],
        'transform_progress:6106': []
      }, ()=> {});

      const store = mockStore(initialState);

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const actions = store.getActions();

        expect(_.map(actions, 'type')).to.deep.equal([
          'HIDE_FLASH_MESSAGE',
          'API_CALL_STARTED',
          'API_CALL_SUCCEEDED',
          'UPSERT_FROM_SERVER',
          'CHANNEL_JOIN_STARTED',
          'CREATE_TABLE',
          'CHANNEL_JOIN_STARTED',
          'CREATE_TABLE',
          'CHANNEL_JOIN_STARTED',
          'BATCH'
        ]);

        const lastAction = actions[actions.length-1];
        expect(_.map(lastAction.operations, (action) => [action.type, action.tableName])).to.deep.equal([
          ['UPSERT_FROM_SERVER', 'transforms'],
          ['UPSERT_FROM_SERVER', 'output_columns'],
          ['UPSERT_FROM_SERVER', 'output_schema_columns'],
          ['UPSERT_FROM_SERVER', 'transforms'],
          ['UPSERT_FROM_SERVER', 'output_columns'],
          ['UPSERT_FROM_SERVER', 'output_schema_columns']
        ]);

        const expected = {
          id: '57-6329',
          output_schema_id: 57,
          output_column_id: 6329
        };
        expect(
          JSON.stringify(lastAction.operations[2].newRecord)
        ).to.deep.eq(
          JSON.stringify(expected)
        );

        unmockFetch();
        unmockPhx();
        done();
      }, 10);
    });

    it('updates transforms and output_columns with any new values', (done) => {
      const { unmockFetch } = mockFetch(responses, () => {});

      const unmockPhx = mockPhx({
        'output_schema:57': [],
        'transform_progress:6105': [],
        'transform_progress:6106': []
      }, () => {});

      const store = mockStore(initialState);

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const actions = store.getActions();

        const batchedActions = actions[9].operations;

        expect(batchedActions.length).to.eq(6);

        expect(batchedActions.map(action => action.type)).to.contain(UPSERT_FROM_SERVER);

        expect(batchedActions.filter(action => action.tableName === 'transforms').length).to.eq(2);

        expect(batchedActions.filter(action => action.tableName === 'output_columns').length).to.eq(2);

        const transformUpdated = responses['/api/publishing/v1/upload/224/schema/1712']
          .POST.response.resource.output_columns.map(column => column.transform.transform_expr);

        expect(batchedActions
          .filter(action => action.tableName === 'transforms')
          .map(action => action.newRecord.transform_expr))
          .to.deep.eq(transformUpdated);

        const columnUpdates = responses['/api/publishing/v1/upload/224/schema/1712']
          .POST.response.resource.output_columns.map(column => column.id);

        expect(batchedActions
          .filter(action => action.tableName === 'output_columns')
          .map(action => action.newRecord.id))
          .to.deep.eq(columnUpdates);

        unmockFetch();
        unmockPhx();
        done();
      }, 0);
    });
  });
});

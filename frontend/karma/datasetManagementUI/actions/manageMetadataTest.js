import { expect, assert } from 'chai';
import { saveDatasetMetadata, saveColumnMetadata } from 'actions/manageMetadata';
import { mockFetch } from '../testHelpers/mockHTTP';
import mockPhx from '../testHelpers/mockPhoenixSocket';
import {
  UPSERT_SUCCEEDED,
  UPSERT_STARTED,
  UPSERT_FROM_SERVER,
  UPDATE_STARTED,
  UPDATE_SUCCEEDED
} from 'actions/database';
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
                  output_soql_type: 'SoQLNumber',
                  id: 6105,
                  completed_at: '2017-04-03T15:49:34'
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
                  output_soql_type: 'SoQLText',
                  id: 6106,
                  completed_at: '2017-04-03T15:49:34'
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

      const { fourfour, db } = store.getState();

      const expectedPayload = {
        ..._.omit(db.views[fourfour].model, 'email'),
        privateMetadata: {
          email: db.views[fourfour].model.email
        }
      };

      setTimeout(() => {
        const action = store.getActions()[0];

        expect(action.type).to.eq(UPDATE_STARTED);

        expect(action.tableName).to.eq('views');

        expect(action.updates).to.deep.eq(expectedPayload);

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });

    it('dispatches insert succeeded with correct data if server responded with 200-level status', (done) => {
      const { unmockFetch } = mockFetch(responses, done);

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, done);

      const store = mockStore(initialState);

      store.dispatch(saveDatasetMetadata());

      const { fourfour, db } = store.getState();

      const expectedPayload = {
        ..._.omit(db.views[fourfour].model, 'email'),
        privateMetadata: {
          email: db.views[fourfour].model.email
        }
      };

      setTimeout(() => {
        const action = store.getActions()[1];

        expect(action.type).to.eq(UPDATE_SUCCEEDED);

        expect(action.tableName).to.eq('views');

        expect(action.updatedRecord).to.deep.eq(expectedPayload);

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });
  });

  describe('actions/manageMetadata/saveColumnMetadata', () => {
    it('dispatches an insert started action with correct data', (done) => {
      const { unmockFetch } = mockFetch(responses, () => {});

      const store = mockStore(initialState);

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, () => {});

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const action = store.getActions()[0];

        expect(action.type).to.eq(UPSERT_STARTED);

        expect(action.tableName).to.eq('output_schemas');

        expect(action.newRecord.input_schema_id).to.eq(1712);

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });

    it('dispatches an insert succeeded action with correct data if server resonds with 200-level status', (done) => {
      const { unmockFetch } = mockFetch(responses, () => {});

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, () => {});

      const store = mockStore(initialState);

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const action = store.getActions()[1];

        expect(action.type).to.eq(UPSERT_SUCCEEDED);

        expect(action.tableName).to.eq('output_schemas');

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });

    it('updates output_schema_columns if insert succeeded', (done) => {
      const { unmockFetch } = mockFetch(responses, ()=> {});

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, ()=> {});

      const store = mockStore(initialState);

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const action = store.getActions()[2];

        expect(action.type).to.eq(UPSERT_FROM_SERVER);

        expect(action.tableName).to.eq('output_schema_columns');

        expect(action.newRecord).to.deep.eq({
          id: '57-6329',
          output_schema_id: 57,
          output_column_id: 6329
        });

        unmockFetch();

        unmockPhx();

        done();
      }, 0);
    });

    it('updates transforms and output_columns with any new values', (done) => {
      const { unmockFetch } = mockFetch(responses, () => {});

      const unmockPhx = mockPhx({
        'output_schema:57': []
      }, () => {});

      const store = mockStore(initialState);

      store.dispatch(saveColumnMetadata());

      setTimeout(() => {
        const actions = store.getActions();

        const batchedActions = actions[(actions.length - 1)].operations;

        expect(batchedActions.length).to.eq(4);

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

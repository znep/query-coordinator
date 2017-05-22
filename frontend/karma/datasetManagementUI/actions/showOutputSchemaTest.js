import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import {
  updateColumnType,
  addColumn,
  dropColumn
} from 'actions/showOutputSchema';
import { createUpload } from 'actions/manageUploads';
import { latestOutputSchema, columnsForOutputSchema } from 'selectors';
import mockAPI from '../testHelpers/mockAPI';
import initialState from '../data/baseState';
import rootReducer from 'reducers';
import wsmock from '../testHelpers/mockSocket';

const mockStore = configureStore([thunk]);

describe('actions/showOutputSchema', () => {

  describe('addColumn', () => {
    let unmock;
    let unmockWS;
    let recordedActions = [];
    let os;
    let column;

    before(done => {
      unmock = mockAPI();
      unmockWS = wsmock();

      const store = createStore(rootReducer, applyMiddleware(thunk));

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const {db} = store.getState();
          os = latestOutputSchema(db);
          column = columnsForOutputSchema(db, os.id)[0];
          return store.dispatch(addColumn(os, column));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore.dispatch(addColumn(os, column))
            .then(() => fakeStore.getActions());
        })
        .then(actions => {
          recordedActions = actions;
          const batch = actions.filter(action => action.type === 'BATCH')[0];
          batch.operations.forEach(op => recordedActions.push(op));
          done();
        })
        .catch(err => {
          done();
        });
    });

    after(() => {
      unmock();
      unmockWS.stop();
    });

    it('adds a new output schema to the store', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === 'UPSERT_SUCCEEDED' && action.tableName === 'output_schemas');

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('adds the added column to the store', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === 'UPSERT_FROM_SERVER'
        && action.tableName === 'output_columns'
        && action.newRecord.field_name === column.field_name
        && action.newRecord.transform_id === column.transform_id);

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('redirects to a new output schema preview', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === '@@router/CALL_HISTORY_METHOD')[0]

      const { payload } = expectedAction;

      assert.match(payload.args[0], /\/uploads\/\d+\/schemas\/\d+\/output\/\d+/);
    });
  });

  describe('dropColumn', () => {
    let unmock;
    let unmockWS;
    let recordedActions = [];
    let os;
    let column;

    before(done => {
      unmock = mockAPI();
      unmockWS = wsmock();

      const store = createStore(rootReducer, applyMiddleware(thunk));

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const {db} = store.getState();
          os = latestOutputSchema(db);
          column = columnsForOutputSchema(db, os.id)[0];
          return store.dispatch(dropColumn(os, column));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore.dispatch(dropColumn(os, column))
            .then(() => fakeStore.getActions());
        })
        .then(actions => {
          recordedActions = actions;
          const batch = actions.filter(action => action.type === 'BATCH')[0];
          batch.operations.forEach(op => recordedActions.push(op));
          done();
        })
        .catch(err => {
          done();
        });
    });

    after(() => {
      unmock();
      unmockWS.stop();
    });

    it('adds a new output schema to the store', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === 'UPSERT_SUCCEEDED' && action.tableName === 'output_schemas');

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('does not include the droped column when updateding the store', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === 'UPSERT_FROM_SERVER'
        && action.tableName === 'output_columns'
        && action.newRecord.field_name === column.field_name
        && action.newRecord.transform_id === column.transform_id);

      assert.equal(expectedAction.length, 0);
    });

    it('redirects to a new output schema preview', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === '@@router/CALL_HISTORY_METHOD')[0]

      const { payload } = expectedAction;

      assert.match(payload.args[0], /\/uploads\/\d+\/schemas\/\d+\/output\/\d+/);
    });

  });

  describe('updateColumnType', () => {
    let unmock;
    let unmockWS;
    let recordedActions = [];
    let os;
    let column;

    before(done => {
      unmock = mockAPI();
      unmockWS = wsmock();

      const store = createStore(rootReducer, applyMiddleware(thunk));

      store.dispatch(createUpload({name: 'petty_crimes.csv'}))
        .then(() => {
          const {db} = store.getState();
          os = latestOutputSchema(db);
          column = columnsForOutputSchema(db, os.id)[0];
          return store.dispatch(updateColumnType(os, column, 'SoQLText'));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore.dispatch(updateColumnType(os, column, 'SoQLText'))
            .then(() => fakeStore.getActions());
        })
        .then(actions => {
          recordedActions = actions;
          const batch = actions.filter(action => action.type === 'BATCH')[0];
          batch.operations.forEach(op => recordedActions.push(op));
          done();
        })
        .catch(err => {
          done();
        });
    });

    after(() => {
      unmock();
      unmockWS.stop();
    });

    it('adds a new output schema to the store', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === 'UPSERT_SUCCEEDED' && action.tableName === 'output_schemas');

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('adds new output column / transform to the store', () => {
      const expectedColumn = recordedActions.filter(action =>
        action.type === 'UPSERT_FROM_SERVER'
        && action.tableName === 'output_columns'
        && action.newRecord.field_name === column.field_name);

      const newTransformId = expectedColumn[0].newRecord.transform_id;

      const expectedTransform = recordedActions.filter(action =>
        action.type === 'UPSERT_FROM_SERVER'
        && action.tableName === 'transforms'
        && action.newRecord.id === newTransformId
        && action.newRecord.output_soql_type === 'text');

      assert.isAtLeast(expectedColumn.length, 1);
      assert.isAtLeast(expectedTransform.length, 1);
    });

    it('redirects to a new output schema preview', () => {
      const expectedAction = recordedActions.filter(action =>
        action.type === '@@router/CALL_HISTORY_METHOD')[0]

      const { payload } = expectedAction;

      assert.match(payload.args[0], /\/uploads\/\d+\/schemas\/\d+\/output\/\d+/);
    });
  });
});

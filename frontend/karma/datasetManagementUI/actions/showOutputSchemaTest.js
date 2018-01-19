import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import {
  updateColumnType,
  outputColumnsWithChangedType,
  dropColumn
} from 'datasetManagementUI/reduxStuff/actions/showOutputSchema';
import mockAPI from '../testHelpers/mockAPI';
import rootReducer from 'datasetManagementUI/reduxStuff/reducers/rootReducer';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import state from '../data/initialState';

const socket = mockSocket(bootstrapChannels);

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

describe('showOutputSchema actions', () => {
  describe('dropColumn', () => {
    let unmock;
    let recordedActions = [];

    const os = _.values(state.entities.output_schemas)[0];
    const column = _.values(state.entities.output_columns)[0];

    before(done => {
      unmock = mockAPI();

      const store = createStore(
        rootReducer,
        state,
        applyMiddleware(thunk.withExtraArgument(socket))
      );

      store
        .dispatch(dropColumn(os, column, params))
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore
            .dispatch(dropColumn(os, column, params))
            .then(() => fakeStore.getActions());
        })
        .then(actions => {
          recordedActions = actions;
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    after(() => {
      unmock();
    });

    it('adds a new output schema to the store', () => {
      const expectedAction = recordedActions.filter(
        action =>
          action.type === 'CREATE_NEW_OUTPUT_SCHEMA_SUCCESS' &&
          _.has(action, 'outputSchema')
      );

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('does not include the dropped column when updating the store', () => {
      const expectedAction = recordedActions
        .filter(
          action =>
            action.type === 'CREATE_NEW_OUTPUT_SCHEMA_SUCCESS' &&
            _.has(action, 'outputColumns')
        )
        .filter(action =>
          Object.keys(action.outputColumns).includes(`${column.transform_id}`)
        );

      assert.equal(expectedAction.length, 0);
    });
  });

  describe('updateColumnType', () => {
    let unmock;
    let recordedActions = [];

    before(done => {
      unmock = mockAPI();

      const store = createStore(
        rootReducer,
        state,
        applyMiddleware(thunk.withExtraArgument(socket))
      );

      const os = _.values(state.entities.output_schemas)[0];
      const column = _.values(state.entities.output_columns)[0];

      store
        .dispatch(updateColumnType(os, column, 'text', params))
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore
            .dispatch(updateColumnType(os, column, 'text', params))
            .then(() => fakeStore.getActions());
        })
        .then(actions => {
          recordedActions = actions;
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    after(() => {
      unmock();
    });

    it('adds a new output schema to the store', () => {
      const expectedAction = recordedActions.filter(
        action =>
          action.type === 'CREATE_NEW_OUTPUT_SCHEMA_SUCCESS' &&
          _.has(action, 'outputSchema')
      );

      assert.isAtLeast(expectedAction.length, 1);
    });
  });

  describe('outputColumnsWithChangedType', () => {

    // EN-17865
    it('updates the column the user changed, and no other columns', () => {
      const entities = {
        output_schemas: {
          0: { id: 0 }
        },
        input_columns: {
          0: { id: 0, soql_type: 'text', field_name: 'a' },
          1: { id: 1, soql_type: 'text', field_name: 'b' }
        },
        transforms: {
          0: {
            id: 0,
            transform_input_columns: [ { input_column_id: 0 } ],
            output_soql_type: 'number',
            transform_expr: '`to_number(a)`'
          },
          1: {
            id: 1,
            transform_input_columns: [ { input_column_id: 1 } ],
            output_soql_type: 'number',
            transform_expr: 'to_number(b)'
          },
        },
        output_columns: {
          0: { id: 0, transform_id: 0, field_name: 'a', display_name: 'a', position: 0, format: {} },
          1: { id: 1, transform_id: 1, field_name: 'b', display_name: 'b', position: 1, format: {} }
        },
        output_schema_columns: {
          '0-0': { output_schema_id: 0, output_column_id: 0 },
          '0-1': { output_schema_id: 0, output_column_id: 1 }
        }
      };
      const oldOutputSchema = entities.output_schemas[0];
      const oldColumn = entities.output_columns[0];
      const newType = 'text';

      const actual = outputColumnsWithChangedType(entities, oldOutputSchema, oldColumn, newType);

      assert.deepEqual(actual, [
        {
          description: undefined,
          display_name: "a",
          field_name: "a",
          is_primary_key: false,
          position: 0,
          format: {},
          transform: {
            transform_expr: "`a`"
          }
        },
        {
          description: undefined,
          display_name: "b",
          field_name: "b",
          is_primary_key: false,
          position: 1,
          format: {},
          transform: {
            transform_expr: "to_number(b)"
          }
        }
      ]);
    });

  });
});

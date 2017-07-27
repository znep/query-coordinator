import { assert } from 'chai';
import _ from 'lodash';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import {
  updateColumnType,
  outputColumnsWithChangedType,
  addColumn,
  dropColumn
} from 'actions/showOutputSchema';
import { bootstrapApp } from 'actions/bootstrap';
import { createUpload } from 'actions/manageUploads';
import { latestOutputSchema, columnsForOutputSchema } from 'selectors';
import mockAPI from '../testHelpers/mockAPI';
import rootReducer from 'reducers/rootReducer';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';

const socket = mockSocket(bootstrapChannels);

const mockStore = configureStore([thunk.withExtraArgument(socket)]);

describe('actions/showOutputSchema', () => {

  describe('addColumn', () => {
    let unmock;
    let recordedActions = [];
    let os;
    let column;

    before(done => {
      unmock = mockAPI();

      const store = createStore(
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

      store
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => {
          const { entities } = store.getState();
          os = latestOutputSchema(entities);
          column = columnsForOutputSchema(entities, os.id)[0];
          return store.dispatch(addColumn(os, column));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore
            .dispatch(addColumn(os, column))
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
          action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS' &&
          _.has(action, 'outputSchema')
      );

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('adds the added column to the store', () => {
      const expectedAction = recordedActions.filter(
        action =>
          action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS' &&
          _.has(action, 'outputColumns')
      );

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('redirects to a new output schema preview', () => {
      const expectedAction = recordedActions.filter(
        action => action.type === '@@router/CALL_HISTORY_METHOD'
      )[0];

      const { payload } = expectedAction;

      assert.match(
        payload.args[0],
        /\/sources\/\d+\/schemas\/\d+\/output\/\d+/
      );
    });
  });

  describe('dropColumn', () => {
    let unmock;
    let recordedActions = [];
    let os;
    let column;

    before(done => {
      unmock = mockAPI();

      const store = createStore(
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

      store
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => {
          const { entities } = store.getState();
          os = latestOutputSchema(entities);
          column = columnsForOutputSchema(entities, os.id)[0];
          return store.dispatch(dropColumn(os, column));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore
            .dispatch(dropColumn(os, column))
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
          action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS' &&
          _.has(action, 'outputSchema')
      );

      assert.isAtLeast(expectedAction.length, 1);
    });

    it('does not include the droped column when updating the store', () => {
      const expectedAction = recordedActions
        .filter(
          action =>
            action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS' &&
            _.has(action, 'outputColumns')
        )
        .filter(action =>
          Object.keys(action.outputColumns).includes(`${column.transform_id}`)
        );

      assert.equal(expectedAction.length, 0);
    });

    it('redirects to a new output schema preview', () => {
      const expectedAction = recordedActions.filter(
        action => action.type === '@@router/CALL_HISTORY_METHOD'
      )[0];

      const { payload } = expectedAction;

      assert.match(
        payload.args[0],
        /\/sources\/\d+\/schemas\/\d+\/output\/\d+/
      );
    });
  });

  describe('updateColumnType', () => {
    let unmock;
    let recordedActions = [];
    let os;
    let column;

    before(done => {
      unmock = mockAPI();

      const store = createStore(
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

      store
        .dispatch(createUpload({ name: 'petty_crimes.csv' }))
        .then(() => {
          const { entities } = store.getState();
          os = latestOutputSchema(entities);
          column = columnsForOutputSchema(entities, os.id)[0];
          return store.dispatch(updateColumnType(os, column, 'text'));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore
            .dispatch(updateColumnType(os, column, 'text'))
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
          action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS' &&
          _.has(action, 'outputSchema')
      );

      assert.isAtLeast(expectedAction.length, 1);
    });

    // it.only('adds new output column / transform to the store', () => {
    //   const expectedColumn = recordedActions
    //     .filter(action => action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS')
    //     .map(action => action.outputColumns)
    //     .reduce((acc, outputColumns) => {
    //       return [
    //         ...acc,
    //         ...Object.keys(outputColumns).map(key => outputColumns[key])
    //       ];
    //     }, [])
    //     .filter(
    //       outputColumn =>
    //         outputColumn.position === column.position &&
    //         outputColumn.field_name === column.field_name
    //     );
    //
    //   const newTransformId = expectedColumn[0].transform_id;
    //
    //   const expectedTransform = recordedActions
    //     .filter(action => action.type === 'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS')
    //     .map(action => action.transforms)
    //     .reduce((acc, transforms) => {
    //       return [
    //         ...acc,
    //         ...Object.keys(transforms).map(key => transforms[key])
    //       ];
    //     }, [])
    //     .filter(transform => transform.id === newTransformId);
    //
    //   assert.isAtLeast(expectedColumn.length, 1);
    //   assert.isAtLeast(expectedTransform.length, 1);
    // });

    it('redirects to a new output schema preview', () => {
      const expectedAction = recordedActions.filter(
        action => action.type === '@@router/CALL_HISTORY_METHOD'
      )[0];

      const { payload } = expectedAction;

      assert.match(
        payload.args[0],
        /\/sources\/\d+\/schemas\/\d+\/output\/\d+/
      );
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
          0: { id: 0, transform_id: 0, field_name: 'a', display_name: 'a', position: 0 },
          1: { id: 1, transform_id: 1, field_name: 'b', display_name: 'b', position: 1 }
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
          transform: {
            transform_expr: "to_number(b)"
          }
        }
      ]);
    });

  });

});

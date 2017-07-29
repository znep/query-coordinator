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
import { bootstrapApp } from 'actions/bootstrap';
import { createUpload } from 'actions/manageUploads';
import { latestOutputSchema, columnsForOutputSchema } from 'selectors';
import mockAPI from '../testHelpers/mockAPI';
import rootReducer from 'reducers/rootReducer';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';

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
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, params))
        .then(() => {
          const { entities } = store.getState();
          os = latestOutputSchema(entities);
          column = columnsForOutputSchema(entities, os.id)[0];
          return store.dispatch(addColumn(os, column, params));
        })
        .then(() => {
          return store.getState();
        })
        .then(state => {
          const fakeStore = mockStore(state);
          return fakeStore
            .dispatch(addColumn(os, column, params))
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
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, params))
        .then(() => {
          const { entities } = store.getState();
          os = latestOutputSchema(entities);
          column = columnsForOutputSchema(entities, os.id)[0];
          return store.dispatch(dropColumn(os, column, params));
        })
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
        .dispatch(createUpload({ name: 'petty_crimes.csv' }, params))
        .then(() => {
          const { entities } = store.getState();
          os = latestOutputSchema(entities);
          column = columnsForOutputSchema(entities, os.id)[0];
          return store.dispatch(updateColumnType(os, column, 'text', params));
        })
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
  });
});

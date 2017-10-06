import { assert } from 'chai';
import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import {
  createUploadSource,
  createViewSource
} from 'reduxStuff/actions/createSource';
import mockAPI from '../testHelpers/mockAPI';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import { addLocation } from 'reduxStuff/actions/history';
import rootReducer from 'reduxStuff/reducers/rootReducer';
import { getInitialState } from 'reduxStuff/store';
import fetchMock from 'fetch-mock';
import * as dsmapiLinks from 'links/dsmapiLinks';

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

describe('createSource actions', () => {
  describe('createUploadSource', () => {
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
        getInitialState(window.initialState.view, window.initialState.customMetadataFieldsets),
        applyMiddleware(thunk.withExtraArgument(socket))
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

    it('dispatches API_CALL_STARTED action with the filename', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUploadSource({ name: 'petty_crimes.csv' }, params))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.equal(actions[0].type, 'API_CALL_STARTED');
          assert.equal(
            actions[0].callParams.source_type.filename,
            'petty_crimes.csv'
          );

          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('dispatches a CREATE_UPLOAD_SOURCE_SUCCESS action with the correct sourceId', done => {
      const fakeStore = mockStore(store.getState());

      fakeStore
        .dispatch(createUploadSource({ name: 'petty_crimes.csv' }, params))
        .then(() => {
          const actions = fakeStore.getActions();
          const expectedAction = actions.filter(
            action =>
              action.type === 'CREATE_UPLOAD_SOURCE_SUCCESS' &&
              action.source.id === 823
          );

          assert.isAtLeast(expectedAction.length, 1);

          done();
        })
        .catch(err => done(err));
    });
  });

  describe('createViewSource', () => {
    const fakeStore = mockStore({});

    const params = {
      fourfour: 'abcd-1234',
      revisionSeq: '0'
    };

    const API_RESPONSES = {
      createSource: {
        resource: {
          id: 3,
          created_at: '2017-10-04T22:11:27.539365Z',
          created_by: {
            display_name: 'Brandon Webster',
            email: 'brandon.webster@socrata.com',
            user_id: 'tugg-ikce'
          },
          schemas: [
            {
              id: 1,
              input_columns: [],
              output_schemas: [
                {
                  id: 2,
                  output_columns: []
                }
              ]
            }
          ]
        }
      }
    };

    before(() => {
      fetchMock.post(dsmapiLinks.sourceCreate(params), {
        body: JSON.stringify(API_RESPONSES.createSource),
        status: 200,
        statusText: 'Ok'
      });
    });

    after(() => {
      fetchMock.restore();
    });

    it("dispatches a CREATE_SOURCE action with a source type of 'view'", done => {
      fakeStore.dispatch(createViewSource(params)).then(() => {
        const actions = fakeStore.getActions();
        const action = actions.filter(
          action =>
            action.operation === 'CREATE_SOURCE' &&
            action.callParams.source_type.type === 'view'
        );

        assert.equal(action.length, 1);
        done();
      });
    });

    it('dispatches a CREATE_SOURCE_SUCCESS action proper table updates', done => {
      fakeStore.dispatch(createViewSource(params)).then(() => {
        const actions = fakeStore.getActions();

        const action = actions.find(
          action => action.type === 'CREATE_SOURCE_SUCCESS'
        );

        assert.isOk(action);
        assert.containsAllKeys(action, [
          'source',
          'inputSchemas',
          'inputColumns',
          'outputSchemas',
          'outputColumns',
          'outputSchemaColumns',
          'transforms'
        ]);
        done();
      });
    });
  });
});

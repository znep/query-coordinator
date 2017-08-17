import _ from 'lodash';
import { assert } from 'chai';
import mockAPI from '../testHelpers/mockAPI';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import state from '../data/initialState';

import { loadRevision } from 'reduxStuff/actions/loadRevision';

describe('loadRevision actions', () => {

  const justAView = {
    entities: {
      views: {
        '2ttq-aktm': {
          id: '2ttq-aktm',
          name: 'vsgfdfg',
          viewCount: 0,
          downloadCount: 0,
          license: {},
          customMetadataFieldsets: _.values(state.entities.views)[0].customMetadataFields
        }
      },
      revisions: {},
      updates: {},
      sources: {},
      input_schemas: {},
      output_schemas: {},
      input_columns: {},
      output_columns: {},
      output_schema_columns: {},
      transforms: {},
      upsert_jobs: {},
      email_interests: {},
      row_errors: {}
    },
  };

  const socket = mockSocket(bootstrapChannels);
  const mockStore = configureStore([thunk.withExtraArgument(socket)]);

  let unmockHTTP;
  let fakeStore;

  beforeEach(() => {
    fakeStore = mockStore(justAView);
  });

  before(() => {
    unmockHTTP = mockAPI();
  });

  after(() => {
    unmockHTTP();
  });


  describe('loadRevision', () => {

    it('makes calls to DSMAPI, dispatches sideEffectyStuff, and inserts revision into store', (done) => {
      fakeStore.dispatch(loadRevision({ revisionSeq: 0 }))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.deepEqual(_.map(actions, 'type'), [
            'LOAD_REVISION_SUCCESS',
            'INSERT_INPUT_SCHEMA',
            'LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS',
            'SHOW_MODAL'
          ]);

          done();
        })
        .catch((err) => {
          done(err);
        });
    });

  });

});

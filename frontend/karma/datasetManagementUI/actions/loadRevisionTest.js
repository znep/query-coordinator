import _ from 'lodash';
import { assert } from 'chai';
import mockSocket from '../testHelpers/mockSocket';
import { bootstrapChannels } from '../data/socketChannels';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import fetchMock from 'fetch-mock';
import { loadRevision } from 'reduxStuff/actions/loadRevision';
import * as dsmapiLinks from 'links/dsmapiLinks';
import * as coreLinks from 'links/coreLinks';

const API_RESPONSES = {
  getCurrentRevision: {
    resource: {
      id: 44,
      fourfour: '2ttq-aktm',
      metadata: {},
      output_schema_id: 12,
      action: {
        permission: 'public'
      },
      task_sets: [
        {
          updated_at: '2017-10-03T16:14:01.869151Z',
          status: 'successful',
          output_schema_id: 12,
          id: 145,
          finished_at: '2017-10-03T16:14:01',
          created_by: {
            user_id: 'tugg-ikce',
            email: 'brandon.webster@socrata.com',
            display_name: 'Brandon Webster'
          },
          created_at: '2017-10-03T16:14:00.392877Z'
        }
      ],
      revision_seq: '0',
      created_at: '2017-10-03T16:14:01.869151Z',
      created_by: {
        user_id: 'tugg-ikce',
        email: 'brandon.webster@socrata.com',
        display_name: 'Brandon Webster'
      }
    }
  },
  getSources: [
    {
      resource: {
        failed_at: null,
        schemas: [],
        id: 222
      }
    }
  ],
  getView: {
    columns: [],
    dispayType: 'table'
  }
};

describe('loadRevision actions', () => {
  const params = {
    fourfour: '2ttq-aktm',
    revisionSeq: '0'
  };

  const state = {
    entities: {
      views: {
        '2ttq-aktm': {
          id: '2ttq-aktm',
          name: 'vsgfdfg',
          viewCount: 0,
          downloadCount: 0,
          license: {},
          customMetadataFieldsets: [
            {
              name: 'FS One',
              fields: [
                {
                  name: 'name',
                  required: false
                },
                {
                  name: 'animals',
                  options: ['dog', 'cat', 'pig', 'sheep'],
                  type: 'fixed',
                  required: true
                },
                {
                  private: true,
                  name: 'thing',
                  required: false
                }
              ]
            }
          ]
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
    }
  };

  const socket = mockSocket(bootstrapChannels);

  const mockStore = configureStore([thunk.withExtraArgument(socket)]);

  let fakeStore;

  beforeEach(() => {
    fakeStore = mockStore(state);
  });

  before(() => {
    fetchMock.get(dsmapiLinks.revisionBase(params), {
      body: JSON.stringify(API_RESPONSES.getCurrentRevision),
      status: 200,
      statusText: 'OK'
    });

    fetchMock.get(dsmapiLinks.sourceIndex(params), {
      body: JSON.stringify(API_RESPONSES.getSources),
      status: 200,
      statusText: 'OK'
    });

    fetchMock.get(coreLinks.view(params.fourfour), {
      body: JSON.stringify(API_RESPONSES.getView),
      status: 200,
      statusText: 'OK'
    });
  });

  after(() => {
    fetchMock.restore();
  });

  describe('loadRevision', () => {
    it('updates store tables', done => {
      fakeStore
        .dispatch(loadRevision(params))
        .then(() => {
          const actions = fakeStore.getActions();
          assert.deepEqual(_.map(actions, 'type'), [
            'CREATE_SOURCE_SUCCESS',
            'LOAD_REVISION_SUCCESS',
            'SHOW_MODAL'
          ]);

          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});

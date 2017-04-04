import { expect, assert } from 'chai';
import { getEmptyStore } from './testStore';
import { bootstrap } from 'bootstrap';
import { mockFetch } from './testHelpers/mockHTTP';
import mockPhx from './testHelpers/mockPhoenixSocket';

describe('bootstrap', () => {

  const mockChannelMessages = {
    'row_errors:4': []
  };

  it('adds notification for in-progress upsert job and starts polling if they\'re not done', (done) => {
    const unmockPhx = mockPhx(mockChannelMessages, done);
    const { unmockFetch, calls: fetchCalls } = mockFetch({
      '/api/publishing/v1/revision/hehe-hehe/0': {
        GET: {
          response: {
            resource: {
              upsert_jobs: [
                {
                  id: 5,
                  status: 'successful'
                }
              ]
            }
          }
        }
      }
    });
    const store = getEmptyStore();
    const updateWithUpsertJobs = {
      ...window.initialState.update,
      upsert_jobs: [
        {
          id: 5,
          output_schema_id: 1,
          status: 'in_progress'
        }
      ]
    };
    bootstrap(store, window.initialState.view, updateWithUpsertJobs);
    const notifications = store.getState().notifications;
    expect(notifications).to.deep.equal([
      {
        type: 'UPSERT_JOB_NOTIFICATION',
        upsertJobId: 5
      }
    ]);
    setTimeout(() => {
      expect(fetchCalls['/api/publishing/v1/revision/hehe-hehe/0'].GET).to.equal(1);
      unmockFetch();
      unmockPhx();
      done();
    }, 0);
  });

  it('adds notification for successful upsert job and doesn\'t poll', (done) => {
    const unmockPhx = mockPhx(mockChannelMessages, done);
    const { unmockFetch, calls: fetchCalls } = mockFetch({
      '/api/publishing/v1/revision/hehe-hehe/0': {
        GET: {
          response: {
            resource: {
              upsert_jobs: [
                {
                  id: 5,
                  status: 'successful'
                }
              ]
            }
          }
        }
      }
    });
    const store = getEmptyStore();
    const updateWithUpsertJobs = {
      ...window.initialState.update,
      upsert_jobs: [
        {
          id: 5,
          output_schema_id: 1,
          status: 'successful'
        }
      ]
    };
    bootstrap(store, window.initialState.view, updateWithUpsertJobs);
    const notifications = store.getState().notifications;
    expect(notifications).to.deep.equal([
      {
        type: 'UPSERT_JOB_NOTIFICATION',
        upsertJobId: 5
      }
    ]);
    setTimeout(() => {
      expect(fetchCalls['/api/publishing/v1/revision/hehe-hehe/0'].GET).to.equal(0);
      unmockFetch();
      unmockPhx();
      done();
    }, 0);
  });

  it('loads row errors if there are any', (done) => {
    const unmockPhx = mockPhx({
      'row_errors:4': [
        {
          event: 'errors',
          payload: {
            errors: 1
          }
        }
      ]
    }, done);
    const { unmockFetch, calls: fetchCalls } = mockFetch({
      '/api/update/hehe-hehe/0': {
        GET: {
          response: {
            resource: {
              upsert_jobs: [
                {
                  id: 5,
                  status: 'successful'
                }
              ]
            }
          }
        }
      },
      '/api/publishing/v1/upload/5/schema/4/errors?limit=1&offset=0': {
        GET: {
          response: [
            {
              offset: 1,
              error: {
                wanted: 3,
                got: 2,
                type: 'too_long',
                contents: ['foo', 'bar']
              }
            }
          ]
        }
      }
    });
    const store = getEmptyStore();
    const updateWithUpsertJobs = {
      ...window.initialState.update,
      upsert_jobs: [
        {
          id: 5,
          output_schema_id: 1,
          status: 'successful'
        }
      ]
    };
    bootstrap(store, window.initialState.view, updateWithUpsertJobs);

    setTimeout(() => {
      const db = store.getState().db;
      expect(db.row_errors).to.deep.equal({
        '4-1': {
          offset: 1,
          error: {
            wanted: 3,
            got: 2,
            type: 'too_long',
            contents: [
              'foo',
              'bar'
            ]
          },
          input_schema_id: 4,
          id: '4-1',
          __status__: {
            type: 'SAVED',
            savedAt: 'ON_SERVER'
          }
        }
      });
      expect(fetchCalls['/api/update/hehe-hehe/0'].GET).to.equal(0);
      unmockFetch();
      unmockPhx();
      done();
    }, 0);
  });

  // TODO: test what it actually inserts into the db

});

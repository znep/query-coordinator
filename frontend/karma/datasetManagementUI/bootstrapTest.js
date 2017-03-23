import { getEmptyStore } from './testStore';
import { bootstrap } from 'bootstrap';
import { mockFetch } from './testHelpers/mockHTTP';

describe('bootstrap', () => {

  it('adds notification for in-progress upsert job and starts polling if they\'re not done', (done) => {
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
      done();
    }, 0);
  });

  it('adds notification for successful upsert job and doesn\'t poll', (done) => {
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
      done();
    }, 0);
  });

  // TODO: test what it actually inserts into the db

});

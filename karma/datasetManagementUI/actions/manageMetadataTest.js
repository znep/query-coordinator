import { getDefaultStore } from '../testStore';
import { saveMetadata } from 'actions/manageMetadata';
import { STATUS_DIRTY, STATUS_SAVED } from 'lib/database/statuses';
import { edit } from 'actions/database';

describe('actions/manageMetadata', () => {

  const responses = {
    '/api/views/hehe-hehe': {
      POST: {
        name: 'New Name',
        description: 'New description',
        category: 'New Category'
      }
    }
  };

  it('saves metadata', (done) => {
    const realFetch = window.fetch;
    function doneUnmock() {
      window.fetch = realFetch;
      done();
    }
    const store = getDefaultStore();
    store.dispatch(edit('views', {
      id: 'hehe-hehe',
      name: 'New Name',
      description: 'New description'
    }));
    expect(store.getState().db.views[0].__status__.type).to.equal(STATUS_DIRTY);
    // mock fetch
    window.fetch = (url, options) => {
      return new Promise((resolve) => {
        resolve({
          status: 200,
          json: () => (new Promise((resolve) => {
            resolve(responses[url][options.method || 'GET']);
          }))
        });
      });
    };
    store.dispatch(saveMetadata());
    // out-wait the metadata action by 500ms
    // TODO: how can we not do this? blocks other tests from running
    setTimeout(() => {
      expect(store.getState().db.views[0].__status__.type).to.equal(STATUS_SAVED);
      doneUnmock();
    }, 1500);
    // TODO: assert against database state
  });

});

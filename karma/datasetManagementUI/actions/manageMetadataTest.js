import { getDefaultStore } from '../testStore';
import { saveMetadata } from 'actions/manageMetadata';
import { STATUS_DIRTY, STATUS_DIRTY_IMMUTABLE, STATUS_SAVED } from 'lib/database/statuses';
import { edit, editImmutable } from 'actions/database';
import { mockFetch } from '../testHelpers/mockHTTP';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';

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

  it('saves metadata when there are no output schemas', (done) => {
    const unmockFetch = mockFetch(responses);
    const store = getStoreWithOutputSchema();
    store.dispatch(edit('views', {
      id: 'hehe-hehe',
      name: 'New Name',
      description: 'New description'
    }));
    expect(store.getState().db.views[0].__status__.type).to.equal(STATUS_DIRTY);
    store.dispatch(saveMetadata());
    setTimeout(() => {
      expect(store.getState().db.views[0].__status__.type).to.equal(STATUS_SAVED);
      unmockFetch();
      done();
    }, 0);
    // TODO: assert against database state
  });

  it('saves metadata when there is an output schema', (done) => {
    const unmockFetch = mockFetch(responses);
    const store = getStoreWithOutputSchema();
    store.dispatch(editImmutable('output_columns', {
      id: 51,
      description: 'my column description'
    }));
    const dirtyOutputColumn = _.find(store.getState().db.output_columns, { id: 51 });
    expect(dirtyOutputColumn.__status__.type).to.equal(STATUS_DIRTY_IMMUTABLE);
    store.dispatch(saveMetadata());
    setTimeout(() => {
      expect(store.getState().db.views[0].__status__.type).to.equal(STATUS_SAVED);
      unmockFetch();
      done();
    }, 0);
    // TODO: assert against database state
  });

});

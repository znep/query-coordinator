import { expect, assert } from 'chai';
import AppBar from 'components/AppBar';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import { upsertFromServer, updateFromServer } from 'actions/database';

describe('components/AppBar', () => {

  it('renders without errors', () => {
    const store = getStoreWithOutputSchema();
    const element = renderComponentWithStore(AppBar, {}, store);
    assert.ok(element);
    assert.isNull(element.querySelector('a'));
  });

  it('renders a link to primer', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(upsertFromServer('upsert_jobs', {
      id: 55,
      output_schema_id: 18
    }));
    store.dispatch(updateFromServer('upsert_jobs', {
      id: 55,
      output_schema_id: 18,
      status: 'successful'
    }));
    const element = renderComponentWithStore(AppBar, {}, store);
    assert.ok(element);
    assert.ok(element.querySelector('a'));
  });

});

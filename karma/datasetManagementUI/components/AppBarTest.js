import AppBar from 'components/AppBar';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import { insertFromServer, updateFromServer } from 'actions/database';

describe('components/AppBar', () => {

  it('renders without errors', () => {
    const store = getStoreWithOutputSchema();
    const element = renderComponentWithStore(AppBar, {}, store);
    expect(element).to.exist;
    expect(element.querySelector('a')).to.not.exist;
  });

  it('renders a link to primer', () => {
    const store = getStoreWithOutputSchema();
    store.dispatch(insertFromServer('upsert_jobs', {
      id: 55,
      output_schema_id: 18
    }));
    store.dispatch(updateFromServer('upsert_jobs', {
      id: 55,
      output_schema_id: 18,
      status: 'successful'
    }));
    const element = renderComponentWithStore(AppBar, {}, store);
    expect(element).to.exist;
    expect(element.querySelector('a')).to.exist;
  });

});

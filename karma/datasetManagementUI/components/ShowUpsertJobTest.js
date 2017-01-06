import { getDefaultStore } from '../testStore';
import ShowUpsertJob from 'components/ShowUpsertJob';
import { insertFromServer } from 'actions/database';

describe('components/ShowUpsertJob', () => {

  const defaultProps = {
    params: {
      upsertJobId: 5
    }
  };

  it('shows "successful" message', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('upsert_jobs', { id: 5, status: 'successful' }));

    const element = renderComponentWithStore(ShowUpsertJob, defaultProps, store);

    const message = I18n.show_upsert.successful.title + I18n.show_upsert.successful.body;
    expect(element.querySelector('.modal-content div').innerText).to.eql(message);
  });

  it('shows "failure" message', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('upsert_jobs', { id: 5, status: 'failure' }));

    const element = renderComponentWithStore(ShowUpsertJob, defaultProps, store);

    const message = I18n.show_upsert.failure.title + I18n.show_upsert.failure.body;
    expect(element.querySelector('.modal-content div').innerText).to.eql(message);
  });


  it('shows "processing" message', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('upsert_jobs', { id: 5, status: 'oh you know, okay.' }));

    const element = renderComponentWithStore(ShowUpsertJob, defaultProps, store);

    const message = I18n.show_upsert.in_progress.title + I18n.show_upsert.in_progress.body;
    expect(element.querySelector('.modal-content div').innerText).to.eql(message);
  });

  it('shows "done" button', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('upsert_jobs', { id: 5, status: 'successful' }));

    const element = renderComponentWithStore(ShowUpsertJob, defaultProps, store);

    const message = I18n.show_upsert.footer.finished;
    expect(element.querySelector('button#done').innerText).to.eql(message);
  });

  it('shows "failed" button', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('upsert_jobs', { id: 5, status: 'failed' }));

    const element = renderComponentWithStore(ShowUpsertJob, defaultProps, store);

    const message = I18n.show_upsert.footer.failed;
    expect(element.querySelector('button#done').innerText).to.eql(message);
  });

  it('shows empty button when in progress', () => {
    const store = getDefaultStore();
    store.dispatch(insertFromServer('upsert_jobs', { id: 5, status: 'wheeeeeeeeeeee!' }));

    const element = renderComponentWithStore(ShowUpsertJob, defaultProps, store);

    expect(element.querySelector('button#done').innerText).to.eql('');
  });
});

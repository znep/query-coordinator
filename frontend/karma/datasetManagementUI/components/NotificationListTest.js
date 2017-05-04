import { expect, assert } from 'chai';
import NotificationList from 'components/NotificationList';
import {
  upsertStarted,
  upsertSucceeded,
  upsertFromServer,
  updateStarted,
  updateProgress,
  updateFailed,
  updateSucceeded,
  updateFromServer
} from 'actions/database';
import {
  addNotification
} from 'actions/notifications';
import {
  uploadNotification,
  upsertJobNotification
} from 'lib/notifications';
import { getDefaultStore } from '../testStore';

describe('components/NotificationList', () => {

  it('doesn\'t show an upload before it has an id', () => {
    const store = getDefaultStore();
    store.dispatch(upsertStarted('uploads', {
      filename: 'foo.csv'
    }));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.dsmui-notification').length).to.equal(0);
  });

  it('shows an upload in progress at 0% when it has just been started', () => {
    const store = getDefaultStore();
    store.dispatch(upsertStarted('uploads', {
      filename: 'foo.csv'
    }));
    store.dispatch(upsertSucceeded('uploads',
      { filename: 'foo.csv' },
      { id: 57 }
    ));
    store.dispatch(updateStarted('uploads', {
      id: 57
    }));
    store.dispatch(addNotification(uploadNotification(57)));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.inProgress').length).to.equal(1);
    expect(element.querySelector('.progressBarInProgress.progressBar').style.width).to.eql('0%');
  });

  it('shows an upload in progress at 50% when it has gotten progress events', () => {
    const store = getDefaultStore();
    store.dispatch(upsertStarted('uploads', {
      filename: 'foo.csv'
    }));
    store.dispatch(upsertSucceeded('uploads',
      { filename: 'foo.csv' },
      { id: 57 }
    ));
    store.dispatch(updateStarted('uploads', {
      id: 57
    }));
    store.dispatch(addNotification(uploadNotification(57)));
    store.dispatch(updateProgress('uploads', {
      id: 57
    }, 50));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.inProgress').length).to.equal(1);
    expect(element.querySelector('.progressBarInProgress').style.width).to.eql('50%');
    expect(element.querySelector('.percentCompleted').innerText).to.eql('50%');
  });

  it('shows a recently completed upload', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('uploads', {
      id: 57,
      filename: 'foo.csv'
    }));
    store.dispatch(updateStarted('uploads', {
      id: 57
    }));
    store.dispatch(addNotification(uploadNotification(57)));
    store.dispatch(updateProgress('uploads', {
      id: 57
    }, 50));
    store.dispatch(updateSucceeded('uploads', {
      id: 57
    }));
    store.dispatch(updateFromServer('uploads', {
      id: 57,
      finished_at: new Date()
    }, 50));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.successful').length).to.equal(1);
    expect(element.querySelector('.progressBarSuccess').style.width).to.eql('100%');
  });

  it('shows a failed upload', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('uploads', {
      id: 57,
      filename: 'foo.csv'
    }));
    store.dispatch(updateStarted('uploads', {
      id: 57
    }));
    store.dispatch(addNotification(uploadNotification(57)));
    store.dispatch(updateProgress('uploads', {
      id: 57
    }, 50));
    store.dispatch(updateFailed('uploads', {
      id: 57
    }, 'some error', 50));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.errorDetails').length).to.equal(1);
  });

  it('doesn\'t show an upsert job before it has an id', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('input_schemas', { id: 0, total_rows: 5000 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 0 }));
    store.dispatch(upsertFromServer('output_columns', { id: 1, contiguous_rows_processed: 5000 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 1,
      output_column_id: 1
    }));
    store.dispatch(upsertStarted('upsert_jobs', {
      output_schema_id: 1
    }));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.dsmui-notification').length).to.equal(0);
  });

  // Re-enable if we add upsert job notifications back.
  xit('shows an upsert job in progress which has 0 log entries', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('input_schemas', { id: 0, total_rows: 5000 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 0 }));
    store.dispatch(upsertFromServer('output_columns', { id: 1, contiguous_rows_processed: 5000 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 1,
      output_column_id: 1
    }));
    store.dispatch(upsertStarted('upsert_jobs', {
      output_schema_id: 1
    }));
    store.dispatch(upsertSucceeded('upsert_jobs',
      { output_schema_id: 1 },
      { id: 52, status: 'in_progress' }
    ));
    store.dispatch(addNotification(upsertJobNotification(52)));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.inProgress').length).to.equal(1);
    expect(element.querySelector('.progressBarInProgress.progressBar').style.width).to.eql('0%');
    expect(element.querySelector('.percentCompleted').innerText).to.eql('0%');
  });

  // Re-enable if we add upsert job notifications back.
  xit('shows an upsert job in progress which has some log entries', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('input_schemas', { id: 0, total_rows: 5000 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 0 }));
    store.dispatch(upsertFromServer('output_columns', { id: 1, contiguous_rows_processed: 5000 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 1,
      output_column_id: 1
    }));
    store.dispatch(upsertStarted('upsert_jobs', {
      output_schema_id: 1
    }));
    store.dispatch(upsertSucceeded('upsert_jobs',
      { output_schema_id: 1 },
      { id: 52, status: 'in_progress' }
    ));
    store.dispatch(updateFromServer('upsert_jobs',
      {
        id: 52,
        log: [
          { stage: 'rows_upserted', details: { count: 2500 } }
        ]
      }
    ));
    store.dispatch(addNotification(upsertJobNotification(52)));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.inProgress').length).to.equal(1);
    expect(element.querySelector('.progressBarInProgress.progressBar').style.width).to.eql('50%');
    expect(element.querySelector('.percentCompleted').innerText).to.eql('50%');
  });

  // Re-enable if we add upsert job notifications back.
  xit('shows a recently completed upsert job', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('input_schemas', { id: 0, total_rows: 5000 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 0 }));
    store.dispatch(upsertFromServer('output_columns', { id: 1, contiguous_rows_processed: 5000 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 6,
      output_column_id: 1
    }));
    store.dispatch(upsertStarted('upsert_jobs', {
      output_schema_id: 1
    }));
    store.dispatch(upsertSucceeded('upsert_jobs',
      { output_schema_id: 1 },
      { id: 52, status: 'in_progress' }
    ));
    store.dispatch(addNotification(upsertJobNotification(52)));
    store.dispatch(updateFromServer('upsert_jobs', {
      id: 52,
      finished_at: new Date(),
      status: 'successful'
    }));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.successful').length).to.equal(1);
  });

  // Re-enable if we add upsert job notifications back.
  xit('shows a failed upsert job', () => {
    const store = getDefaultStore();
    store.dispatch(upsertFromServer('input_schemas', { id: 0, total_rows: 5000 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 0 }));
    store.dispatch(upsertFromServer('output_columns', { id: 1, contiguous_rows_processed: 5000 }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 1,
      output_column_id: 1
    }));
    store.dispatch(upsertStarted('upsert_jobs', {
      output_schema_id: 1
    }));
    store.dispatch(upsertSucceeded('upsert_jobs',
      { output_schema_id: 1 },
      { id: 52 }
    ));
    store.dispatch(addNotification(upsertJobNotification(52)));
    store.dispatch(updateFromServer('upsert_jobs', {
      id: 52,
      finished_at: new Date(),
      status: 'failure'
    }));
    const element = renderComponentWithStore(NotificationList, {}, store);
    assert.isNotNull(element);
    expect(element.querySelectorAll('.notification').length).to.equal(1);
    expect(element.querySelectorAll('.notification.error').length).to.equal(1);
  });

});
import { expect, assert } from 'chai';
import RecentActions from 'components/RecentActions';
import { getEmptyStore } from '../testStore';
import {
  upsertFromServer
} from 'actions/database';


function insertView(store) {
  store.dispatch(upsertFromServer('views', {
    license: {},
    owner: {},
    viewCount: 0,
    downloadCount: 0,
    ownerName: 'foo',
    tags: [],
    description: ''
  }));
}

function insertRevision(store) {
  store.dispatch(upsertFromServer('revisions', {
    id: 5,
    fourfour: 'hehe-hehe',
    revision_seq: 0,
    created_at: new Date(),
    created_by: {
      display_name: 'rozap',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpload(store) {
  store.dispatch(upsertFromServer('uploads', {
    id: 0,
    filename: 'foo.csv',
    finished_at: new Date(),
    created_by: {
      display_name: 'bob',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertOutputSchema(store) {
  store.dispatch(upsertFromServer('input_schemas', {
    upload_id: 0,
    id: 0
  }));
  store.dispatch(upsertFromServer('output_schemas', {
    id: 0,
    input_schema_id: 0,
    created_at: new Date(),
    created_by: {
      display_name: 'fred',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpsertInProgress(store) {
  store.dispatch(upsertFromServer('upsert_jobs', {
    status: 'progress',
    id: 0,
    finished_at: null,
    created_at: new Date(),
    created_by: {
      display_name: 'foo',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpsertComplete(store) {
  store.dispatch(upsertFromServer('upsert_jobs', {
    status: 'successful',
    id: 0,
    finished_at: new Date(),
    created_at: new Date(),
    created_by: {
      display_name: 'foo',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpsertFailed(store) {
  store.dispatch(upsertFromServer('upsert_jobs', {
    status: 'failure',
    id: 0,
    finished_at: new Date(),
    created_at: new Date(),
    created_by: {
      display_name: 'foo',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

describe('components/RecentActions', () => {
  it('renders nothing when there is nothing', () => {
    const store = getEmptyStore();
    insertView(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(0);
  });

  it('renders an update when there is an update', () => {
    const store = getEmptyStore();
    insertView(store);
    insertRevision(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(1);
    expect(element.querySelector('.createdBy').innerText).to.eql('rozap');
  });

  it('renders an upload when there is an upload', () => {
    const store = getEmptyStore();
    insertView(store);
    insertRevision(store);
    insertUpload(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(2);
    expect(element.querySelector('[data-activity-type=upload] .createdBy').innerText).to.eql('bob');
  });

  it('renders an output schema when there is an output schema', () => {
    const store = getEmptyStore();
    insertView(store);
    insertRevision(store);
    insertUpload(store);
    insertOutputSchema(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(3);
    expect(element.querySelector('[data-activity-type=outputschema] .createdBy').innerText).to.eql('fred');
  });

  it('renders an upsert job when there is an upsert job in progress', () => {
    const store = getEmptyStore();
    insertView(store);
    insertRevision(store);
    insertUpload(store);
    insertOutputSchema(store);
    insertUpsertInProgress(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(4);
    expect(element.querySelector('[data-activity-type=upsert] .createdBy').innerText).to.eql('foo');
  });

  it('renders an upsert job when there is an upsert job in complete', () => {
    const store = getEmptyStore();
    insertView(store);
    insertRevision(store);
    insertUpload(store);
    insertOutputSchema(store);
    insertUpsertComplete(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(5);
    assert.ok(element.querySelector('[data-activity-type=upsertcompleted]'));
  });

  it('renders an upsert job when there is an upsert job in complete', () => {
    const store = getEmptyStore();
    insertView(store);
    insertRevision(store);
    insertUpload(store);
    insertOutputSchema(store);
    insertUpsertFailed(store);

    const element = renderComponentWithStore(RecentActions, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(5);
    assert.ok(element.querySelector('[data-activity-type=upsertfailed]'));
  });

});

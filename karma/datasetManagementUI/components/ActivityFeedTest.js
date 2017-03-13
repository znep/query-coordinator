import ActivityFeed from 'components/ActivityFeed';
import { getEmptyStore } from '../testStore';
import {
  insertFromServer
} from 'actions/database';


function insertView(store) {
  store.dispatch(insertFromServer('views', {
    license: {},
    owner: {},
    viewCount: 0,
    downloadCount: 0,
    ownerName: 'foo',
    tags: [],
    description: ''
  }));
}

function insertUpdate(store) {
  store.dispatch(insertFromServer('updates', {
    id: 5,
    fourfour: 'hehe-hehe',
    update_seq: 0,
    inserted_at: new Date(),
    created_by: {
      display_name: 'rozap',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpload(store) {
  store.dispatch(insertFromServer('uploads', {
    id: 0,
    filename: 'foo.csv',
    inserted_at: new Date(),
    created_by: {
      display_name: 'bob',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertOutputSchema(store) {
  store.dispatch(insertFromServer('input_schemas', {
    upload_id: 0,
    id: 0
  }));
  store.dispatch(insertFromServer('output_schemas', {
    id: 0,
    input_schema_id: 0,
    inserted_at: new Date(),
    created_by: {
      display_name: 'fred',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpsertInProgress(store) {
  store.dispatch(insertFromServer('upsert_jobs', {
    status: 'progress',
    id: 0,
    finished_at: null,
    inserted_at: new Date(),
    created_by: {
      display_name: 'foo',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpsertComplete(store) {
  store.dispatch(insertFromServer('upsert_jobs', {
    status: 'successful',
    id: 0,
    finished_at: new Date(),
    inserted_at: new Date(),
    created_by: {
      display_name: 'foo',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

function insertUpsertFailed(store) {
  store.dispatch(insertFromServer('upsert_jobs', {
    status: 'failure',
    id: 0,
    finished_at: new Date(),
    inserted_at: new Date(),
    created_by: {
      display_name: 'foo',
      email: 'foo@bar.com',
      user_id: 'abba-cafe'
    }
  }));
}

describe('components/ActivityFeed', () => {
  it('renders nothing when there is nothing', () => {
    const store = getEmptyStore();
    insertView(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(0);
  });

  it('renders an update when there is an update', () => {
    const store = getEmptyStore();
    insertView(store);
    insertUpdate(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(1);
    expect(element.querySelector('.activity.update .created-by').innerText).to.eql('rozap');
  });

  it('renders an upload when there is an upload', () => {
    const store = getEmptyStore();
    insertView(store);
    insertUpdate(store);
    insertUpload(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(2);
    expect(element.querySelector('.activity.upload .created-by').innerText).to.eql('bob');
  });

  it('renders an output schema when there is an output schema', () => {
    const store = getEmptyStore();
    insertView(store);
    insertUpdate(store);
    insertUpload(store);
    insertOutputSchema(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(3);
    expect(element.querySelector('.activity.output-schema .created-by').innerText).to.eql('fred');
  });

  it('renders an upsert job when there is an upsert job in progress', () => {
    const store = getEmptyStore();
    insertView(store);
    insertUpdate(store);
    insertUpload(store);
    insertOutputSchema(store);
    insertUpsertInProgress(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(4);
    expect(element.querySelector('.activity.upsert-in-progress .created-by').innerText).to.eql('foo');
  });

  it('renders an upsert job when there is an upsert job in complete', () => {
    const store = getEmptyStore();
    insertView(store);
    insertUpdate(store);
    insertUpload(store);
    insertOutputSchema(store);
    insertUpsertComplete(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(5);
    expect(element.querySelector('.activity.upsert-complete')).to.exist
  });

  it('renders an upsert job when there is an upsert job in complete', () => {
    const store = getEmptyStore();
    insertView(store);
    insertUpdate(store);
    insertUpload(store);
    insertOutputSchema(store);
    insertUpsertFailed(store);

    const element = renderComponentWithStore(ActivityFeed, {}, store);
    expect(element.querySelectorAll('.activity').length).to.equal(5);
    expect(element.querySelector('.activity.upsert-failed')).to.exist
  });

});

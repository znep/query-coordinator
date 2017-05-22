import { expect, assert } from 'chai';
import ShowRevision from 'components/ShowRevision';
import { getEmptyStore, getDefaultStore } from '../testStore';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import {
  upsertFromServer
} from 'actions/database';
import ReactTestUtils from 'react-addons-test-utils';
import { mockFetch } from '../testHelpers/mockHTTP';


const PROPS = {
  view: {
    license: {},
    owner: {},
    viewCount: 0,
    downloadCount: 0,
    ownerName: 'foo',
    tags: []
  },
  routing: {
    locationBeforeTransitions: {
      pathname: "/dataset/qq/bjp2-6cwn/revisions/0",
      search: "",
      hash: "",
      action: "POP",
      key: null,
      query: {}
    }
  },
  db: {
  },
  params: {}
};

function insertView(store) {
  store.dispatch(upsertFromServer('views', {
    id: "hehe-hehe",
    name: "hehe",
    description: "meh",
    category: null,
    owner: {
      id: "abba-cafe",
      displayName: "me"
    },
    metadata: {
      rowLabel: 'row'
    },
    lastUpdatedAt: new Date(),
    dataLastUpdatedAt: new Date(),
    metadataLastUpdatedAt: new Date(),
    createdAt: new Date(),
    viewCount: 321,
    downloadCount: 42,
    license: {},
    attribution: "me",
    tags: [],
    attachments: []
  }));
}

describe('components/ShowRevision', () => {

  it('renders without errors', () => {
    const store = getEmptyStore();
    insertView(store);
    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);
  });

  it('renders the column component', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(upsertFromServer('uploads', { id: 1 }));
    store.dispatch(upsertFromServer('input_schemas', { id: 1, upload_id: 1 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 1 }));
    store.dispatch(upsertFromServer('output_schema_columns', { output_schema_id: 1, output_column_id: 1 }));

    store.dispatch(upsertFromServer('output_columns', {
      position: 0,
      id: 1,
      field_name: "Address",
      display_name: "Address",
      description: null,
      transform_id: 620,
      __status__: {
        type: "SAVED",
        savedAt: "ON_SERVER"
      }
    }));
    store.dispatch(upsertFromServer('transforms', {
      id: 620,
      output_soql_type: "text"
    }));

    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);

    expect(element.querySelectorAll('.column-summary').length).to.equal(1);
    expect(element.querySelectorAll('.column-summary .column-name')[0].innerText).to.equal('Address');
    expect(element.querySelectorAll('.column-summary .type-name')[0].innerText).to.equal('Plain Text');
  });

  it('renders preview data when there is an output schema', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(upsertFromServer('uploads', { id: 1 }));
    store.dispatch(upsertFromServer('input_schemas', { id: 1, upload_id: 1 }));
    store.dispatch(upsertFromServer('output_schemas', { id: 1, input_schema_id: 1 }));

    store.dispatch(upsertFromServer('output_schema_columns', { output_schema_id: 1, output_column_id: 1 }));
    store.dispatch(upsertFromServer('output_columns', {
      position: 0,
      id: 1,
      field_name: "Address",
      display_name: "Address",
      description: null,
      transform_id: 620,
      __status__: {
        type: "SAVED",
        savedAt: "ON_SERVER"
      }
    }));
    store.dispatch(upsertFromServer('transforms', {
      id: 620,
      output_soql_type: "text"
    }));

    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);
    assert.ok(element.querySelector('.reviewBtn'));
  });

  it('renders in progress when upsert is in progress', () => {
    const store = getStoreWithOutputSchema(getEmptyStore());
    insertView(store);
    store.dispatch(upsertFromServer('upsert_jobs', {
      id: 620,
      status: null
    }));

    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);
    assert.ok(element.querySelector('.tableInfo'));
    assert.ok(element.querySelector('.emailBtnRequest'));
  });

  it('tries to add an email interest when the email me button is pressed', (done) => {
    const store = getStoreWithOutputSchema(getEmptyStore());
    insertView(store);
    store.dispatch(upsertFromServer('upsert_jobs', {
      id: 620,
      status: null,
      job_uuid: "001679ae-42e2-472f-ab37-720f49576d54"
    }));

    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);
    assert.ok(element.querySelector('.tableInfo'));

    assert.ok(element.querySelector('.emailBtnRequest'));
    assert.isNull(element.querySelector('.emailBtnSuccess'));
    const { unmockFetch } = mockFetch({
      '/users/asdf-1234/email_interests.json': {
        POST: {
          response: {}
        }
      }
    });
    ReactTestUtils.Simulate.click(element.querySelector('.emailBtnRequest'));
    assert.ok(element.querySelector('.emailBtnBusy'));
    setTimeout(() => {
      assert.isNull(element.querySelector('.emailBtnRequest'));

      assert.ok(element.querySelector('.emailBtnSuccess'));
      unmockFetch();
      done();
    }, 0);
  });

  it('renders the email me button as an error when the call to email_interests fails', (done) => {
    const store = getStoreWithOutputSchema(getEmptyStore());
    insertView(store);
    store.dispatch(upsertFromServer('upsert_jobs', {
      id: 620,
      status: null,
      job_uuid: "001679ae-42e2-472f-ab37-720f49576d54"
    }));

    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);
    assert.ok(element.querySelector('.tableInfo'));

    assert.ok(element.querySelector('.emailBtnRequest'));
    assert.isNull(element.querySelector('.emailBtnError'));
    const { unmockFetch } = mockFetch({
      '/users/asdf-1234/email_interests.json': {
        POST: {
          status: 404,
          response: {}
        }
      }
    });
    ReactTestUtils.Simulate.click(element.querySelector('.emailBtnRequest'));
    setTimeout(() => {
      assert.isNull(element.querySelector('.emailBtnRequest'));
      assert.ok(element.querySelector('.emailBtnError'));
      unmockFetch();
      done();
    }, 0);
  });

  it('renders the table when the upsert is complete', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(upsertFromServer('uploads', {id: 1}));
    store.dispatch(upsertFromServer('input_schemas', {id: 1, upload_id: 1}));
    store.dispatch(upsertFromServer('output_schemas', {id: 1, input_schema_id: 1}));

    store.dispatch(upsertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}));
    store.dispatch(upsertFromServer('output_columns', {
      position: 0,
      id: 1,
      field_name: "Address",
      display_name: "Address",
      description: null,
      transform_id: 620,
      __status__: {
        type: "SAVED",
        savedAt: "ON_SERVER"
      }
    }));
    store.dispatch(upsertFromServer('transforms', {
      id: 620,
      output_soql_type: "text"
    }));
    store.dispatch(upsertFromServer('upsert_jobs', {
      id: 620,
      status: "successful"
    }));

    const element = renderComponentWithStore(ShowRevision, PROPS, store);
    assert.ok(element);
    assert.ok(element.querySelector('.socrata-paginated-table'));
  });
});

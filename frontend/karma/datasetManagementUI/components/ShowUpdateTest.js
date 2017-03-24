import ShowUpdate from 'components/ShowUpdate';
import { getEmptyStore, getDefaultStore } from '../testStore';
import { getStoreWithOutputSchema } from '../data/storeWithOutputSchema';
import {
  insertFromServer
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
      pathname: "/dataset/qq/bjp2-6cwn/updates/0",
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
  store.dispatch(insertFromServer('views', {
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

describe('components/ShowUpdate', () => {

  it('renders without errors', () => {
    const store = getEmptyStore();
    insertView(store);
    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;
  });

  it('renders the column component', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', { id: 1 }));
    store.dispatch(insertFromServer('input_schemas', { id: 1, upload_id: 1 }));
    store.dispatch(insertFromServer('output_schemas', { id: 1, input_schema_id: 1 }));
    store.dispatch(insertFromServer('output_schema_columns', { output_schema_id: 1, output_column_id: 1 }));

    store.dispatch(insertFromServer('output_columns', {
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
    store.dispatch(insertFromServer('transforms', {
      id: 620,
      output_soql_type: "SoQLText"
    }));

    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;

    expect(element.querySelectorAll('.column-summary').length).to.equal(1);
    expect(element.querySelectorAll('.column-summary .column-name')[0].innerText).to.equal('Address');
    expect(element.querySelectorAll('.column-summary .type-name')[0].innerText).to.equal('Plain Text');
  });

  it('renders preview data when there is an output schema', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', { id: 1 }));
    store.dispatch(insertFromServer('input_schemas', { id: 1, upload_id: 1 }));
    store.dispatch(insertFromServer('output_schemas', { id: 1, input_schema_id: 1 }));

    store.dispatch(insertFromServer('output_schema_columns', { output_schema_id: 1, output_column_id: 1 }));
    store.dispatch(insertFromServer('output_columns', {
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
    store.dispatch(insertFromServer('transforms', {
      id: 620,
      output_soql_type: "SoQLText"
    }));

    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;
    expect(element.querySelector('.view-output-schema')).to.exist;
  });

  it('renders in progress when upsert is in progress', () => {
    const store = getStoreWithOutputSchema(getEmptyStore());
    insertView(store);
    store.dispatch(insertFromServer('upsert_jobs', {
      id: 620,
      status: null
    }));

    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;
    expect(element.querySelector('.upsert-in-progress')).to.exist;
    expect(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn')).to.exist;
  });

  it('tries to add an email interest when the email me button is pressed', (done) => {
    const store = getStoreWithOutputSchema(getEmptyStore());
    insertView(store);
    store.dispatch(insertFromServer('upsert_jobs', {
      id: 620,
      status: null,
      job_uuid: "001679ae-42e2-472f-ab37-720f49576d54"
    }));

    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;
    expect(element.querySelector('.upsert-in-progress')).to.exist;

    expect(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn')).to.exist;
    expect(element.querySelector('.btn.btn-success.email-interest-btn')).to.not.exist;
    const { unmockFetch } = mockFetch({
      '/users/asdf-1234/email_interests.json': {
        POST: {
          response: {}
        }
      }
    });
    ReactTestUtils.Simulate.click(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn'));
    expect(element.querySelector('.btn.btn-primary.btn-busy.email-interest-btn')).to.exist;
    setTimeout(() => {
      expect(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn')).to.not.exist;

      expect(element.querySelector('.btn.btn-success.email-interest-btn')).to.exist;
      unmockFetch();
      done();
    }, 0);
  });

  it('renders the email me button as an error when the call to email_interests fails', (done) => {
    const store = getStoreWithOutputSchema(getEmptyStore());
    insertView(store);
    store.dispatch(insertFromServer('upsert_jobs', {
      id: 620,
      status: null,
      job_uuid: "001679ae-42e2-472f-ab37-720f49576d54"
    }));

    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;
    expect(element.querySelector('.upsert-in-progress')).to.exist;

    expect(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn')).to.exist;
    expect(element.querySelector('.btn.btn-error.email-interest-btn')).to.not.exist;
    const { unmockFetch } = mockFetch({
      '/users/asdf-1234/email_interests.json': {
        POST: {
          status: 404,
          response: {}
        }
      }
    });
    ReactTestUtils.Simulate.click(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn'));
    setTimeout(() => {
      expect(element.querySelector('.btn.btn-primary.btn-inverse.email-interest-btn')).to.not.exist;
      expect(element.querySelector('.btn.btn-error.email-interest-btn')).to.exist;
      unmockFetch();
      done();
    }, 0);
  });

  it('renders the table when the upsert is complete', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', {id: 1}));
    store.dispatch(insertFromServer('input_schemas', {id: 1, upload_id: 1}));
    store.dispatch(insertFromServer('output_schemas', {id: 1, input_schema_id: 1}));

    store.dispatch(insertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}));
    store.dispatch(insertFromServer('output_columns', {
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
    store.dispatch(insertFromServer('transforms', {
      id: 620,
      output_soql_type: "SoQLText"
    }));
    store.dispatch(insertFromServer('upsert_jobs', {
      id: 620,
      status: "successful"
    }));

    const element = renderComponentWithStore(ShowUpdate, PROPS, store);
    expect(element).to.exist;
    expect(element.querySelector('.socrata-paginated-table')).to.exist;
  });
});
import ShowUpdate from 'components/ShowUpdate';
import { getEmptyStore, getDefaultStore } from '../testStore';
import {
  insertFromServer
} from 'actions/database';

function insertView(store) {
  store.dispatch(insertFromServer('views', {
    id: "hehe-hehe",
    name: "hehe",
    description: "meh",
    category: null,
    owner: "me",
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
    const props = {
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
      db: {}
    };
    const store = getEmptyStore();
    insertView(store);
    const element = renderComponentWithStore(ShowUpdate, props, store);
    expect(element).to.exist;
  });

  it('renders the column component', () => {
    const props = {
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
      }
    };

    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', {id: 1}))
    store.dispatch(insertFromServer('input_schemas', {id: 1, upload_id: 1}))
    store.dispatch(insertFromServer('output_schemas', {id: 1, input_schema_id: 1}))
    store.dispatch(insertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}))

    store.dispatch(insertFromServer('output_columns', {
      "position": 0,
      "id": 1,
      "field_name": "Address",
      "display_name": "Address",
      "description": null,
      "transform_id": 620,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      }
    }));
    store.dispatch(insertFromServer('transforms', {
      "id": 620,
      "output_soql_type": "SoQLText"
    }));

    const element = renderComponentWithStore(ShowUpdate, props, store);
    expect(element).to.exist;

    expect(element.querySelectorAll('.column-summary').length).to.equal(1)
    expect(element.querySelectorAll('.column-summary .column-name')[0].innerText).to.equal('Address')
    expect(element.querySelectorAll('.column-summary .type-name')[0].innerText).to.equal('Plain Text')
  });

  it('renders preview data when there is an output schema', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', {id: 1}))
    store.dispatch(insertFromServer('input_schemas', {id: 1, upload_id: 1}))
    store.dispatch(insertFromServer('output_schemas', {id: 1, input_schema_id: 1}))

    store.dispatch(insertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}))
    store.dispatch(insertFromServer('output_columns', {
      "position": 0,
      "id": 1,
      "field_name": "Address",
      "display_name": "Address",
      "description": null,
      "transform_id": 620,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      }
    }))
    store.dispatch(insertFromServer('transforms', {
      "id": 620,
      "output_soql_type": "SoQLText"
    }))

    const element = renderComponentWithStore(ShowUpdate, {}, store);
    expect(element).to.exist;
    expect(element.querySelector('.view-output-schema')).to.exist;
  });

  it('renders in progress when upsert is in progress', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', {id: 1}))
    store.dispatch(insertFromServer('input_schemas', {id: 1, upload_id: 1}))
    store.dispatch(insertFromServer('output_schemas', {id: 1, input_schema_id: 1}))

    store.dispatch(insertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}))
    store.dispatch(insertFromServer('output_columns', {
      "position": 0,
      "id": 1,
      "field_name": "Address",
      "display_name": "Address",
      "description": null,
      "transform_id": 620,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      }
    }))
    store.dispatch(insertFromServer('transforms', {
      "id": 620,
      "output_soql_type": "SoQLText"
    }))
    store.dispatch(insertFromServer('upsert_jobs', {
      "id": 620,
      "status": "in_progress"
    }))

    const element = renderComponentWithStore(ShowUpdate, {}, store);
    expect(element).to.exist;
    expect(element.querySelector('.upsert-in-progress')).to.exist;
  });

  it('renders the table when the upsert is complete', () => {
    const store = getEmptyStore();
    insertView(store);
    store.dispatch(insertFromServer('uploads', {id: 1}))
    store.dispatch(insertFromServer('input_schemas', {id: 1, upload_id: 1}))
    store.dispatch(insertFromServer('output_schemas', {id: 1, input_schema_id: 1}))

    store.dispatch(insertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}))
    store.dispatch(insertFromServer('output_columns', {
      "position": 0,
      "id": 1,
      "field_name": "Address",
      "display_name": "Address",
      "description": null,
      "transform_id": 620,
      "__status__": {
        "type": "SAVED",
        "savedAt": "ON_SERVER"
      }
    }))
    store.dispatch(insertFromServer('transforms', {
      "id": 620,
      "output_soql_type": "SoQLText"
    }))
    store.dispatch(insertFromServer('upsert_jobs', {
      "id": 620,
      "status": "successful"
    }))

    const element = renderComponentWithStore(ShowUpdate, {}, store);
    expect(element).to.exist;
    expect(element.querySelector('.socrata-paginated-table')).to.exist;
  });
});

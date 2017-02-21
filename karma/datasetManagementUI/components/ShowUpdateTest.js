import { ShowUpdate } from 'components/ShowUpdate';
import { getDefaultStore } from '../testStore';
import {
  insertFromServer
} from 'actions/database';

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

    const element = renderComponentWithStore(ShowUpdate, props);
    expect(element).to.exist;
  });

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
      db: {
      }
    };

    const store = getDefaultStore();
    store.dispatch(insertFromServer('output_schemas', {id: 1}));
    store.dispatch(insertFromServer('output_schema_columns', {output_schema_id: 1, output_column_id: 1}));
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

    expect(element.querySelectorAll('.column-summary').length).to.equal(1);
    expect(element.querySelectorAll('.column-summary .column-name')[0].innerText).to.equal('Address');
    expect(element.querySelectorAll('.column-summary .type-name')[0].innerText).to.equal('Plain Text');

  });
});

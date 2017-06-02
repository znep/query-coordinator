import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import HomePaneSidebar, { ManageData } from 'components/HomePaneSidebar';
import { getEmptyStore } from '../testStore';
import {
  upsertFromServer
} from 'actions/database';

describe('components/HomePaneSidebar', () => {
  it('shows a disabled \'Describe Columns\' button if columnsExist is falsey', () => {
    const defaultProps = {
      "db": {
        "__loads__": {},
        "views": {
          "s396-jk8m": {
            "id": "s396-jk8m",
            "name": "vsgfdfg",
            "viewCount": 0,
            "downloadCount": 0,
            "license": {},
            "__status__": {
              "type": "SAVED",
              "savedAt": "ON_SERVER"
            }
          }
        },
        "updates": {},
        "uploads": {},
        "input_schemas": {},
        "output_schemas": {},
        "input_columns": {},
        "output_columns": {},
        "output_schema_columns": {},
        "transforms": {},
        "upsert_jobs": {},
        "email_interests": {},
        "row_errors": {}
      },
      "columnsExist": false
    };

    const component = shallow(<ManageData {...defaultProps}/>);

    assert.isOk(component.find('button').first().prop('disabled'));
  });

  it('shows 0 checkmarks when nothing is done', () => {
    const store = getEmptyStore();
    store.dispatch(upsertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: ''
    }));

    const props = {
      urlParams: {
        sidebarSelection: null
      }
    };

    const element = renderComponentWithStore(HomePaneSidebar, props, store);
    expect(element.querySelectorAll('span.finished').length).to.equal(0);
  });

  it('shows one checkmark when there is column metadata', () => {
    const store = getEmptyStore();
    store.dispatch(upsertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: 'bar'
    }));
    store.dispatch(upsertFromServer('uploads', { id: 'baz' }));
    store.dispatch(upsertFromServer('output_schemas', { id: 'baz', created_at: new Date() }));
    store.dispatch(upsertFromServer('output_columns', { id: 'baz', description: 'xkcd' }));
    store.dispatch(upsertFromServer('output_schema_columns', {
      output_schema_id: 'baz',
      output_column_id: 'baz'
    }));

    const props = {
      urlParams: {
        sidebarSelection: null
      }
    };

    const element = renderComponentWithStore(HomePaneSidebar, props, store);
    expect(element.querySelectorAll('.socrata-icon-checkmark-alt').length).to.equal(1);
  });

  it('shows the activity feed when the url says to', () => {
    const store = getEmptyStore();
    store.dispatch(upsertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: ''
    }));

    const props = {
      urlParams: {
        sidebarSelection: 'log'
      }
    };

    const element = renderComponentWithStore(HomePaneSidebar, props, store);
    assert.ok(element.querySelectorAll('.activity-feed'));
  });
});

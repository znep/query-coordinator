import HomePaneSidebar from 'components/HomePaneSidebar';
import { getEmptyStore } from '../testStore';
import {
  insertFromServer
} from 'actions/database';

describe('components/HomePaneSidebar', () => {
  it('shows 0 checkmarks when nothing is done', () => {
    const store = getEmptyStore();
    store.dispatch(insertFromServer('views', {
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
    store.dispatch(insertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: 'bar'
    }));
    store.dispatch(insertFromServer('uploads', { id: 'baz' }));
    store.dispatch(insertFromServer('output_schemas', { id: 'baz', inserted_at: new Date() }));
    store.dispatch(insertFromServer('output_columns', { id: 'baz', description: 'xkcd' }));
    store.dispatch(insertFromServer('output_schema_columns', {
      output_schema_id: 'baz',
      output_column_id: 'baz'
    }));

    const props = {
      urlParams: {
        sidebarSelection: null
      }
    };

    const element = renderComponentWithStore(HomePaneSidebar, props, store);
    expect(element.querySelectorAll('span.finished').length).to.equal(1);
  });

  it('shows the activity feed when the url says to', () => {
    const store = getEmptyStore();
    store.dispatch(insertFromServer('views', {
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
    expect(element.querySelectorAll('.activity-feed')).to.exist;
  });
});
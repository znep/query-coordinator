import MetadataSidebar from 'components/MetadataSidebar';
import { getEmptyStore } from '../testStore';
import {
  insertFromServer
} from 'actions/database';

const PROPS = {
  urlParams: {}
}

describe('components/MetadataSidebar', () => {
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
    const element = renderComponentWithStore(MetadataSidebar, PROPS, store);
    expect(element.querySelectorAll('i.finished').length).to.equal(0);
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
    }
    const element = renderComponentWithStore(MetadataSidebar, props, store);
    expect(element.querySelectorAll('.activity-feed')).to.exist;
  });

  it('shows one checkmark when there is an upload', () => {
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
    store.dispatch(insertFromServer('uploads', { id: 'dummy' }));
    const element = renderComponentWithStore(MetadataSidebar, PROPS, store);
    expect(element.querySelectorAll('i.finished').length).to.equal(1);
  });

  it('shows one checkmark when dataset has a description', () => {
    const store = getEmptyStore();
    store.dispatch(insertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: 'durp'
    }));
    const element = renderComponentWithStore(MetadataSidebar, PROPS, store);
    expect(element.querySelectorAll('i.finished').length).to.equal(1);
  });

  it('shows three checkmarks when there\'s dataset metadata, an upload, & column metadata', () => {
    const store = getEmptyStore();
    store.dispatch(insertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: 'durp'
    }));
    store.dispatch(insertFromServer('uploads', { id: 'dummy' }));
    store.dispatch(insertFromServer('output_schemas', { id: 'dummy', inserted_at: new Date() }));
    store.dispatch(insertFromServer('output_columns', { id: 'dummy', description: 'blurp' }));
    store.dispatch(insertFromServer('output_schema_columns', {
      output_schema_id: 'dummy',
      output_column_id: 'dummy'
    }));
    const element = renderComponentWithStore(MetadataSidebar, PROPS, store);
    expect(element.querySelectorAll('i.finished').length).to.equal(3);
  });
});

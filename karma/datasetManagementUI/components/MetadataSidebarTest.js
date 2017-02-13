import MetadataSidebar from 'components/MetadataSidebar';
import { getEmptyStore } from '../testStore';
import {
  insertFromServer
} from 'actions/database';

const ROUTING = {
  locationBeforeTransitions: {
    pathname: "/dataset/qq/bjp2-6cwn/updates/0",
    search: "",
    hash: "",
    action: "POP",
    key: null,
    query: {}
  }
}

describe('components/MetadataSidebar', () => {
  it('renders without checkmarks', () => {
    const props = {
      db: {
        views: [{
          license: {},
          owner: {},
          viewCount: 0,
          downloadCount: 0,
          ownerName: 'foo',
          tags: []
        }],
        uploads: []
      },
      routing: ROUTING
    };

    const element = renderComponentWithStore(MetadataSidebar, props, getEmptyStore());
    expect(element.querySelectorAll('i.finished').length).to.equal(1)
  });

  it('renders with checkmarks', () => {
    const props = {
      db: {
        views: [{
          license: {},
          owner: {},
          viewCount: 0,
          downloadCount: 0,
          ownerName: 'foo',
          tags: [],
          description: 'aiosfjiosajiofaiosjfioajsfioajsfiojasiojfasiojf'
        }],
        uploads: [

        ]
      },
      routing: ROUTING
    };
    const store = getEmptyStore();
    store.dispatch(insertFromServer('views', {
      license: {},
      owner: {},
      viewCount: 0,
      downloadCount: 0,
      ownerName: 'foo',
      tags: [],
      description: 'aiosfjiosajiofaiosjfioajsfioajsfiojasiojfasiojf'
    }))
    store.dispatch(insertFromServer('uploads', {id: 'dummy'}))

    const element = renderComponentWithStore(MetadataSidebar, props, store);
    expect(element.querySelectorAll('i.finished').length).to.equal(3)
  });
});

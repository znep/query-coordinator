import { ShowUpdate } from 'components/ShowUpdate';

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
      }
    };

    const element = renderComponentWithStore(ShowUpdate, props);
    expect(element).to.exist;
  });
});

import PopularViewList from 'containers/PopularViewList';
import { getDefaultStore } from 'testStore';

describe('containers/PopularViewList', function() {
  beforeEach(function() {
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<PopularViewList isDesktop={true} store={store} />);
    this.state = store.getState();
    this.output = renderer.getRenderOutput();
  });

  it('sets list prop', function() {
    expect(this.output.props.list).to.deep.equal(this.state.popularViews.list);
  });

  it('sets hasMore prop', function() {
    expect(this.output.props.hasMore).to.equal(this.state.popularViews.hasMore);
  });

  it('sets isLoading prop', function() {
    expect(this.output.props.isLoading).to.equal(this.state.popularViews.isLoading);
  });

  it('sets isCollapsed prop', function() {
    expect(this.output.props.isCollapsed).to.equal(this.state.popularViews.isCollapsed);
  });
});

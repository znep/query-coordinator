import FeaturedViewList from 'containers/FeaturedViewList';
import { getDefaultStore } from 'testStore';

describe('containers/FeaturedViewList', function() {
  beforeEach(function() {
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<FeaturedViewList store={store} />);
    this.state = store.getState();
    this.output = renderer.getRenderOutput();
  });

  it('sets list prop', function() {
    expect(this.output.props.list).to.deep.equal(this.state.featuredViews.list);
  });

  it('sets hasMore prop', function() {
    expect(this.output.props.hasMore).to.equal(this.state.featuredViews.hasMore);
  });

  it('sets isLoading prop', function() {
    expect(this.output.props.isLoading).to.equal(this.state.featuredViews.isLoading);
  });

  it('sets isCollapsed prop', function() {
    expect(this.output.props.isCollapsed).to.equal(this.state.featuredViews.isCollapsed);
  });
});

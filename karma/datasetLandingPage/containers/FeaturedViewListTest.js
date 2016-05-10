import FeaturedViewList from 'containers/FeaturedViewList';
import { getDefaultStore } from 'testStore';

describe('containers/FeaturedViewList', function() {
  it('passes the current set of featured views to the component', function() {
    var store = getDefaultStore();
    var featuredViews = store.getState().featuredViews;

    var renderer = TestUtils.createRenderer();
    renderer.render(<FeaturedViewList store={store}/>);
    var output = renderer.getRenderOutput();

    expect(output.props.featuredViews).to.deep.equal(featuredViews);
  });
});

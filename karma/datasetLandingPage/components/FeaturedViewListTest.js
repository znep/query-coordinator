import { FeaturedViewList } from 'components/FeaturedViewList';
import { getDefaultStore } from 'testStore';
import mockFeaturedView from 'data/mockFeaturedView';

describe('components/FeaturedViewList', function() {
  // we need to provide a store because this component has a nested smart component
  it('renders an element', function() {
    var mockFeaturedViews = _.times(3, _.constant(mockFeaturedView));
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<FeaturedViewList store={store} featuredViews={mockFeaturedViews} />);
    var output = renderer.getRenderOutput();

    expect(output).to.exist;
  });
});

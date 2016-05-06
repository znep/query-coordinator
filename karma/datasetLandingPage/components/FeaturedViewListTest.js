import FeaturedViewList from 'components/FeaturedViewList';
import mockFeaturedView from 'data/mockFeaturedView';

describe('components/FeaturedViewList', function() {
  it('renders an element', function() {
    var element = renderComponent(FeaturedViewList, {
      featuredViews: _.times(3, _.constant(mockFeaturedView))
    });

    expect(element).to.exist;
  });
});

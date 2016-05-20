import { FeaturedView } from 'components/FeaturedView';
import mockFeaturedView from 'data/mockFeaturedView';

describe('components/FeaturedView', function() {
  it('renders an element', function() {
    var element = renderComponent(FeaturedView, mockFeaturedView);
    expect(element).to.exist;
  });
});

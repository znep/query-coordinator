import { FeaturedContent } from 'components/FeaturedContent';

describe('components/FeaturedContent', () => {
  function featuredContentProps(featuredContent = {}) {
    return { featuredContent };
  }

  it('renders nothing if there is no featured content', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps());
    assert.isNull(element);
  });

  it('renders a featured content section', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps({
      item0: { position: 0, name: 'Arnold' }
    }));
    assert.isNotNull(element);
    assert.match(element.className, /landing-page-section/);
    assert.match(element.className, /featured-content/);
  });

  it('renders a featured content header', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps({
      item0: { position: 0, name: 'The Terminator' }
    }));
    const header = element.querySelector('.landing-page-section-header');
    assert.isNotNull(header);
    assert.equal(header.textContent, 'Featured Content in this Category');
  });

  it('renders multiple featured content view cards', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps({
      item0: { position: 0, name: 'Chuck Norris' },
      item1: { position: 1, name: 'Bruce Lee' },
      item2: { position: 2, name: 'Tom Hanks' }
    }));
    const results = element.querySelector('.media-results');
    assert.isNotNull(results);
    assert.lengthOf(results.querySelectorAll('.view-card'), 3);
  });
});

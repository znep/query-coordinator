import { FeaturedContentViewCard } from 'components/FeaturedContentViewCard';

describe('components/FeaturedContentViewCard', () => {
  function getProps(props = {}) {
    return {
      contentType: 'internal',
      description: 'Dino Nuggets',
      displayType: 'table',
      isPrivate: false,
      name: 'Dinosaurs',
      position: 0,
      resource_id: 0,
      viewCount: 100,
      ...props
    };
  }

  it('renders an internal ViewCard with the supplied props', () => {
    const element = renderComponent(FeaturedContentViewCard, getProps());
    assert.isNotNull(element);
    assert.isNull(element.querySelector('a[rel~="external"]'));
  });

  it('renders an external ViewCard with the supplied props', () => {
    const element = renderComponent(FeaturedContentViewCard, getProps({
      contentType: 'external'
    }));
    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('a[rel~="external"]'));
  });
});

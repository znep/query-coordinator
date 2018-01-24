import { expect, assert } from 'chai';
import { FeaturedContentViewCard } from 'catalogLandingPage/components/FeaturedContentViewCard';

describe('components/FeaturedContentViewCard', () => {
  const getProps = (props = {}) => {
    return {
      contentType: 'internal',
      description: 'Dino Nuggets',
      isPrivate: false,
      metadataLeft: 'March 13, 2017',
      metadataRight: '1,000 Views',
      name: 'Dinosaurs',
      resource_id: 0,
      url: '/view/test',
      ...props
    };
  };

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

  describe('internal ViewCards', () => {
    it('renders a title and description', () => {
      const element = renderComponent(FeaturedContentViewCard, getProps());
      assert.equal(element.querySelector('h3.entry-name').textContent, 'Dinosaurs');
      assert.equal(element.querySelector('div.entry-description').textContent, 'Dino Nuggets');
    });

    it('renders the date and view count', () => {
      const element = renderComponent(FeaturedContentViewCard, getProps());
      assert.equal(element.querySelector('.entry-meta .first').textContent, 'March 13, 2017');
      assert.equal(element.querySelector('.entry-meta .second').textContent, '1,000 Views');
    });
  });
});

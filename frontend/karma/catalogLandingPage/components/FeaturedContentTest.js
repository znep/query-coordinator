import { expect, assert } from 'chai';
import sinon from 'sinon';
import { FeaturedContent } from 'catalogLandingPage/components/FeaturedContent';
import _ from 'lodash';

describe('components/FeaturedContent', () => {
  function featuredContentProps(props = {}) {
    return {
      catalogQuery: { category: 'Government' },
      featuredContent: {},
      onFeaturedContentItemClick: _.noop,
      onFeaturedContentRendered: _.noop,
      ...props
    };
  }

  it('renders nothing if there is no featured content', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps());
    assert.isNull(element);
  });

  it('renders a featured content section', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps({
      featuredContent: {
        item0: { position: 0, name: 'Arnold' }
      }
    }));
    assert.isNotNull(element);
    assert.match(element.className, /landing-page-section/);
    assert.match(element.className, /featured-content/);
  });

  it('renders a featured content header', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps({
      featuredContent: {
        item0: { position: 0, name: 'The Terminator' }
      }
    }));
    const header = element.querySelector('.landing-page-section-header');
    assert.isNotNull(header);
    assert.match(header.textContent, /Featured Content/);
  });

  it('renders multiple featured content view cards', () => {
    const element = renderComponent(FeaturedContent, featuredContentProps({
      featuredContent: {
        item0: { position: 0, name: 'Chuck Norris' },
        item1: { position: 1, name: 'Bruce Lee' },
        item2: { position: 2, name: 'Tom Hanks' }
      }
    }));
    const results = element.querySelector('.media-results');
    assert.isNotNull(results);
    assert.lengthOf(results.querySelectorAll('.view-card'), 3);
  });

  it('does not call onFeaturedContentRendered if there is no featured content', () => {
    const spy = sinon.spy();
    const element = renderComponent(FeaturedContent, featuredContentProps({
      onFeaturedContentRendered: spy
    }));
    sinon.assert.notCalled(spy);
  });

  it('calls onFeaturedContentRendered on render if there is featured content', () => {
    const spy = sinon.spy();
    const element = renderComponent(FeaturedContent, featuredContentProps({
      featuredContent: {
        item0: { position: 0, name: 'Arnold' }
      },
      onFeaturedContentRendered: spy
    }));
    sinon.assert.called(spy);
  });

  it('calls onFeaturedContentItemClick on click of the item title', () => {
    const spy = sinon.spy();
    const element = renderComponent(FeaturedContent, featuredContentProps({
      featuredContent: {
        item0: { position: 0, name: 'Arnold' }
      },
      onFeaturedContentItemClick: spy
    }));
    TestUtils.Simulate.click(element.querySelector('.entry-name a'));
    sinon.assert.called(spy);
  });

  it('calls onFeaturedContentItemClick on click of the item image', () => {
    const spy = sinon.spy();
    const element = renderComponent(FeaturedContent, featuredContentProps({
      featuredContent: {
        item0: { position: 0, name: 'Arnold' }
      },
      onFeaturedContentItemClick: spy
    }));
    TestUtils.Simulate.click(element.querySelector('.entry-main .img-wrapper'));
    sinon.assert.called(spy);
  });
});

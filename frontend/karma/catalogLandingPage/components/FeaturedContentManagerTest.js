import sinon from 'sinon';
import { expect, assert } from 'chai';
import { FeaturedContentManager } from 'components/FeaturedContentManager';
import ceteraUtils from 'common/cetera/utils';
import _ from 'lodash';

describe('components/FeaturedContentManager', () => {
  const getProps = (props = {}) => {
    return {
      assetSelectorTitle: 'Select Featured Content',
      catalogQuery: {
        category: 'Fun'
      },
      featuredContent: {
        item0: { contentType: 'internal', name: 'Bob Ross', position: 0, url: 'http://bobross.com' }
      },
      setFeaturedContentItem: _.noop,
      ...props
    };
  };

  beforeEach(() => {
    sinon.stub(ceteraUtils, 'query').callsFake(_.constant(Promise.resolve({
      results: [],
      resultSetSize: 0
    })))
  });

  afterEach(() => {
    ceteraUtils.query.restore();
  });

  it('renders a FeaturedContentManager', () => {
    const element = renderComponentWithStore(FeaturedContentManager, getProps());
    assert.isNotNull(element);
    assert.match(element.className, /featured-content/);
  });

  describe('media-results', () => {
    it('renders at most 3 cards', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps({
        featuredContent: {
          item0: { contentType: 'internal', name: 'Bob Ross', position: 0, url: 'http://bobross.com' },
          item1: { contentType: 'internal', name: 'Bob Ross', position: 1, url: 'http://bobross.com' },
          item2: { contentType: 'internal', name: 'Bob Ross', position: 2, url: 'http://bobross.com' },
          item3: { contentType: 'internal', name: 'Bob Ross', position: 3, url: 'http://bobross.com' },
          item4: { contentType: 'internal', name: 'Bob Ross', position: 4, url: 'http://bobross.com' },
          item5: { contentType: 'internal', name: 'Bob Ross', position: 5, url: 'http://bobross.com' }
        }
      }));
      assert.lengthOf(element.querySelectorAll('.result-card'), 3);
    });

    it('renders 3 placeholders if there is no featuredContent', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps({ featuredContent: {} }));
      assert.lengthOf(element.querySelectorAll('.result-card.placeholder'), 3);
    });

    it('renders 2 placeholders if there is only 1 featuredContent card', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps());
      assert.lengthOf(element.querySelectorAll('.result-card'), 3);
      assert.lengthOf(element.querySelectorAll('.result-card.placeholder'), 2);
    });
  });

  describe('Asset Selector', () => {
    it('opens when the FeaturedContentViewCardPlaceholder Add button is clicked', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps());
      assert.isNull(element.querySelector('.asset-selector'));
      TestUtils.Simulate.click(element.querySelector('.add-button'));
      assert.isNotNull(element.querySelector('.asset-selector'));
    });

    it('opens when the FeaturedContentViewCardManager Change button is clicked', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps());
      assert.isNull(element.querySelector('.asset-selector'));
      TestUtils.Simulate.click(element.querySelector('.change-button'));
      assert.isNotNull(element.querySelector('.asset-selector'));
    });

    it('closes when the AssetSelector back button is clicked', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps());
      TestUtils.Simulate.click(element.querySelector('.change-button'));
      assert.isNotNull(element.querySelector('.asset-selector'));
      // Click back button
      TestUtils.Simulate.click(element.querySelector('.asset-selector .back-button'));
      assert.isNull(element.querySelector('.asset-selector'));
    });
  });

  describe('External Resource Editor', () => {
    it('opens when the "Feature an External Resource" button in Asset Selector is clicked', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps());
      // Open Asset Selector
      TestUtils.Simulate.click(element.querySelector('.add-button'));
      assert.isNotNull(element.querySelector('.asset-selector'));
      assert.isNull(element.querySelector('.external-resource-editor'));
      // Open External Resource Editor
      TestUtils.Simulate.click(element.querySelector('.external-resource-wizard-button'));
      assert.isNull(element.querySelector('.asset-selector'));
      assert.isNotNull(element.querySelector('.external-resource-editor'));
    });

    it('closes when the back button is clicked', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps());
      // Open Asset Selector
      TestUtils.Simulate.click(element.querySelector('.add-button'));
      // Open External Resource Editor
      TestUtils.Simulate.click(element.querySelector('.external-resource-wizard-button'));
      assert.isNull(element.querySelector('.asset-selector'));
      assert.isNotNull(element.querySelector('.external-resource-editor'));
      // Click back button
      TestUtils.Simulate.click(element.querySelector('.external-resource-editor .back-button'));
      assert.isNotNull(element.querySelector('.asset-selector'));
      assert.isNull(element.querySelector('.external-resource-editor'));
    });

    it('populates inputs with existing external content', () => {
      const element = renderComponentWithStore(FeaturedContentManager, getProps({
        featuredContent: {
          item0: {
            contentType: 'external',
            description: 'Painter',
            name: 'External Bob Ross',
            position: 0,
            url: 'http://bobross.com'
          }
        }
      }));
      TestUtils.Simulate.click(element.querySelector('.change-button'));
      // Since we're editing a view card with existing external content, it should open
      // directly to the External Resource Editor, not the Asset Selector.
      assert.isNotNull(element.querySelector('.external-resource-editor'));
      assert.equal(element.querySelector('input.title').value, 'External Bob Ross');
      assert.equal(element.querySelector('input.description').value, 'Painter');
      assert.equal(element.querySelector('input.url').value, 'http://bobross.com');
    });

    it('calls setFeaturedContentItem when the select button is clicked', () => {
      const spy = sinon.spy();
      const element = renderComponentWithStore(FeaturedContentManager, getProps({
        featuredContent: {},
        setFeaturedContentItem: spy
      }));
      TestUtils.Simulate.click(element.querySelector('.add-button'));
      TestUtils.Simulate.click(element.querySelector('.external-resource-wizard-button'));

      const titleInput = element.querySelector('input.title');
      titleInput.value = 'Bruce Lee';
      TestUtils.Simulate.change(titleInput);

      const urlInput = element.querySelector('input.url');
      urlInput.value = 'http://brucelee.com';
      TestUtils.Simulate.change(urlInput);

      TestUtils.Simulate.click(element.querySelector('button.select-button'));

      sinon.assert.called(spy);
    });
  });
});

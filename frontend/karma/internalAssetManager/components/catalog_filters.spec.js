import { assert } from 'chai';
import { CatalogFilters} from 'components/catalog_filters';
import { FeatureFlags } from 'common/feature_flags';
import sinon from 'sinon';

describe('components/CatalogFilters', () => {
  before(() => {
    FeatureFlags.useTestFixture({ stories_enabled: true, enable_internal_asset_manager_my_assets: true });
  })

  const catalogFiltersProp = (options = {}) => ({
    assetTypes: null,
    authority: null,
    changeAssetType: () => undefined,
    changeAuthority: () => undefined,
    changeCategory: () => undefined,
    changeOwner: () => undefined,
    changeTag: () => undefined,
    changeVisibility: () => undefined,
    domainCategories: [],
    domainTags: [],
    toggleRecentlyViewed: () => undefined,
    onlyRecentlyViewed: false,
    ownedBy: {
      displayName: '',
      id: null
    },
    usersList: [],
    visibility: null,
    ...options
  });

  it('renders a catalog-filters div', () => {
    const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProp());
    assert.isNotNull(element);
    assert.equal(element.className, 'catalog-filters');
  });

  it('renders a filterHeader', () => {
    const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProp());
    assert.isNotNull(element.querySelector('.catalog-filters-header'));
    assert.equal(element.querySelector('.catalog-filters-header .title').textContent, 'Filters');
  });

  it('renders all filter sections', () => {
    const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProp());
    assert.isNotNull(element.querySelector('.filter-section.recently-viewed'));
    assert.isNotNull(element.querySelector('.filter-section.asset-types'));
    assert.isNotNull(element.querySelector('.filter-section.authority'));
    assert.isNotNull(element.querySelector('.filter-section.owned-by'));
    assert.isNotNull(element.querySelector('.filter-section.visibility'));
    assert.isNotNull(element.querySelector('.filter-section.category'));
    assert.isNotNull(element.querySelector('.filter-section.tags'));
  });

  describe('checkbox filters', () => {
    it('calls onChange when checked/unchecked', () => {
      const spy = sinon.spy();
      const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProp({
        toggleRecentlyViewed: spy
      }));

      TestUtils.Simulate.click(element.querySelector('.filter-section.recently-viewed input'));
      TestUtils.Simulate.change(
        element.querySelector('.filter-section.recently-viewed input'),
        { 'target': { 'checked': true } }
      );
      sinon.assert.calledOnce(spy);
    });
  });

  describe('dropdown filters', () => {
    it('calls onChange when an option is clicked', () => {
      const spy = sinon.spy();
      const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProp({
        changeVisibility: spy
      }));

      TestUtils.Simulate.click(element.querySelectorAll('.filter-section.visibility .picklist-option')[2]);
      sinon.assert.calledOnce(spy);
    });
  });

  describe('filter content toggle', () => {
    it('closes and opens the filter sidebar when clicked', () => {
      const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProp());
      assert.isNull(element.querySelector('.filter-content.hidden')); // shown by default

      TestUtils.Simulate.click(element.querySelector('.close-filters'));
      assert.isNotNull(element.querySelector('.filter-content.hidden'));

      TestUtils.Simulate.click(element.querySelector('.open-filters'));
      assert.isNull(element.querySelector('.filter-content.hidden'));
    });
  });
});

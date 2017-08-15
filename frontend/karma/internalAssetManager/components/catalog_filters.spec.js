import { assert } from 'chai';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import I18nJS from 'i18n-js';
import sinon from 'sinon';
import thunk from 'redux-thunk';

import CatalogFilters from 'components/catalog_filters';
import { CatalogFilters as _CatalogFilters } from 'components/catalog_filters';
import { FeatureFlags } from 'common/feature_flags';

const catalogFiltersProps = (options = {}) => ({
  assetTypes: null,
  authority: null,
  changeAssetType: () => undefined,
  changeAuthority: () => undefined,
  changeCategory: () => undefined,
  changeOwner: () => undefined,
  changeTag: () => undefined,
  changeVisibility: () => undefined,
  clearAllFilters: () => undefined,
  domainCategories: [],
  domainTags: [],
  I18n: I18nJS,
  onlyRecentlyViewed: false,
  ownedBy: {
    displayName: '',
    id: null
  },
  toggleRecentlyViewed: () => undefined,
  usersList: [],
  visibility: null,
  ...options
});

const store = configureMockStore([ thunk ])({
  header: {
    activeTab: 'allAssets'
  },
  filters: {
    ...catalogFiltersProps()
  }
});

describe('components/CatalogFilters', () => {
  before(() => {
    FeatureFlags.updateTestFixture({ stories_enabled: true, enable_internal_asset_manager_my_assets: true });
  })

  it('renders a catalog-filters div', () => {
    const element = mount(renderLocalizedComponentWithPropsAndStore(CatalogFilters, catalogFiltersProps(), store));
    assert.isNotNull(element);
    assert(element.find('.catalog-filters'));
  });

  it('renders a filterHeader', () => {
    const component = mount(renderLocalizedComponentWithPropsAndStore(CatalogFilters, catalogFiltersProps(), store));
    assert.isNotNull(component.find('.catalog-filters-header'));
    assert.equal(component.find('.catalog-filters-header .title').node.textContent, 'Filters');
  });

  describe('when on myAssets tab', () => {
    before(() => {
      // This feature flag being true, sets the default tab to "myAssets"
      FeatureFlags.updateTestFixture({ enable_internal_asset_manager_my_assets: true });
    });

    it('renders the relevant filter sections', () => {
      const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProps(), store);
      assert.isNotNull(element.querySelector('.filter-section.recently-viewed'));
      assert.isNotNull(element.querySelector('.filter-section.asset-types'));
      assert.isNotNull(element.querySelector('.filter-section.visibility'));
      assert.isNotNull(element.querySelector('.filter-section.category'));
      assert.isNotNull(element.querySelector('.filter-section.tags'));
    });
  })

  describe('when on allAssets tab', () => {
    before(() => {
      // This feature flag being false, sets the default tab to "allAssets"
      FeatureFlags.updateTestFixture({ enable_internal_asset_manager_my_assets: false });
    });

    it('renders the relevant filter sections', () => {
      const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProps(), store);
      assert.isNotNull(element.querySelector('.filter-section.recently-viewed'));
      assert.isNotNull(element.querySelector('.filter-section.asset-types'));
      assert.isNotNull(element.querySelector('.filter-section.authority'));
      assert.isNotNull(element.querySelector('.filter-section.owned-by'));
      assert.isNotNull(element.querySelector('.filter-section.visibility'));
      assert.isNotNull(element.querySelector('.filter-section.category'));
      assert.isNotNull(element.querySelector('.filter-section.tags'));
    });
  })

  describe('checkbox filters', () => {
    it('calls onChange when checked/unchecked', () => {
      const toggleRecentlyViewedSpy = sinon.spy();
      const element = renderComponentWithPropsAndStore(
        _CatalogFilters,
        catalogFiltersProps({ toggleRecentlyViewed: toggleRecentlyViewedSpy }),
        store
      );

      TestUtils.Simulate.click(element.querySelector('.filter-section.recently-viewed input'));
      TestUtils.Simulate.change(
        element.querySelector('.filter-section.recently-viewed input'),
        { 'target': { 'checked': true } }
      );
      sinon.assert.calledOnce(toggleRecentlyViewedSpy);
    });
  });

  describe('dropdown filters', () => {
    it('calls onChange when an option is clicked', () => {
      const changeVisibilitySpy = sinon.spy();
      const element = renderComponentWithPropsAndStore(
        _CatalogFilters,
        catalogFiltersProps({ changeVisibility: changeVisibilitySpy }),
        store
      );

      TestUtils.Simulate.click(element.querySelectorAll('.filter-section.visibility .picklist-option')[2]);
      sinon.assert.calledOnce(changeVisibilitySpy);
    });
  });

  describe('filter content toggle', () => {
    it('closes and opens the filter sidebar when clicked', () => {
      const element = renderComponentWithPropsAndStore(CatalogFilters, catalogFiltersProps(), store);
      assert.isNull(element.querySelector('.filter-content.hidden')); // shown by default

      TestUtils.Simulate.click(element.querySelector('.close-filters'));
      assert.isNotNull(element.querySelector('.filter-content.hidden'));

      TestUtils.Simulate.click(element.querySelector('.open-filters'));
      assert.isNull(element.querySelector('.filter-content.hidden'));
    });
  });
});

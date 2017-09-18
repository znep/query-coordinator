import { assert } from 'chai';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import I18nJS from 'i18n-js';
import sinon from 'sinon';
import thunk from 'redux-thunk';

import { CatalogFilters as _CatalogFilters } from 'components/catalog_filters';
import { FeatureFlags } from 'common/feature_flags';

const catalogFiltersProps = (options = {}) => ({
  activeTab: 'allAssets',
  allFilters: {},
  clearAllFilters: () => undefined,
  domainCategories: [],
  domainCustomFacets: [],
  domainTags: [],
  I18n: I18nJS,
  onlyRecentlyViewed: false,
  toggleRecentlyViewed: () => undefined,
  usersList: [],
  ...options
});

const getStore = (filters = {}) => (
  configureMockStore([ thunk ])({
    header: {
      activeTab: 'allAssets'
    },
    filters
  })
);

describe('components/CatalogFilters', () => {
  before(() => {
    FeatureFlags.updateTestFixture({ stories_enabled: true, enable_internal_asset_manager_my_assets: true });
  });

  it('renders a filterHeader', () => {
    const wrapper = mount(renderLocalizedComponentWithPropsAndStore(_CatalogFilters, catalogFiltersProps(), getStore()));
    assert.lengthOf(wrapper.find('.catalog-filters-header'), 1);
    assert.equal(wrapper.find('.catalog-filters-header .title').first().text(), 'Filters');
  });

  describe('when on myAssets tab', () => {
    before(() => {
      // This feature flag being true, sets the default tab to "myAssets"
      FeatureFlags.updateTestFixture({ enable_internal_asset_manager_my_assets: true });
    });

    it('renders the relevant filter sections', () => {
      const props = catalogFiltersProps({
        activeTab: 'myAssets'
      });
      const wrapper = mount(renderLocalizedComponentWithPropsAndStore(_CatalogFilters, props, getStore(props)));
      assert.lengthOf(wrapper.find('.filter-section.recently-viewed'), 1);
      assert.lengthOf(wrapper.find('.filter-section.asset-types'), 1);
      assert.lengthOf(wrapper.find('.filter-section.visibility'), 1);
      assert.lengthOf(wrapper.find('.filter-section.category'), 1);
      assert.lengthOf(wrapper.find('.filter-section.tags'), 1);
    });
  })

  describe('when on allAssets tab', () => {
    before(() => {
      // This feature flag being false, sets the default tab to "allAssets"
      FeatureFlags.updateTestFixture({ enable_internal_asset_manager_my_assets: false });
    });

    it('renders the relevant filter sections', () => {
      const props = catalogFiltersProps({
        activeTab: 'allAssets'
      });
      const wrapper = mount(renderLocalizedComponentWithPropsAndStore(_CatalogFilters, props, getStore(props)));
      assert.lengthOf(wrapper.find('.filter-section.recently-viewed'), 1);
      assert.lengthOf(wrapper.find('.filter-section.asset-types'), 1);
      assert.lengthOf(wrapper.find('.filter-section.authority'), 1);
      assert.lengthOf(wrapper.find('.filter-section.owned-by'), 1);
      assert.lengthOf(wrapper.find('.filter-section.visibility'), 1);
      assert.lengthOf(wrapper.find('.filter-section.category'), 1);
      assert.lengthOf(wrapper.find('.filter-section.tags'), 1);
    });
  });

  describe('filter content toggle', () => {
    it('closes and opens the filter sidebar when clicked', () => {
      const wrapper = mount(renderLocalizedComponentWithPropsAndStore(
        _CatalogFilters,
        catalogFiltersProps(),
        getStore()
      ));
      assert.lengthOf(wrapper.find('.filter-content.hidden'), 0); // shown by default

      wrapper.find('.close-filters').simulate('click');
      assert.lengthOf(wrapper.find('.filter-content.hidden'), 1);

      wrapper.find('.open-filters').simulate('click');
      assert.lengthOf(wrapper.find('.filter-content.hidden'), 0);
    });
  });

  describe('custom facet filters', () => {
    it('renders if there are domainCustomFacets present', () => {
      const props = catalogFiltersProps({
        domainCustomFacets: [{
          options: ['Mustang', 'Jeep', 'Brah'],
          param: 'Car_Type',
          title: 'Car Type'
        }]
      });

      const wrapper = mount(renderLocalizedComponentWithPropsAndStore(_CatalogFilters, props, getStore(props)));
      assert.lengthOf(wrapper.find('.filter-section.custom-facet'), 1);
    });
  });
});

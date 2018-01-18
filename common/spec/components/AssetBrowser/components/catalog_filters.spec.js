import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import thunk from 'redux-thunk';

import { CatalogFilters } from 'common/components/AssetBrowser/components/filters/catalog_filters';
import AssetTypesFilter from 'common/components/AssetBrowser/components/filters/asset_types_filter';
import AuthorityFilter from 'common/components/AssetBrowser/components/filters/authority_filter';
import CategoryFilter from 'common/components/AssetBrowser/components/filters/category_filter';
import CustomFacetFilters from 'common/components/AssetBrowser/components/filters/custom_facet_filters';
import OwnedByFilter from 'common/components/AssetBrowser/components/filters/owned_by_filter';
import RecentlyViewedFilter from 'common/components/AssetBrowser/components/filters/recently_viewed_filter';
import AwaitingApprovalFilter from 'common/components/AssetBrowser/components/filters/awaiting_approval_filter';
import TagFilter from 'common/components/AssetBrowser/components/filters/tag_filter';
import VisibilityFilter from 'common/components/AssetBrowser/components/filters/visibility_filter';

import { FeatureFlags } from 'common/feature_flags';

const catalogFiltersProps = (options = {}) => ({
  activeTab: 'allAssets',
  allFilters: {},
  clearAllFilters: () => undefined,
  domainCategories: [],
  domainCustomFacets: [],
  domainTags: [],
  onlyRecentlyViewed: false,
  showAwaitingApprovalFilter: true,
  toggleRecentlyViewed: () => undefined,
  usersList: [],
  filters: {},
  ...options
});

describe('components/CatalogFilters', () => {

  before(() => {
    FeatureFlags.updateTestFixture({ stories_enabled: true });
  });

  it('renders a filterHeader', () => {
    const wrapper = shallow(
      <CatalogFilters {...catalogFiltersProps()} />
    );
    assert.lengthOf(wrapper.find('.catalog-filters-header'), 1);
  });

  describe('when on myAssets tab', () => {
    it('renders the relevant filter sections', () => {
      const props = catalogFiltersProps({
        activeTab: 'myAssets'
      });
      const wrapper = shallow(<CatalogFilters {...props} />);
      // TODO this should really be a test on AuthorityFilter
      assert.lengthOf(wrapper.find(AuthorityFilter), 0);

      assert.lengthOf(wrapper.find(RecentlyViewedFilter), 1);
      assert.lengthOf(wrapper.find(AwaitingApprovalFilter), 1);
      assert.lengthOf(wrapper.find(AssetTypesFilter), 1);
      assert.lengthOf(wrapper.find(VisibilityFilter), 1);
      assert.lengthOf(wrapper.find(CategoryFilter), 1);
      assert.lengthOf(wrapper.find(TagFilter), 1);
    });
  });

  describe('when on allAssets tab', () => {
    it('renders the relevant filter sections', () => {
      const props = catalogFiltersProps({
        activeTab: 'allAssets'
      });
      const wrapper = shallow(<CatalogFilters {...props} />);

      assert.lengthOf(wrapper.find(RecentlyViewedFilter), 1);
      assert.lengthOf(wrapper.find(AwaitingApprovalFilter), 1);
      assert.lengthOf(wrapper.find(AssetTypesFilter), 1);
      assert.lengthOf(wrapper.find(AuthorityFilter), 1);
      assert.lengthOf(wrapper.find(OwnedByFilter), 1);
      assert.lengthOf(wrapper.find(VisibilityFilter), 1);
      assert.lengthOf(wrapper.find(CategoryFilter), 1);
      assert.lengthOf(wrapper.find(TagFilter), 1);
    });
  });

  describe('filter content toggle', () => {
    it('closes and opens the filter sidebar when clicked', () => {
      const wrapper = shallow(<CatalogFilters {...catalogFiltersProps()} />);

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

      const wrapper = shallow(<CatalogFilters {...props} />);
      assert.lengthOf(wrapper.find(CustomFacetFilters), 1);
    });
  });
});

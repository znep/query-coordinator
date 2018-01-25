import React from 'react';
import { assert } from 'chai';
import { mount, shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';

import { CatalogResults } from 'common/components/AssetBrowser/components/catalog_results';
import ResultListTable from 'common/components/AssetBrowser/components/result_list_table';
import * as constants from 'common/components/AssetBrowser/lib/constants.js';

const store = {
  subscribe: () => {},
  dispatch: () => {},
  getState: () => ({
    'assetBrowserProps': {
      'columns': ['type', 'name', 'actions', 'lastUpdatedDate', 'category', 'owner', 'visibility']
    },
    'catalog': {
      'order': {},
      'results': []
    },
    'filters': {},
    'header': {
      activeTab: 'myAssets'
    },
    'tabs': {}
  })
};

describe('components/CatalogResults', () => {
  const catalogResultsProps = (options = {}) => ({
    activeTab: 'myAssets',
    changePage: () => {},
    changeQ: () => {},
    clearAllFilters: () => {},
    enableAssetInventoryLink: false,
    fetchInitialResults: () => {},
    resultSetSize: 0,
    isMobile: false,
    tabs: {},
    toggleFilters: () => {},
    updatePageSize: () => {},
    ...options
  });

  it('renders a catalog-results div', () => {
    const element = shallow(<CatalogResults {...catalogResultsProps()} />);
    assert.lengthOf(element.find('.catalog-results'), 1);
  });

  it('renders a topbar', () => {
    const element = shallow(<CatalogResults {...catalogResultsProps()} />);
    assert.lengthOf(element.find('.topbar'), 1);
  });

  it('renders a table', () => {
    const element = shallow(<CatalogResults {...catalogResultsProps()} />);
    assert.lengthOf(element.find(ResultListTable), 1);
  });

  describe('showPager', () => {
    it('renders the pager when true', () => {
      const element = mount(
        <Provider store={store}>
          <CatalogResults {...catalogResultsProps({ showPager: true })} />
        </Provider>,
        { context: store }
      );
      assert.lengthOf(element.find('.pagination-and-result-count .pager'), 1);
    });

    it('does not render the pager when false', () => {
      const element = mount(
        <Provider store={store}>
          <CatalogResults {...catalogResultsProps({ showPager: false })} />
        </Provider>,
        { context: store }
      );
      assert.lengthOf(element.find('.pagination-and-result-count .pager'), 0);
    });
  });

  describe('enableAssetInventoryLink', () => {
    it('shows the asset inventory button when true and on the "All Assets" tab', () => {
      const props = catalogResultsProps({ activeTab: constants.ALL_ASSETS_TAB, enableAssetInventoryLink: true });
      const element = shallow(<CatalogResults {...props} />);
      assert.lengthOf(element.find('.asset-inventory-link-wrapper'), 1);
    });

    it('hides the asset inventory button when true and on the "My Assets" tab', () => {
      const props = catalogResultsProps({ activeTab: constants.MY_ASSETS_TAB, enableAssetInventoryLink: true });
      const element = shallow(<CatalogResults {...props} />);
      assert.lengthOf(element.find('.asset-inventory-link-wrapper'), 0);
    });

    it('hides the asset inventory button when true and on the "Shared to Me" tab', () => {
      const props = catalogResultsProps({ activeTab: constants.SHARED_TO_ME_TAB, enableAssetInventoryLink: true });
      const element = shallow(<CatalogResults {...props} />);
      assert.lengthOf(element.find('.asset-inventory-link-wrapper'), 0);
    });

    it('hides the asset inventory button when false', () => {
      const props = catalogResultsProps({ enableAssetInventoryLink: false });
      const element = shallow(<CatalogResults {...props} />);
      assert.lengthOf(element.find('.asset-inventory-link-wrapper'), 0);
    });
  });
});

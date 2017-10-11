import React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { CatalogResults } from 'common/components/AssetBrowser/components/catalog_results';
import ResultListTable from 'common/components/AssetBrowser/components/result_list_table';

describe('components/CatalogResults', () => {
  const catalogResultsProps = (options = {}) => ({
    changePage: () => {},
    changeQ: () => {},
    clearAllFilters: () => {},
    resultSetSize: 0,
    showAssetInventoryLink: false,
    isMobile: false,
    toggleFilters: () => {},
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

  // NOTE: This prop appears unused.
  describe('showAssetInventoryLink', () => {
    it('shows the asset inventory button when true', () => {
      const props = catalogResultsProps({ showAssetInventoryLink: true });
      const element = shallow(<CatalogResults {...props} />);
      assert.lengthOf(element.find('.asset-inventory-link-wrapper'), 1);
    });

    it('hides the asset inventory button when false', () => {
      const props = catalogResultsProps({ showAssetInventoryLink: false });
      const element = shallow(<CatalogResults {...props} />);
      assert.lengthOf(element.find('.asset-inventory-link-wrapper'), 0);
    });
  });
});

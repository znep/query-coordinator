import { assert } from 'chai';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import I18nJS from 'i18n-js';
import thunk from 'redux-thunk';

import { CatalogResults } from 'components/catalog_results';

const store = configureMockStore([ thunk ])({
  autocomplete: {
    collapsed: true
  },
  catalog: {
    columns: [],
    order: {
      value: 'lastUpdatedAt',
      order: 'ascending'
    },
    results: []
  },
  header: {
    activeTab: 'allAssets'
  }
});

describe('components/CatalogResults', () => {
  const catalogResultsProps = (options = {}) => ({
    changePage: () => {},
    changeQ: () => {},
    clearAllFilters: () => {},
    I18n: I18nJS,
    resultSetSize: 0,
    ...options
  });

  it('renders a catalog-results div', () => {
    const element = mount(renderLocalizedComponentWithPropsAndStore(CatalogResults, catalogResultsProps(), store));
    assert.isNotNull(element);
    assert.equal(element.find('.catalog-results').node.className, 'catalog-results');
  });

  it('renders a topbar', () => {
    const element = mount(renderLocalizedComponentWithPropsAndStore(CatalogResults, catalogResultsProps(), store));
    assert.isNotNull(element.find('.topbar'));
  });

  it('renders a table', () => {
    const element = mount(renderLocalizedComponentWithPropsAndStore(CatalogResults, catalogResultsProps(), store));
    assert.isNotNull(element.find('.result-list-table'));
  });
});

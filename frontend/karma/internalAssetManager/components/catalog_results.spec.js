import { assert } from 'chai';
import { CatalogResults } from 'components/catalog_results';

describe('components/CatalogResults', () => {
  const catalogResultsProps = (options = {}) => ({
    changePage: () => {},
    changeQ: () => {},
    resultSetSize: 0,
    ...options
  });

  it('renders a catalog-results div', () => {
    const element = renderComponentWithPropsAndStore(CatalogResults, catalogResultsProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'catalog-results');
  });

  it('renders a topbar', () => {
    const element = renderComponentWithPropsAndStore(CatalogResults, catalogResultsProps());
    assert.isNotNull(element.querySelector('.topbar'));
  });

  it('renders a table', () => {
    const element = renderComponentWithPropsAndStore(CatalogResults, catalogResultsProps());
    assert.isNotNull(element.querySelector('.result-list-table'));
  });
});

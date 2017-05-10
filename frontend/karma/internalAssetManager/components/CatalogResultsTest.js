import { expect, assert } from 'chai';
import { CatalogResults } from 'components/CatalogResults';

describe('components/CatalogResults', () => {
  const catalogResultsProps = (options = {}) => ({
    ...options
  });

  it('renders a catalog-results div', () => {
    const element = renderComponentWithStore(CatalogResults, catalogResultsProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'catalog-results');
  });

  it('renders a topbar', () => {
    const element = renderComponentWithStore(CatalogResults, catalogResultsProps());
    assert.isNotNull(element.querySelector('.topbar'));
  });

  it('renders a table', () => {
    const element = renderComponentWithStore(CatalogResults, catalogResultsProps());
    assert.isNotNull(element.querySelector('.result-list-table'));
  });
});

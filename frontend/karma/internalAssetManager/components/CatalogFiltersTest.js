import { assert } from 'chai';
import { CatalogFilters} from 'components/CatalogFilters';
import sinon from 'sinon';

describe('components/CatalogFilters', () => {
  const catalogFiltersProp = (options = {}) => ({
    assetTypes: null,
    authority: null,
    changeAssetType: () => undefined,
    changeAuthority: () => undefined,
    changeCategory: () => undefined,
    changeLastUpdatedDate: () => undefined,
    changeOwner: () => undefined,
    changeTag: () => undefined,
    changeVisibility: () => undefined,
    domainCategories: [],
    domainTags: [],
    toggleRecentlyViewed: () => undefined,
    lastUpdatedDate: 'anyDateUpdated',
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
    const element = renderComponentWithStore(CatalogFilters, catalogFiltersProp());
    assert.isNotNull(element);
    assert.equal(element.className, 'catalog-filters');
  });

  it('renders a filterHeader', () => {
    const element = renderComponentWithStore(CatalogFilters, catalogFiltersProp());
    assert.isNotNull(element.querySelector('.catalog-filters-header'));
    assert.equal(element.querySelector('.catalog-filters-header').textContent, 'Filters');
  });

  it('renders all filter sections', () => {
    const element = renderComponentWithStore(CatalogFilters, catalogFiltersProp());
    assert.isNotNull(element.querySelector('.filter-section.recently-viewed'));
    assert.isNotNull(element.querySelector('.filter-section.asset-types'));
    // assert.isNotNull(element.querySelector('.filter-section.last-updated-date'));
    assert.isNotNull(element.querySelector('.filter-section.authority'));
    assert.isNotNull(element.querySelector('.filter-section.owned-by'));
    assert.isNotNull(element.querySelector('.filter-section.visibility'));
    assert.isNotNull(element.querySelector('.filter-section.category'));
    assert.isNotNull(element.querySelector('.filter-section.tags'));
  });

  describe('checkbox filters', () => {
    it('calls onChange when checked/unchecked', () => {
      const spy = sinon.spy();
      const element = renderComponentWithStore(CatalogFilters, catalogFiltersProp({
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
      const element = renderComponentWithStore(CatalogFilters, catalogFiltersProp({
        changeVisibility: spy
      }));

      TestUtils.Simulate.click(element.querySelectorAll('.filter-section.visibility .picklist-option')[2]);
      sinon.assert.calledOnce(spy);
    });
  });
});
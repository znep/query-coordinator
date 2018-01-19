import { assert } from 'chai';

import FilterPanelDesktop from 'adminActivityFeedSoql/components/FilterPanel/FilterPanelDesktop';

describe('FilterPanelDesktop', () => {
  const element = renderComponentWithLocalization(FilterPanelDesktop, {});

  it('render', () => {
    assert.isNotNull(element);
    assert.isOk(element.classList.contains('catalog-filters'));
  });

  it('render close button', () => {
    assert.isNotNull(element.querySelector('.close-filters'));
  });

  it('render date range filter', () => {
    assert.isNotNull(element.querySelector('.filter-section.date-range'));
  });

  it('render asset type filter', () => {
    assert.isNotNull(element.querySelector('.filter-section.asset-type'));
  });

  it('render event filter', () => {
    assert.isNotNull(element.querySelector('.filter-section.event-filter'));
  });

  it('render initiated by filter', () => {
    assert.isNotNull(element.querySelector('.initiated-by-filter'));
  });
});

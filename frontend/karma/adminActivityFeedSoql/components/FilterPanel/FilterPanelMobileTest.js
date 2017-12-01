import { assert } from 'chai';

import testStore from '../../testStore';
import FilterPanelMobile from 'components/FilterPanel/FilterPanelMobile';

describe('FilterPanelMobile', () => {

  describe('when filters open', () => {
    const store = testStore({
      filters: {
        date: {
          start: '',
          end: ''
        }
      },
      common: {
        filtersOpen: true
      }
    });

    const element = renderComponentWithLocalization(FilterPanelMobile, {}, store);

    it('renders', () => {
      assert.isNotNull(element);
    });

    it('renders done buttons', () => {
      assert.isNotNull(element.querySelector('a.done-button'));
      assert.isNotNull(element.querySelector('button.btn-done'));
    });

    it('renders reset filters button', () => {
      assert.isNotNull(element.querySelector('.reset-filters'));
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

  });

  describe('when filters closed', () => {
    const element = renderComponentWithLocalization(FilterPanelMobile, {});

    it('render null', () => {
      assert.isNull(element);
    });
  });

});

import _ from 'lodash';
import { assert } from 'chai';
import FilterBar from 'adminActivityFeed/components/FilterBar/FilterBar';
import mockTranslations from '../mockTranslations';
const getDefaultStore = require('../testStore').default;

describe('FilterBar', () => {
  let component;

  beforeEach(() => {
    const store = getDefaultStore({}, {
      filter: {
        event: 'All',
        status: 'All',
        dateFrom: null,
        dateTo: null
      }
    });

    component = renderComponentWithLocalization(FilterBar, {}, store);
  });

  it('should render quick-filters', () => {
    const element = component.querySelector('.quick-filters');
    const translations = Object.values(_.get(mockTranslations, 'quick_filters'));

    assert.isNotNull(element);
    _.each(element.querySelectorAll('li'), (el) => {
      assert.isTrue(translations.indexOf(el.textContent) > -1);
    });
  });

  it('should render picker-filters', () => {
    const element = component.querySelector('.picker-filters');

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('#eventFilter'));
    assert.isNotNull(element.querySelector('#statusFilter'));
    assert.isNotNull(element.querySelector('.filter-bar-filter'));
  });
});

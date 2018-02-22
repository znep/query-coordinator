import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import FilterBar from 'components/FilterBar';
import {
  mockBinaryOperatorFilter,
  mockValueRangeFilter,
  mockNumberColumn,
  mockTextColumn
} from './data';

const getAddFilter = (element) => element.querySelector('.add-filter');
const getFilters = (element) => element.querySelectorAll('.filter-bar-filter');
const getVisibleFilters = (element) => element.querySelectorAll('.visible-filters-container .filter-bar-filter');
const getCollapsedFilters = (element) => element.querySelectorAll('.collapsed-filters-container .filter-bar-filter');
const getRemovedFilters = (element) => element.querySelectorAll('.filters-leave');
const getExpandControl = (element) => element.querySelector('.btn-expand-control');

const getWrappedComponent = (component) => <div style={{ width: '450px' }}>{component}</div>;
const getContainer = (element) => element.querySelector('.filter-bar-container');

describe('FilterBar', () => {
  let element;
  let container;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      columns: [
        mockNumberColumn,
        mockTextColumn,
        {
          name: 'Some Word',
          fieldName: 'some_word',
          renderTypeName: 'text'
        }
      ],
      filters: [],
      isReadOnly: false,
      onUpdate: _.noop,
      isValidTextFilterColumnValue: _.noop
    });
  }

  const render = (props) => {
    const component = React.createElement(FilterBar, getProps(props));

    container = document.createElement('div');
    document.body.appendChild(container);

    return ReactDOM.render(getWrappedComponent(component), container);
  };

  beforeEach(() => {
    I18n.translations.en = allLocales.en;
    element = render();
  });

  afterEach(() => {
    I18n.translations = {};
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  });

  it('renders an element', () => {
    assert.isNotNull(element);
  });

  it('renders the add filter controls', () => {
    assert.isNotNull(getAddFilter(element));
  });

  it('renders no filters if none are provided', () => {
    assert.deepEqual(getFilters(element).length, 0);
  });

  it('renders filters if provided', () => {
    element = render({
      filters: [mockValueRangeFilter]
    });

    const filters = getFilters(element);
    /*
    We are fetching removed filters because
    react-addons-css-transition-group keeps removed filters
    on the DOM until a callback happens.
    To make sure tests pass, a workaround is to make sure
    we don't count any elements that are removed from the list of filters
    but that may still be on the page but hidden
    */
    const removedFilters = getRemovedFilters(element);
    assert.deepEqual(filters.length - removedFilters.length, 1);
  });

  it('renders a hidden expand control', () => {
    element = render({
      filters: [mockValueRangeFilter]
    });

    assert.deepEqual(getExpandControl(element).classList.contains('is-hidden'), true);
  });

  describe('when isReadOnly is true', () => {
    it('does not render the add filter controls', () => {
      element = render({
        filters: [mockValueRangeFilter],
        isReadOnly: true
      });

      assert.isNull(getAddFilter(element));
    });

    it('does not render filters that have isHidden set to true', () => {
      element = render({
        filters: [
          mockValueRangeFilter,
          _.merge({}, mockValueRangeFilter, {
            isHidden: true
          })
        ],
        isReadOnly: true
      });

      assert.deepEqual(getFilters(element).length, 1);
    });

    it('does not render if none of the filters are visible', () => {
      element = render({
        filters: [
          _.merge({}, mockValueRangeFilter, {
            isHidden: true
          })
        ],
        isReadOnly: true
      });

      assert.equal(element.children.length, 0);
    });

    describe('when at least one filter is visible', () => {
      beforeEach(() => {
        element = render({
          filters: [
            mockValueRangeFilter
          ],
          isReadOnly: true
        });
      });

      it('renders', () => {
        assert.isNotNull(element);
      });

      it('renders a filter icon', () => {
        assert.isNotNull(element.querySelector('.filter-icon'));
      });

      it('renders a filter', () => {
        assert.isNotNull(element.querySelector('.filter-bar-filter'));
      });
    });
  });

  describe('when there is not enough space for all the filters', () => {
    beforeEach(() => {
      element = render({ filters: [mockValueRangeFilter, mockBinaryOperatorFilter, mockValueRangeFilter] });
    });

    it('renders just the filters that will fit', () => {
      assert.deepEqual(getVisibleFilters(element).length, 2);
    });

    it('renders the hidden collapsed filters', () => {
      const collapsedFilters = getCollapsedFilters(element);
      /*
      We are fetching removed filters because
      react-addons-css-transition-group keeps removed filters
      on the DOM until a callback happens.
      To make sure tests pass, a workaround is to make sure
      we don't count any elements that are removed from the list of filters
      but that may still be on the page but hidden
      */
      const removedFilters = getRemovedFilters(element);
      assert.deepEqual(collapsedFilters.length - removedFilters.length, 1);
    });

    describe('expand control', () => {
      it('is visible', () => {
        assert.deepEqual(getExpandControl(element).classList.contains('is-hidden'), false);
      });

      it('renders "More" when the collapsed filters are not expanded', () => {
        assert.deepEqual(getExpandControl(element).innerText, 'More');
      });

      it('renders "Less" when the collapsed filters are expanded', () => {
        const expandControl = getExpandControl(element);
        Simulate.click(expandControl);

        assert.deepEqual(expandControl.innerText, 'Less');
      });

      it('expands the hidden collapsed filters on click', () => {
        Simulate.click(getExpandControl(element));

        assert.deepEqual(getContainer(element).classList.contains('filter-bar-expanded'), true);
      });

      it('closes the visible collapsed filters on click', () => {
        Simulate.click(getExpandControl(element));
        Simulate.click(getExpandControl(element));

        assert.deepEqual(getContainer(element).classList.contains('filter-bar-expanded'), false);
      });
    });
  });
});

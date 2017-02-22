import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import FilterBar from 'components/FilterBar';
import {
  mockBinaryOperatorFilter,
  mockValueRangeFilter,
  mockNumberColumn,
  mockTextColumn
} from './data';

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
          dataTypeName: 'text'
        }
      ],
      filters: [],
      isReadOnly: false,
      onUpdate: _.noop
    });
  }

  const getAddFilter = (element) => element.querySelector('.add-filter');
  const getFilters = (element) => element.querySelectorAll('.filter-bar-filter');
  const getVisibleFilters = (element) => element.querySelectorAll('.visible-filters-container .filter-bar-filter');
  const getCollapsedFilters = (element) => element.querySelectorAll('.collapsed-filters-container .filter-bar-filter');
  const getExpandControl = (element) => element.querySelector('.btn-expand-control');

  const getWrappedComponent = (component) => <div style={{ width: '450px' }}>{component}</div>;
  const getContainer = (element) => element.querySelector('.filter-bar-container');

  const render = (props) => {
    const component = React.createElement(FilterBar, getProps(props));

    container = document.createElement('div');
    document.body.appendChild(container);

    return ReactDOM.render(getWrappedComponent(component), container);
  };

  beforeEach(() => {
    element = render();
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  it('renders the add filter controls', () => {
    expect(getAddFilter(element)).to.exist;
  });

  it('renders no filters if none are provided', () => {
    expect(getFilters(element).length).to.eq(0);
  });

  it('renders filters if provided', () => {
    element = render({
      filters: [ mockValueRangeFilter ]
    });

    expect(getFilters(element).length).to.eq(1);
  });

  it('renders a hidden expand control', () => {
    element = render({
      filters: [ mockValueRangeFilter ]
    });

    expect(getExpandControl(element).classList.contains('is-hidden')).to.eq(true);
  });

  describe('when isReadOnly is true', () => {
    it('does not render the add filter controls', () => {
      element = render({
        filters: [ mockValueRangeFilter ],
        isReadOnly: true
      });

      expect(getAddFilter(element)).to.not.exist;
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

      expect(getFilters(element).length).to.eq(1);
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

      expect(element.children.length).to.equal(0);
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
        expect(element).to.exist;
      });

      it('renders a filter icon', () => {
        expect(element.querySelector('.filter-icon')).to.exist;
      });

      it('renders a filter', () => {
        expect(element.querySelector('.filter-bar-filter')).to.exist;
      });
    });
  });

  describe('when there is not enough space for all the filters', () => {
    beforeEach(() => {
      element = render({ filters: [mockValueRangeFilter, mockBinaryOperatorFilter, mockValueRangeFilter] });
    });

    it('renders just the filters that will fit', () => {
      expect(getVisibleFilters(element).length).to.eq(2);
    });

    it('renders the hidden collapsed filters', () => {
      expect(getCollapsedFilters(element).length).to.eq(1);
    });

    describe('expand control', () => {
      it('is visible', () => {
        expect(getExpandControl(element).classList.contains('is-hidden')).to.eq(false);
      });

      it('renders "More" when the collapsed filters are not expanded', () => {
        expect(getExpandControl(element).innerText).to.eq('More');
      });

      it('renders "Less" when the collapsed filters are expanded', () => {
        const expandControl = getExpandControl(element);
        Simulate.click(expandControl);

        expect(expandControl.innerText).to.eq('Less');
      });

      it('expands the hidden collapsed filters on click', () => {
        Simulate.click(getExpandControl(element));

        expect(getContainer(element).classList.contains('filter-bar-expanded')).to.eq(true);
      });

      it('closes the visible collapsed filters on click', () => {
        Simulate.click(getExpandControl(element));
        Simulate.click(getExpandControl(element));

        expect(getContainer(element).classList.contains('filter-bar-expanded')).to.eq(false);
      });
    });
  });
});

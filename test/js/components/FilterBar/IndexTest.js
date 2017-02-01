import _ from 'lodash';
import React from 'react';
import { renderComponent } from '../../helpers';
import FilterBar from 'components/FilterBar';
import { mockValueRangeFilter, mockNumberColumn } from './data';

describe('FilterBar', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      columns: [
        mockNumberColumn,
        {
          name: 'Some Word',
          fieldName: 'some_word',
          dataTypeName: 'text'
        }
      ],
      filters: [],
      onUpdate: _.noop
    });
  }

  const getAddFilter = (element) => element.querySelector('.add-filter');
  const getFilters = (element) => element.querySelectorAll('.filter-bar-filter');

  beforeEach(() => {
    element = renderComponent(FilterBar, getProps());
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
    element = renderComponent(FilterBar, getProps({
      filters: [ mockValueRangeFilter ]
    }));

    expect(getFilters(element).length).to.eq(1);
  });

  describe('when displaySettings is false', () => {
    it('does not render the add filter controls', () => {
      element = renderComponent(FilterBar, getProps({
        filters: [ mockValueRangeFilter ],
        displaySettings: false
      }));

      expect(getAddFilter(element)).to.not.exist;
    });

    it('does not render filters that have isHidden set to true', () => {
      element = renderComponent(FilterBar, getProps({
        filters: [
          mockValueRangeFilter,
          _.merge({}, mockValueRangeFilter, {
            isHidden: true
          })
        ],
        displaySettings: false
      }));

      expect(getFilters(element).length).to.eq(1);
    });

    it('does not render if none of the filters are visible', () => {
      element = renderComponent(FilterBar, getProps({
        filters: [
          _.merge({}, mockValueRangeFilter, {
            isHidden: true
          })
        ],
        displaySettings: false
      }));

      expect(element).to.not.exist;
    });
  });
});

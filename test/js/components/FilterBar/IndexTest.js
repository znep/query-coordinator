import _ from 'lodash';
import React from 'react';
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

  beforeEach(() => {
    element = renderComponent(FilterBar, getProps());
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  it('renders the add filter controls', () => {
    const addFilter = element.querySelector('.add-filter');

    expect(addFilter).to.exist;
  });

  it('renders no filters if none are provided', () => {
    const filters = element.querySelectorAll('.filter-bar-filter');

    expect(filters.length).to.eq(0);
  });

  it('renders filters if provided', () => {
    element = renderComponent(FilterBar, getProps({
      filters: [ mockValueRangeFilter ]
    }));
    const filters = element.querySelectorAll('.filter-bar-filter');

    expect(filters.length).to.eq(1);
  });
});

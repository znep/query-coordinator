import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import AddFilter from 'components/FilterBar/AddFilter';
import { SPACE } from 'common/keycodes';

describe('AddFilter', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      columns: [],
      onClickColumn: _.noop
    });
  }

  function clickAddFilter(element) {
    const button = element.querySelector('.btn-add-filter');
    Simulate.click(button);
  }

  beforeEach(() => {
    element = renderComponent(AddFilter, getProps());
  });

  it('renders an element', () => {
    expect(element).to.exist;
  });

  describe('add filter button', () => {
    it('renders the add filter button', () => {
      const button = element.querySelector('.btn-add-filter');
      expect(button).to.exist;
    });

    it('does not render the column container on load', () => {
      const columnContainer = element.querySelector('.column-container');
      expect(columnContainer).to.not.exist;
    });

    it('renders the column container when add filter button is clicked', () => {
      clickAddFilter(element);
      const columnContainer = element.querySelector('.column-container');

      expect(columnContainer).to.exist;
    });

    it('renders when add filter button is accessed via keyboard', () => {
      const button = element.querySelector('.btn-add-filter');
      Simulate.keyDown(button, { keyCode: SPACE });
      const columnContainer = element.querySelector('.column-container');

      expect(columnContainer).to.exist;
    });
  });

  describe('column options', () => {
    it('renders a searchable picklist', () => {
      clickAddFilter(element);
      const searchablePicklist = element.querySelector('.searchable-picklist');

      expect(searchablePicklist).to.exist;
    });

    it('renders a searchable picklist with warning with no columns', () => {
      clickAddFilter(element);
      const warning = element.querySelector('.searchable-picklist .alert');

      expect(warning).to.exist;
    });

    it('renders an option for each column', () => {
      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Number',
            fieldName: 'some_number',
            dataTypeName: 'number'
          },
          {
            name: 'Some Word',
            fieldName: 'some_word',
            dataTypeName: 'text'
          }
        ]
      }));
      clickAddFilter(element);
      const options = element.querySelectorAll('.filter-bar-column-option');

      expect(options.length).to.eq(2);
    });

    it('filters columns when term searched', () => {
      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Number',
            fieldName: 'some_number',
            dataTypeName: 'number'
          },
          {
            name: 'Some Word',
            fieldName: 'some_word',
            dataTypeName: 'text'
          }
        ]
      }));
      clickAddFilter(element);

      const input = element.querySelector('.searchable-picklist-input');
      input.value = 'word';
      Simulate.change(input);

      const options = element.querySelectorAll('.filter-bar-column-option');

      expect(options.length).to.eq(1);
    });

    it('calls onClickColumn when option is clicked', () => {
      const onClickColumnStub = sinon.stub();

      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Word',
            fieldName: 'some_word',
            dataTypeName: 'text'
          }
        ],
        onClickColumn: onClickColumnStub
      }));
      clickAddFilter(element);

      const option = element.querySelector('.filter-bar-column-option');
      Simulate.click(option);

      expect(onClickColumnStub).to.have.been.called;
    });

    it('closes column container when option is clicked', () => {
      element = renderComponent(AddFilter, getProps({
        columns: [
          {
            name: 'Some Word',
            fieldName: 'some_word',
            dataTypeName: 'text'
          }
        ]
      }));
      clickAddFilter(element);

      const option = element.querySelector('.filter-bar-column-option');
      Simulate.click(option);

      const columnContainer = element.querySelector('.column-container');

      expect(columnContainer).to.not.exist;
    });
  });
});

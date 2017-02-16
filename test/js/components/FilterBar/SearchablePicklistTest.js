import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import SearchablePicklist from 'components/FilterBar/SearchablePicklist';
import { mockPicklistOptions } from './data';

describe('SearchablePicklist', () => {
  function getProps(props) {
    return _.defaults({}, props, {
      isLoading: false,
      options: mockPicklistOptions,
      value: '',
      hasSearchError: false,
      onChangeSearchTerm: _.noop,
      onSelection: _.noop,
      onBlur: _.noop
    });
  }

  const getSearchInput = (element) => element.querySelector('.searchable-picklist-input');
  const getPicklist = (element) => element.querySelector('.picklist');
  const getSelectedOptions = (element) => element.querySelector('.picklist-selected-options');

  it('renders an element', () => {
    const element = renderComponent(SearchablePicklist, getProps());
    expect(element).to.exist;
  });

  describe('search input', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      expect(getSearchInput(element)).to.exist;
    });

    it('displays the value in the search input if provided', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        value: 'Pesto'
      }));
      expect(getSearchInput(element).value).to.equal('Pesto');
    });

    it('calls onChangeSearchTerm when the search input changes', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onChangeSearchTerm: stub
      }));
      const input = getSearchInput(element);

      input.value = 'Pizza';
      Simulate.change(input);

      expect(stub).to.have.been.calledWith('Pizza');
    });
  });

  describe('picklist', () => {
    it('renders', () => {
      const element = renderComponent(SearchablePicklist, getProps());
      expect(getPicklist(element)).to.exist;
    });

    it('displays the no options message if no options are available', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        options: []
      }));
      expect(element.querySelector('.alert')).to.have.class('warning');
    });

    it('displays the search provider error message if search error encountered', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        hasSearchError: true
      }));
      expect(element.querySelector('.alert')).to.have.class('error');
    });

    it('highlights the value in the picklist if provided and available', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        value: 'Pesto'
      }));
      const picklist = getPicklist(element);
      const selectedOption = picklist.querySelector('.picklist-option-selected');

      expect(selectedOption.innerText).to.equal('Pesto');
    });

    it('calls onSelection when a picklist option is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onSelection: stub
      }));
      const picklist = getPicklist(element);
      const option = picklist.querySelectorAll('.picklist-option');

      Simulate.click(option[1]);

      expect(stub).to.have.been.calledWith({
        title: 'Pesto',
        value: 'Pesto'
      });
    });
  });

  describe('selected values', () => {
    it('renders', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        selectedOptions: [{title: 'Pesto', value: 'Pesto'}]
      }));

      expect(getSelectedOptions(element)).to.exist;
    });

    it('does not render if selectedOptions is empty', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps());

      expect(getSelectedOptions(element)).to.not.exist;
    });

    it('calls onClickSelectedOption when a selectedOptions item is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        onClickSelectedOption: stub,
        selectedOptions: [{
          title: 'Pesto',
          value: 'Pesto'
        }]
      }));

      const selectedOptions = getSelectedOptions(element);

      const option = selectedOptions.querySelectorAll('.picklist-option');

      Simulate.click(option[0]);

      expect(stub).to.have.been.calledWith({
        displayCloseIcon: true,
        group: "Selected Values",
        iconName: "filter",
        title: 'Pesto',
        value: 'Pesto'
      });
    });
  })
});

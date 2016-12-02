import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import SearchablePicklist from 'components/FilterBar/SearchablePicklist';
import { mockPicklistOptions } from './data';

describe('SearchablePicklist', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      isLoading: false,
      options: [],
      value: '',
      onChangeSearchTerm: _.noop,
      onSelection: _.noop
    });
  }

  const getSearchInput = (element) => element.querySelector('.searchable-picklist-input');
  const getPicklist = (element) => element.querySelector('.picklist');

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
      const element = renderComponent(SearchablePicklist, getProps());
      const picklist = getPicklist(element);

      expect(picklist).to.have.class('picklist-disabled');
      expect(picklist.querySelectorAll('.picklist-option').length).to.equal(1);
    });

    it('highlights the value in the picklist if provided and available', () => {
      const element = renderComponent(SearchablePicklist, getProps({
        options: mockPicklistOptions,
        value: 'Pesto'
      }));
      const picklist = getPicklist(element);
      const selectedOption = picklist.querySelector('.picklist-option-selected');

      expect(selectedOption.innerText).to.equal('Pesto');
    });

    it('calls onSelection when a picklist option is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(SearchablePicklist, getProps({
        options: mockPicklistOptions,
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
});

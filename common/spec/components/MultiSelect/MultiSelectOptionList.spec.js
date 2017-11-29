import React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import MultiSelectOptionList from 'common/components/MultiSelect/MultiSelectOptionList';
import MultiSelectOption from 'common/components/MultiSelect/MultiSelectOption';

describe('<MultiSelectOptionList />', () => {
  const defaultProps = {
    shouldRenderResultsWhenQueryIsEmpty: false,
    currentQuery: 'something',
    noResultsMessage: 'No Results',
    onAddSelectedOption: () => {},
    onSelectedOptionIndexChange: () => {},
    options: [],
    optionsVisible: true,
    renderOption: () => {},
    selectedOptionIndex: -1,
    setUsingMouse: () => {},
    usingMouse: false
  };

  it('renders nothing is optionsVisible is false', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        optionsVisible={false} />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-container'), 0);
  });

  it('renders nothing when currentQuery is empty', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        currentQuery={''} />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-container'), 0);
  });

  it('still renders when query is empty if shouldRenderResultsWhenQueryIsEmpty is true', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        currentQuery={''}
        shouldRenderResultsWhenQueryIsEmpty />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-container'), 1);
  });

  it('renders spinner when options are null', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        options={null} />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-spinner'), 1);
  });

  it('renders "No Results" message when options are empty', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        options={[]} />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-no-results'), 1);
  });

  it('renders nothing when number of selected options equals the given max number of selected options', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        maxSelectedOptions={3}
        selectedOptions={[1, 2, 3]} />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-container'), 0);
  });

  it('renders results when number of selected options is less than the given max number of selected options', () => {
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        maxSelectedOptions={3}
        selectedOptions={[1, 2]} />
    );

    assert.lengthOf(wrapper.find('.multiselect-options-container'), 1);
  });

  it('renders all the given options', () => {
    const options = [
      'hello',
      'there',
      'friend',
      'how',
      'are',
      'you',
      'liking',
      'these',
      'tests'
    ];
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        options={options} />
    );

    assert.lengthOf(wrapper.find(MultiSelectOption), options.length);
  });

  it('properly sets active for the selected option', () => {
    const selectedOptionIndex = 1;
    const options = [
      'not selected',
      'selected',
      'something else'
    ];
    const wrapper = mount(
      <MultiSelectOptionList
        {...defaultProps}
        selectedOptionIndex={selectedOptionIndex}
        options={options} />
    );

    wrapper.find(MultiSelectOption).forEach((option, index) => {
      if (index === selectedOptionIndex) {
        assert.isTrue(option.props().active);
      } else {
        assert.isFalse(option.props().active);
      }
    });
  });
});

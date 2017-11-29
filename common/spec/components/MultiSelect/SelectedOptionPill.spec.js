import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { assert } from 'chai';
import SelectedOptionPill from 'common/components/MultiSelect/SelectedOptionPill';

describe('<SelectedOptionPill />', () => {
  const defaultProps = {
    onRemoveSelectedOption: () => {},
    renderSelectedOptionContents: () => {},
    selectedOption: 'hello',
    selectedOptionIndex: 1
  };

  it('calls renderSelectedOptionContents with the given option and index', () => {
    const renderSelectedOptionContentsSpy = sinon.spy();
    mount(
      <SelectedOptionPill
        {...defaultProps}
        selectedOption={'hello'}
        selectedOptionIndex={5}
        renderSelectedOptionContents={renderSelectedOptionContentsSpy} />
    );

    assert.isTrue(renderSelectedOptionContentsSpy.calledOnce);
    assert.isTrue(renderSelectedOptionContentsSpy.calledWith('hello', 5));
  });

  it('calls onRemoveSelectedOption when remove button is clicked', () => {
    const onRemoveSelectedOptionSpy = sinon.spy();
    const wrapper = mount(
      <SelectedOptionPill
        {...defaultProps}
        selectedOption={'hello'}
        selectedOptionIndex={5}
        onRemoveSelectedOption={onRemoveSelectedOptionSpy} />
    );

    wrapper.find('.multiselect-pill-remove-button').first().simulate('click');

    assert.isTrue(onRemoveSelectedOptionSpy.calledOnce);
    assert.isTrue(onRemoveSelectedOptionSpy.calledWith('hello', 5));
  });
});

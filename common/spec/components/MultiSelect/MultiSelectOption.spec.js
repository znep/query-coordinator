import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { assert } from 'chai';
import MultiSelectOption from 'common/components/MultiSelect/MultiSelectOption';

describe('<MultiSelectOption />', () => {
  const defaultProps = {
    active: false,
    index: 0,
    mouseMoved: true,
    option: 'Test',
    onSelectedOptionIndexChange: () => {},
    onAddSelectedOption: () => {},
    renderOption: () => {},
    setUsingMouse: () => {},
    usingMouse: false
  };

  it('uses proper className when active', () => {
    const wrapper = mount(
      <MultiSelectOption
        {...defaultProps}
        active />
    );

    assert.lengthOf(wrapper.find('.multiselect-option-active'), 1);
    assert.lengthOf(wrapper.find('.multiselect-option'), 0);
  });

  it('uses proper className when not active', () => {
    const wrapper = mount(
      <MultiSelectOption
        {...defaultProps}
        active={false} />
    );

    assert.lengthOf(wrapper.find('.multiselect-option-active'), 0);
    assert.lengthOf(wrapper.find('.multiselect-option'), 1);
  });

  it('calls onSelectedOptionIndexChange and setUsingMouse when moused over', () => {
    const onSelectedOptionIndexChangeSpy = sinon.spy();
    const setUsingMouseSpy = sinon.spy();
    const wrapper = mount(
      <MultiSelectOption
        {...defaultProps}
        index={5}
        onSelectedOptionIndexChange={onSelectedOptionIndexChangeSpy}
        setUsingMouse={setUsingMouseSpy} />
    );

    wrapper.find('.multiselect-option').first().simulate('mouseOver');

    assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
    assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(5));

    assert.isTrue(setUsingMouseSpy.calledOnce);
    assert.isTrue(setUsingMouseSpy.calledWith(true));
  });

  it('calls onAddSelectedOption when clicked', () => {
    const onAddSelectedOptionSpy = sinon.spy();
    const option = 'hello';
    const wrapper = mount(
      <MultiSelectOption
        {...defaultProps}
        option={option}
        onAddSelectedOption={onAddSelectedOptionSpy} />
    );

    wrapper.find('.multiselect-option').first().simulate('click');

    assert.isTrue(onAddSelectedOptionSpy.calledOnce);
    assert.isTrue(onAddSelectedOptionSpy.calledWith(option));
  });

  it('calls the renderOption method with option and index', () => {
    const renderOptionSpy = sinon.spy();
    const option = 'hello';
    mount(
      <MultiSelectOption
        {...defaultProps}
        option={option}
        index={5}
        renderOption={renderOptionSpy} />
    );

    assert.isTrue(renderOptionSpy.calledOnce);
    assert.isTrue(renderOptionSpy.calledWith(option, 5));
  });

  it('does not call onSelectedOptionIndexChange on mouseOver if the mouse has not moved', () => {
    const onSelectedOptionIndexChangeSpy = sinon.spy();
    const option = 'hello';
    const wrapper = mount(
      <MultiSelectOption
        {...defaultProps}
        mouseMoved={false}
        onSelectedOptionIndexChange={onSelectedOptionIndexChangeSpy}
        option={option}
        index={5} />
    );

    wrapper.find('.multiselect-option').first().simulate('mouseover');

    assert.isTrue(onSelectedOptionIndexChangeSpy.notCalled);
  });

  it('calls onSelectedOptionIndexChange on mouseOver if the mouse has moved', () => {
    const onSelectedOptionIndexChangeSpy = sinon.spy();
    const option = 'hello';
    const wrapper = mount(
      <MultiSelectOption
        {...defaultProps}
        mouseMoved
        onSelectedOptionIndexChange={onSelectedOptionIndexChangeSpy}
        option={option}
        index={5} />
    );

    wrapper.find('.multiselect-option').first().simulate('mouseover');

    assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
  });
});

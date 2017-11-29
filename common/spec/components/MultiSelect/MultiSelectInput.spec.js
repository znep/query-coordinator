import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { assert } from 'chai';
import MultiSelectInput from 'common/components/MultiSelect/MultiSelectInput';

describe('<MultiSelectInput />', () => {
  const defaultProps = {
    currentQuery: '',
    inputRef: () => {},
    onCurrentQueryChanged: () => {},
    onOptionsVisibilityChanged: () => {},
    onSelectedOptionIndexChange: () => {}
  };

  describe('onInputChange', () => {
    it('calls onCurrentQueryChanged with the event', () => {
      const onCurrentQueryChangedSpy = sinon.spy();
      const propsWithSpy = {
        ...defaultProps,
        onCurrentQueryChanged: onCurrentQueryChangedSpy
      };

      const wrapper = mount(<MultiSelectInput {...propsWithSpy} />);

      const event = { target: { value: 'hello' } };
      wrapper.find('input').first().simulate('change', event);

      assert.isTrue(onCurrentQueryChangedSpy.calledOnce);
    });

    it('calls onSelectedOptionIndexChange with null', () => {
      const onSelectedOptionIndexChangeSpy = sinon.spy();
      const propsWithSpy = {
        ...defaultProps,
        onSelectedOptionIndexChange: onSelectedOptionIndexChangeSpy
      };

      const wrapper = mount(<MultiSelectInput {...propsWithSpy} />);

      const event = { target: { value: 'hello' } };
      wrapper.find('input').first().simulate('change', event);

      assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
      assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(null));
    });

    it('shows results when typing if they are hidden', () => {
      const onOptionsVisibilityChangedSpy = sinon.spy();
      const propsWithSpy = {
        ...defaultProps,
        onOptionsVisibilityChanged: onOptionsVisibilityChangedSpy
      };

      const wrapper = mount(<MultiSelectInput {...propsWithSpy} />);

      const event = { target: { value: 'hello' } };
      wrapper.find('input').first().simulate('change', event);

      assert.isTrue(onOptionsVisibilityChangedSpy.calledOnce);
      assert.isTrue(onOptionsVisibilityChangedSpy.calledWith(true));
    });
  });

  it('passes along the input DOM node', () => {
    const inputRefSpy = sinon.spy();
    mount(
      <MultiSelectInput
        {...defaultProps}
        inputRef={inputRefSpy} />
    );

    assert.isTrue(inputRefSpy.calledOnce);
  });
});

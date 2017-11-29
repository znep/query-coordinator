import React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import MultiSelect from 'common/components/MultiSelect';
import SelectedOptionPill from 'common/components/MultiSelect/SelectedOptionPill';
import SelectedOptionsCount from 'common/components/MultiSelect/SelectedOptionsCount';

describe('<MultiSelect />', () => {
  const defaultProps = {
    shouldRenderResultsWhenQueryIsEmpty: false,
    currentQuery: '',
    noResultsMessage: 'No Reuslts',
    onAddSelectedOption: () => {},
    onCurrentQueryChanged: () => {},
    onRemoveSelectedOption: () => {},
    options: [],
    renderSelectedOptionContents: () => {},
    renderOption: () => {},
    selectedOptions: []
  };

  const fakeOptions = [
    'Labrador Retriever',
    'Golden Retriever',
    'Bulldog',
    'Beagle',
    'Poodle',
    'Labradoodle',
    'French Bulldog',
    'Pug',
    'Chihuahua'
  ];

  it('renders all the SelectedOptionPills', () => {
    const selectedOptions = [
      'Pick Me',
      'No Pick Me',
      'No way Pick Me',
      'Pick me instead'
    ];
    const wrapper = mount(
      <MultiSelect
        {...defaultProps}
        selectedOptions={selectedOptions} />
    );

    assert.lengthOf(wrapper.find(SelectedOptionPill), selectedOptions.length);
  });

  describe('maxSelectedOptions', () => {
    it('renders the number of selected options when maxSelectedOptions is present', () => {
      const wrapper = mount(
        <MultiSelect
          {...defaultProps}
          maxSelectedOptions={3} />
      );

      assert.lengthOf(wrapper.find(SelectedOptionsCount), 1);
    });

    it('does not render the number of selected options when maxSelectedOptions is not present', () => {
      const wrapper = mount(
        <MultiSelect
          {...defaultProps}
          maxSelectedOptions={null} />
      );

      assert.lengthOf(wrapper.find(SelectedOptionsCount), 0);
    });

    it('does not allow going above maxSelectedOptions', () => {
      const onAddSelectedOptionSpy = sinon.spy();
      const wrapper = mount(
        <MultiSelect
          {...defaultProps}
          maxSelectedOptions={3}
          onAddSelectedOption={onAddSelectedOptionSpy}
          selectedOptions={[1, 2, 3]} />
      );

      wrapper.instance().addSelectedOption(4);
      assert.isTrue(onAddSelectedOptionSpy.notCalled);
    });

    it('calls onAddSelectedOption when below maxSelectedOptions', () => {
      const onAddSelectedOptionSpy = sinon.spy();
      const wrapper = mount(
        <MultiSelect
          {...defaultProps}
          maxSelectedOptions={4}
          onAddSelectedOption={onAddSelectedOptionSpy}
          selectedOptions={[1, 2, 3]} />
      );

      wrapper.instance().addSelectedOption(4);
      assert.isTrue(onAddSelectedOptionSpy.calledOnce);
      assert.isTrue(onAddSelectedOptionSpy.calledWith(4));
    });
  });

  describe('handleKeyDown', () => {
    describe('ArrowDown', () => {
      it('shows results if they are not visible', () => {
        const wrapper = mount(<MultiSelect {...defaultProps} optionsVisible={false} />);
        const event = { key: 'ArrowDown' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, null);
        assert.equal(wrapper.state().optionsVisible, true);
      });

      it('scrolls to first option when no option is selected', () => {
        const selectedOptionIndex = null;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'ArrowDown' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, 0);
        assert.equal(wrapper.state().usingMouse, false);
      });

      it('scrolls down', () => {
        const selectedOptionIndex = 1;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'ArrowDown' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, selectedOptionIndex + 1);
        assert.equal(wrapper.state().usingMouse, false);
      });

      it('does not scroll past last option', () => {
        const selectedOptionIndex = fakeOptions.length - 1;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'ArrowDown' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, selectedOptionIndex);
      });
    });

    describe('ArrowUp', () => {
      it('calls onSelectedOptionIndexChange with null if at the top of reuslts', () => {
        const selectedOptionIndex = 0;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'ArrowUp' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, null);
        assert.equal(wrapper.state().usingMouse, false);
      });

      it('scrolls up', () => {
        const selectedOptionIndex = 1;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'ArrowUp' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, selectedOptionIndex - 1);
        assert.equal(wrapper.state().usingMouse, false);
      });

      it('does nothing is there is no selected item', () => {
        const selectedOptionIndex = null;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'ArrowUp' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().selectedOptionIndex, selectedOptionIndex);
      });
    });

    describe('Enter', () => {
      it('calls onAddSelectedOption when an option is selected', () => {
        const onAddSelectedOptionSpy = sinon.spy();
        const selectedOptionIndex = 1;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            onAddSelectedOption={onAddSelectedOptionSpy}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'Enter' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.isTrue(onAddSelectedOptionSpy.calledOnce);
        assert.isTrue(onAddSelectedOptionSpy.calledWith(fakeOptions[selectedOptionIndex]));
      });

      it('does nothing when no option is selected', () => {
        const onAddSelectedOptionSpy = sinon.spy();
        const selectedOptionIndex = null;
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            onAddSelectedOption={onAddSelectedOptionSpy}
            options={fakeOptions} />
        );
        wrapper.setState({
          optionsVisible: true,
          selectedOptionIndex
        });

        const event = { key: 'Enter' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.isTrue(onAddSelectedOptionSpy.notCalled);
      });
    });

    describe('Escape', () => {
      it('hides options', () => {
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            optionsVisible />
        );
        wrapper.setState({
          optionsVisible: true
        });

        const event = { key: 'Escape' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.equal(wrapper.state().optionsVisible, false);
      });
    });

    describe('Backspace', () => {
      it('calls onRemoveSelectedOption when query is empty', () => {
        const onRemoveSelectedOptionSpy = sinon.spy();
        const selectedOptions = [...fakeOptions];
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            onRemoveSelectedOption={onRemoveSelectedOptionSpy}
            options={fakeOptions}
            selectedOptions={selectedOptions} />
        );
        wrapper.setState({
          currentQuery: '',
          optionsVisible: true
        });

        const event = { key: 'Backspace' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.isTrue(onRemoveSelectedOptionSpy.calledOnce);
        assert.isTrue(onRemoveSelectedOptionSpy.calledWith(selectedOptions[selectedOptions.length - 1]));
      });

      it('does not delete when query is not empty', () => {
        const onRemoveSelectedOptionSpy = sinon.spy();
        const selectedOptions = [
          fakeOptions[1],
          fakeOptions[2],
          fakeOptions[3]
        ];
        const wrapper = mount(
          <MultiSelect
            {...defaultProps}
            onRemoveSelectedOption={onRemoveSelectedOptionSpy}
            options={fakeOptions} />
        );
        wrapper.setState({
          currentQuery: 'hello',
          optionsVisible: true,
          selectedOptions
        });

        const event = { key: 'Backspace' };
        wrapper.find('.multiselect-root').first().simulate('keyDown', event);

        assert.isTrue(onRemoveSelectedOptionSpy.notCalled);
      });
    });
  });
});

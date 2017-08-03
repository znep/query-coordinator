import sinon from 'sinon';
import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TagsInput from 'components/FormComponents/TagsInput';

const props = {
  name: 'tags',
  label: 'Tags / Keywords',
  value: ['one', 'four', 'three'],
  isPrivate: false,
  isRequired: false,
  placeholder: 'Enter tag name',
  inErrorState: false,
  setValue: sinon.spy(),
  handleBlur: () => {},
  handleFocus: () => {}
};

describe('components/FormComponents/TagsInput', () => {
  describe('rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<TagsInput {...props} />);
    });

    it('renders an input field and a tags list area', () => {
      assert.equal(component.find('input[type="text"]').length, 1);
    });

    it('renders an add button', () => {
      assert.equal(component.find('button').length, 1);
    });

    it('renders a tag component for each tag in the form data-model', () => {
      assert.equal(component.find('Tag').length, 3);
    });
  });

  describe('behavior', () => {
    let component;

    beforeEach(() => {
      component = mount(<TagsInput {...props} />);
    });

    it('calls proper callback functions when addTag method is invoked', () => {
      const addBtn = component.find('button');

      component.setState({ tag: 'four' });

      addBtn.simulate('click');

      assert.isTrue(component.props().setValue.calledOnce);
    });

    it('updates its internal state when change occurs in text input', () => {
      const inputField = component.find('input');

      inputField.simulate('change', { target: { value: 'hey' } });

      assert.equal(component.state().tag, 'hey');
    });
  });
});

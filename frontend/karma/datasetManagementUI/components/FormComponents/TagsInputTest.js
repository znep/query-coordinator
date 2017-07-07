import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TagsInput from 'components/FormComponents/TagsInput';

const props = {
  field: {
    name: 'tags',
    label: 'Tags / Keywords',
    value: ['one', 'four', 'three'],
    isPrivate: false,
    isRequired: false,
    placeholder: 'Enter tag name'
  },
  inErrorState: false,
  setValue: sinon.spy(),
  handleBlur: () => {}
};

describe('components/FormComponents/TagsInput', () => {
  describe('rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<TagsInput {...props} />);
    });

    it('renders an input field and a tags list area', () => {
      expect(component.find('input[type="text"]')).to.have.length(1);
    });

    it('renders an add button', () => {
      expect(component.find('button')).to.have.length(1);
    });

    it('renders a tag component for each tag in the form data-model', () => {
      expect(component.find('Tag')).to.have.length(3);
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

      expect(component.props().setValue.calledOnce).to.eq(true);
    });

    it('updates its internal state when change occurs in text input', () => {
      const inputField = component.find('input');

      inputField.simulate('change', { target: { value: 'hey' } });

      assert.equal(component.state().tag, 'hey');
    });
  });
});

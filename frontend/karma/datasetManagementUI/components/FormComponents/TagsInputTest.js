import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TagsInput from 'components/FormComponents/TagsInput';

const formAPI = {};

const props = {
  name: 'tag',
  subName: 'tags',
  placeholder: 'Enter tag name',
  fourfour: 'w24e-aezw',
  model: {
    tag: 'four',
    name: 'dsfgdf',
    tags: ['one', 'two', 'three']
  },
  schema: {
    fields: {
      tag: {
        isValid: true
      }
    }
  },
  required: false,
  inErrorState: false,
  showErrors: sinon.spy(),
  ...formAPI
};

describe('components/MetadataFields/TagsInput', () => {
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

      addBtn.simulate('click');

      expect(component.props().setModel.calledOnce).to.eq(true);
      expect(component.props().setDirtyProperty.calledOnce).to.eq(true);
      expect(component.props().removeDirtyProperty.calledOnce).to.eq(true);
    });

    it('calls its handleChange method when change occurs in text input', () => {
      const inputField = component.find('input');

      inputField.simulate('change');

      expect(component.props().setProperty.calledOnce).to.eq(true);
    });

    it('calls its showErrors callback on blur', () => {
      const inputField = component.find('input');

      inputField.simulate('blur');

      expect(component.props().showErrors.calledOnce).to.eq(true);
    });
  });
});

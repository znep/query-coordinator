import sinon from 'sinon';
import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TextInput from 'components/FormComponents/TextInput';

const props = {
  name: 'name',
  label: 'Dataset Title',
  value: 'ddd',
  isPrivate: false,
  isRequired: true,
  placeholder: 'Dataset Title',
  isCustom: false,
  inErrorState: false,
  handleChange: sinon.spy(),
  handleBlur: () => {},
  handleFocus: () => {}
};

describe('components/FormComponents/TextInput', () => {
  it('renders an input field', () => {
    const component = shallow(<TextInput {...props} />);
    assert.equal(component.find('input').length, 1);
  });

  it('calls its onChange callback on change', () => {
    const component = mount(<TextInput {...props} />);

    component.find('input').simulate('change');

    assert.isTrue(component.props().handleChange.calledOnce);
  });
});

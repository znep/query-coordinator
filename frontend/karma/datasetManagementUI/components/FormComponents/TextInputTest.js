import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TextInput from 'components/FormComponents/TextInput';

const formAPI = {};

const onChangeHandler = sinon.spy();

const props = {
  model: {
    name: 'seattle crimes',
    tags: [],
    email: '',
    description: ''
  },
  name: 'name',
  required: false,
  inErrorState: false,
  showErrors: sinon.spy(),
  bindInput: name => ({
    name: 'description',
    value: '',
    onChange: onChangeHandler
  }),
  ...formAPI
};

describe('MetadtaFields/TextInput', () => {
  it('renders an input field', () => {
    const component = shallow(<TextInput {...props} />);
    expect(component.find('input')).to.have.length(1);
  });

  it('calls showErrors callback on blur', () => {
    const component = mount(<TextInput {...props} />);

    component.find('input').simulate('blur');

    expect(component.props().showErrors.calledOnce).to.eq(true);
  });

  it('calls its onChange callback on change', () => {
    const component = mount(<TextInput {...props} />);

    component.find('input').simulate('change');

    expect(onChangeHandler.calledOnce).to.eq(true);
  });
});

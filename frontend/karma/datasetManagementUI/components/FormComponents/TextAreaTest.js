import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TextArea from 'components/FormComponents/TextArea';

const formAPI = {};

const onChangeHandler = sinon.spy();

const props = {
  model: {
    name: 'dsfgdf',
    tags: [],
    email: '',
    description: ''
  },
  schema: {
    isValid: false,
    fields: {
      name: {
        isValid: false,
        required: true,
        errors: ['name must have at least 10 characters']
      }
    }
  },
  name: 'description',
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

describe('MetadtaFields/TextArea', () => {
  it('renders a textarea', () => {
    const component = shallow(<TextArea {...props} />);
    expect(component.find('textarea')).to.have.length(1);
  });

  it('calls showErrors callback on blur', () => {
    const component = mount(<TextArea {...props} />);

    component.find('textarea').simulate('blur');

    expect(component.props().showErrors.calledOnce).to.eq(true);
  });

  it('calls its onChange callback on change', () => {
    const component = mount(<TextArea {...props} />);

    component.find('textarea').simulate('change');

    expect(onChangeHandler.calledOnce).to.eq(true);
  });
});

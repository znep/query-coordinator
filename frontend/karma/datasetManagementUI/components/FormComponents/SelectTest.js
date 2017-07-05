import sinon from 'sinon';
import { expect, assert } from 'chai';
import Select from 'components/FormComponents/Select';
import React from 'react';
import { shallow, mount } from 'enzyme';

const formAPI = {};

const changeListener = sinon.spy();

const props = {
  bindInput: name => ({
    name,
    onChange: changeListener
  }),
  options: [
    {
      title: 'Business',
      value: 'Business'
    },
    {
      title: 'Government',
      value: 'Government'
    },
    {
      title: 'Personal',
      value: 'Personal'
    }
  ],
  name: 'category',
  required: false,
  showErrors: sinon.spy()
};

describe('Select', () => {
  it('renders a select element', () => {
    const element = shallow(<Select {...props} />);

    expect(element.find('select')).to.have.length(1);
  });

  it('renders options as option tags', () => {
    const element = shallow(<Select {...props} />);

    expect(element.find('option')).to.have.length(3);
  });

  it('calls showErrors callback on blur', () => {
    const element = mount(<Select {...props} />);

    element.simulate('blur');

    expect(element.props().showErrors.calledOnce).to.eq(true);
  });

  it('calls bindInput-supplied callback on change', () => {
    const element = mount(<Select {...props} />);

    element.simulate('change');

    expect(changeListener.calledOnce).to.eq(true);
  });
});

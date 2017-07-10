import sinon from 'sinon';
import { expect, assert } from 'chai';
import Select from 'components/FormComponents/Select';
import React from 'react';
import { shallow, mount } from 'enzyme';

const props = {
  field: {
    name: 'animals',
    label: 'animals',
    value: 'cat',
    isRequired: true,
    options: [
      {
        title: '-- No Selection --',
        value: ''
      },
      {
        title: 'dog',
        value: 'dog'
      },
      {
        title: 'cat',
        value: 'cat'
      },
      {
        title: 'pig',
        value: 'pig'
      },
      {
        title: 'sheep',
        value: 'sheep'
      }
    ],
    isCustom: true
  },
  inErrorState: false,
  setValue: sinon.spy(),
  handleBlur: () => {},
  handleFocus: () => {}
};

describe('Select', () => {
  it('renders a select element', () => {
    const element = shallow(<Select {...props} />);

    expect(element.find('select')).to.have.length(1);
  });

  it('renders options as option tags', () => {
    const element = shallow(<Select {...props} />);

    expect(element.find('option')).to.have.length(5);
  });

  it('calls setValue callback on change', () => {
    const element = mount(<Select {...props} />);

    element.simulate('change');

    expect(element.props().setValue.calledOnce).to.eq(true);
  });
});

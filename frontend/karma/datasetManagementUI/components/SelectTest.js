import sinon from 'sinon';
import { assert } from 'chai';
import Select from 'components/Select/Select';
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
  handleChange: sinon.spy(),
};

describe('components/Select', () => {
  it('renders a select element', () => {
    const element = shallow(<Select {...props} />);

    assert.equal(element.find('select').length, 1);
  });

  it('renders options as option tags', () => {
    const element = shallow(<Select {...props} />);

    assert.equal(element.find('option').length, 5);
  });

  it('calls setValue callback on change', () => {
    const element = mount(<Select {...props} />);

    element.simulate('change');

    assert.isTrue(element.props().handleChange.calledOnce);
  });
});

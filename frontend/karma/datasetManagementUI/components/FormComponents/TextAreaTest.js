import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TextArea from 'components/FormComponents/TextArea';

const props = {
  field: {
    name: 'description',
    label: 'Brief Description',
    value: 'kk',
    isPrivate: false,
    isRequired: false,
    placeholder: 'Enter a description'
  },
  inErrorState: false,
  setValue: sinon.spy(),
  handleBlur: () => {},
  handleFocus: () => {}
};

describe('components/FormComponents/TextArea', () => {
  it('renders a textarea', () => {
    const component = shallow(<TextArea {...props} />);
    expect(component.find('textarea')).to.have.length(1);
  });

  it('calls setValue callback on change', () => {
    const component = mount(<TextArea {...props} />);

    component.find('textarea').simulate('change');

    expect(component.props().setValue.calledOnce).to.eq(true);
  });
});

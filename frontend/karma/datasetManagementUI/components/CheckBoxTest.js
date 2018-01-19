import sinon from 'sinon';
import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import CheckBox from 'datasetManagementUI/components/CheckBox/CheckBox';

const props = {
  name: 'flag',
  label: 'Some Flag',
  value: true,
  handleClick: sinon.spy()
};

describe('components/CheckBox', () => {
  it('renders an input field', () => {
    const component = shallow(<CheckBox {...props} />);
    assert.equal(component.find('input').length, 1);
  });

  it('calls its handleClick callback on change', () => {
    const component = mount(<CheckBox {...props} />);

    component.find('input').simulate('change');

    assert.isTrue(component.props().handleClick.calledOnce);
  });
});

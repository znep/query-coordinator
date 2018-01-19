import sinon from 'sinon';
import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import TextArea from 'datasetManagementUI/components/TextArea/TextArea';

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
  handleChange: sinon.spy()
};

describe('components/TextArea', () => {
  it('renders a textarea', () => {
    const component = shallow(<TextArea {...props} />);
    assert.equal(component.find('textarea').length, 1);
  });

  it('calls setValue callback on change', () => {
    const component = mount(<TextArea {...props} />);

    component.find('textarea').simulate('change');

    assert.isTrue(component.props().handleChange.calledOnce);
  });
});

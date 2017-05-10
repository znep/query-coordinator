import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import SaveButton from 'components/ManageMetadata/SaveButton';

describe('components/ManageMetadata/SaveButton', () => {
  const props = {
    onSaveClick: sinon.spy(),
    isSaving: false
  };

  it('calls its onSaveClick callback when clicked', () => {
    const component = mount(<SaveButton {...props} />);

    component.simulate('click');

    expect(component.props().onSaveClick.calledOnce).to.eq(true);
  });
});

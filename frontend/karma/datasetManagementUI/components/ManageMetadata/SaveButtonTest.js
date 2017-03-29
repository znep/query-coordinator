import React from 'react';
import { shallow, mount } from 'enzyme';
import SaveButton from 'components/ManageMetadata/SaveButton';

describe('components/ManageMetadata/SaveButton', () => {
  const props = {
    onSaveClick: sinon.spy(),
    isDirty: {
      form: false
    }
  };

  const dirtyProps = {
    ...props,
    isDirty: {
      form: true
    }
  };

  it('is disabled when form is clean', () => {
    const component = shallow(<SaveButton {...props} />);

    expect(component.props().disabled).to.eq(true);
  });

  it('is enabled when form is dirty', () => {
    const component = shallow(<SaveButton {...dirtyProps} />);

    expect(component.props().disabled).to.eq(false);
  });

  it('calls its onSaveClick callback when clicked and dirty', () => {
    const component = mount(<SaveButton {...dirtyProps} />);

    component.simulate('click');

    expect(component.props().onSaveClick.calledOnce).to.eq(true);
  });

  it('doesn\'t call it\'s onSaveClick callback when clicked and clean', () => {
    const component = mount(<SaveButton {...props} />);

    component.simulate('click');

    expect(component.props().onSaveClick.calledOnce).to.eq(true);
  });
});

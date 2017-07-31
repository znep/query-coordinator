import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { Dropdown } from 'common/components';
import UserRow from 'components/user_row';

import { singleRowState } from '../helpers/stateFixtures';

describe('components/UserRow', () => {
  const defaultProps = {
    ...singleRowState,
    onSelectionChange: sinon.spy(),
    onRoleChange: sinon.spy()
  };

  it('renders a row with 6 columns when passed default props', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    expect(component.find('td')).to.have.length(6);
  });

  it('calls the onSelectionChange function when the checkbox is checked', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    const checkbox = component.find('input');
    checkbox.simulate('change');

    expect(defaultProps.onSelectionChange.calledOnce).to.be.true;
  });

  it('passes the onRoleChange function to the dropdown', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    const dropdown = component.find(Dropdown);
    dropdown.props().onSelection({value: 'administrator', title: 'Administrator'});

    expect(defaultProps.onRoleChange.calledWith('administrator'));
  });
})

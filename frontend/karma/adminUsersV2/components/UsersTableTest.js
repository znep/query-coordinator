import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { UsersTable } from 'components/users_table';
import UserRow from 'components/user_row';

import { initialState } from '../helpers/stateFixtures';

describe('components/UsersTable', () => {
  const defaultProps = {
    ...initialState,
    onRoleChange: sinon.spy(),
    onSelectionChange: sinon.spy(),
    onSelectAll: sinon.spy()
  };

  it('renders a table with 40 rows', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    const header = component.find('thead');
    const rows = component.find('tbody');
    expect(header.find('tr').children()).to.have.length(6);
    expect(rows.children()).to.have.length(40);
  });

  it('passes the onRoleChange function to a row', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    const rows = component.find(UserRow);
    const firstRow = rows.first();
    firstRow.props().onRoleChange('administrator');

    assert(defaultProps.onRoleChange.calledWith(defaultProps.users[0].id, 'administrator'));
  });

  it('passes the onSelectionChange function to a row', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    const rows = component.find(UserRow);
    const firstRow = rows.first();
    firstRow.props().onSelectionChange();
    assert(defaultProps.onSelectionChange.calledWith(defaultProps.users[0].id, true));
  });

  it('calls onSelectAll when the header checkbox is called', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    const header = component.find('thead');
    const checkbox = header.find('input');
    checkbox.simulate('change');

    assert(defaultProps.onSelectAll.calledWith(true),
      `onSelectionChange was called with ${defaultProps.onSelectionChange.getCall(0).args}`);
  })
});

import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { UsersTable } from 'components/UsersTable';
import { LocalizedUserRow } from 'components/UserRow';
import I18nJS from 'i18n-js';

import { initialState } from '../helpers/stateFixtures';

describe('components/UsersTable', () => {
  const defaultProps = {
    ...initialState,
    onRoleChange: sinon.spy(),
    onRemoveUserRole: sinon.spy(),
    I18n: I18nJS,
    loadingData: false
  };

  it('renders a table with 41 rows', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    const header = component.find('thead');
    const rows = component.find('tbody');
    expect(header.find('tr').children()).to.have.length(5);
    expect(rows.children()).to.have.length(41);
  });

  it('passes the onRoleChange function to a row', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    const rows = component.find(LocalizedUserRow);
    const firstRow = rows.first();
    firstRow.props().onRoleChange('administrator');

    assert(defaultProps.onRoleChange.calledWith(defaultProps.users[0].id, 'administrator'));
  });
});

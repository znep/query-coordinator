import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';

import { InvitedUsersTable } from 'components/InvitedUsersTable';
import I18nJS from 'i18n-js';

import { invitedUsers } from '../helpers/stateFixtures';

describe('components/UsersTable', () => {
  const defaultProps = {
    invitedUsers,
    I18n: I18nJS
  };

  it('renders a table with 1 rows', () => {
    const component = shallow(<InvitedUsersTable {...defaultProps} />);
    const header = component.find('thead');
    const rows = component.find('tbody');
    expect(header.find('tr').children()).to.have.length(4);
    expect(rows.children()).to.have.length(1);
  });
});

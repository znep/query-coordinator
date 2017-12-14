import { assert, expect } from 'chai';
import { mount } from 'enzyme';
import React from 'react';

import { InvitedUsersTable } from 'invitedUsers/components/InvitedUsersTable';
import I18nJS from 'i18n-js';

import { invitedUsers } from '../../helpers/stateFixtures';

describe('components/InvitedUsersTable', () => {
  const defaultProps = {
    invitedUsers,
    loadingData: false,
    I18n: I18nJS
  };

  it('renders a table with 1 rows', () => {
    const component = mount(<InvitedUsersTable {...defaultProps} />);
    const header = component.find('thead');
    const body = component.find('tbody');
    expect(header.find('th')).to.have.length(4);
    expect(body.find('tr')).to.have.length(1);
  });
});

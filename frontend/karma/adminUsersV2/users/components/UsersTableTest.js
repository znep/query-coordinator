import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { UsersTable } from 'adminUsersV2/users/components/UsersTable';
import I18nJS from 'i18n-js';

import { initialState } from '../../helpers/stateFixtures';
import ResultsTable from 'adminUsersV2/components/ResultsTable';

describe('components/UsersTable', () => {
  const defaultProps = {
    ...initialState,
    onRoleChange: sinon.spy(),
    onRemoveUserRole: sinon.spy(),
    onResetPassword: sinon.spy(),
    I18n: I18nJS,
    loadingData: false
  };

  it('renders a table with 5 columns', () => {
    const component = shallow(<UsersTable {...defaultProps} />);
    expect(component.find(ResultsTable.Column)).to.have.length(5);
  });
});

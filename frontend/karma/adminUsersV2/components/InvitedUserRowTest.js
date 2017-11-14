import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';

import { Dropdown } from 'common/components';
import { InvitedUserRow } from 'components/InvitedUserRow';
import I18nJS from 'i18n-js';

import { invitedUsers } from '../helpers/stateFixtures';

describe('components/InvitedUserRow', () => {
  const defaultProps = {
    ...invitedUsers[0],
    invited: '[invited date]',
    invitedLabel: '[invited label]',
    I18n: I18nJS
  };

  it('renders a row with an invited user', () => {
    const component = shallow(<InvitedUserRow {...defaultProps} />);
    expect(component.find('td')).to.have.length(4);
  });

});

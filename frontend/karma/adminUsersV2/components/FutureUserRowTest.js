import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';

import { Dropdown } from 'common/components';
import { FutureUserRow } from 'components/FutureUserRow';
import I18nJS from 'i18n-js';

import { futureUsers } from '../helpers/stateFixtures';

describe('components/FutureUserRow', () => {
  const defaultProps = {
    ...futureUsers[0],
    invited: '[invited date]',
    invitedLabel: '[invited label]',
    I18n: I18nJS
  };

  it('renders a row with a future user', () => {
    const component = shallow(<FutureUserRow {...defaultProps} />);
    expect(component.find('td')).to.have.length(4);
  });

});

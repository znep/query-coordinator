import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { Dropdown } from 'common/components';
import { UserRow } from 'components/UserRow';
import I18nJS from 'i18n-js';

import { singleRowState } from '../helpers/stateFixtures';
import moment from 'moment';

describe('components/UserRow', () => {
  const defaultProps = {
    ...singleRowState,
    onRoleChange: sinon.spy(),
    I18n: I18nJS
  };

  it('renders a row with 4 columns when passed default props', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    expect(component.find('td')).to.have.length(4);
  });

  it('passes the onRoleChange function to the dropdown', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    const dropdown = component.find(Dropdown);
    dropdown.props().onSelection({value: 'administrator', title: 'Administrator'});

    expect(defaultProps.onRoleChange.calledWith('administrator'));
  });

  it('sets last active to unknown when nothing is passed in', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    const lastActive = component.find("td").at(2);

    expect(lastActive.text()).to.eq('unknown');
  });

  it('sets last active to today when a recent time is passed in', () => {
    const props = {
      ...defaultProps,
      lastAuthenticatedAt: parseInt(moment().hour(12).format('X'))
    };
    const component = shallow(<UserRow {...props} />);
    const lastActive = component.find("td").at(2);

    expect(lastActive.text()).to.eq('today');
  });

  it('sets last active to 7 days ago when a date of a week ago is passed in', () => {
    const props = {
      ...defaultProps,
      lastAuthenticatedAt: parseInt(moment().subtract(1, 'week').format('X'))
    };
    const component = shallow(<UserRow {...props} />);
    const lastActive = component.find("td").at(2);

    expect(lastActive.text()).to.eq('7 days ago');
  });

})

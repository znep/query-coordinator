import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { Dropdown } from 'common/components';
import { UserRow } from 'components/user_row';
import I18nJS from 'i18n-js';

import { singleRowState } from '../helpers/stateFixtures';
import moment from 'moment';

describe('components/UserRow', () => {
  const defaultProps = {
    ...singleRowState,
    onSelectionChange: sinon.spy(),
    onRoleChange: sinon.spy(),
    I18n: I18nJS
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

  it('sets last active to unknown when nothing is passed in', () => {
    const component = shallow(<UserRow {...defaultProps} />);
    const lastActive = component.find("td").at(3);

    expect(lastActive.text()).to.eq('unknown');
  });

  it('sets last active to today when a recent time is passed in', () => {
    const props = {
      ...defaultProps,
      lastActive: moment().hour(12).format('X')
    };
    const component = shallow(<UserRow {...props} />);
    const lastActive = component.find("td").at(3);

    expect(lastActive.text()).to.eq('today');
  });

  it('sets last active to 7 days ago when a date of a week ago is passed in', () => {
    const props = {
      ...defaultProps,
      lastActive: moment().subtract(1, 'week').format('X')
    };
    const component = shallow(<UserRow {...props} />);
    const lastActive = component.find("td").at(3);

    expect(lastActive.text()).to.eq('7 days ago');
  });

})

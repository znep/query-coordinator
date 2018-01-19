import { expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import moment from 'moment';

import DateFromNow from 'adminUsersV2/components/DateFromNow';

describe('components/DateFromNow', () => {
  const testProps = {
    todayLabel: 'today',
    unknownLabel: 'unknown'
  };

  it('sets last active to unknown when nothing is passed in', () => {
    const component = shallow(<DateFromNow {...testProps} />);
    expect(component.text()).to.eq('unknown');
  });

  it('sets last active to today when a recent time is passed in', () => {
    const props = {
      ...testProps,
      timestamp: parseInt(moment().hour(12).format('X'))
    };
    const component = shallow(<DateFromNow {...props} />);
    expect(component.text()).to.eq('today');
  });

  it('sets last active to 7 days ago when a date of a week ago is passed in', () => {
    const props = {
      ...testProps,
      timestamp: parseInt(moment().subtract(1, 'week').format('X'))
    };
    const component = shallow(<DateFromNow {...props} />);
    expect(component.text()).to.eq('7 days ago');
  });

})

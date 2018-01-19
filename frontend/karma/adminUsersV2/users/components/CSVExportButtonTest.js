import { assert, expect } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';

import I18nJS from 'i18n-js';
import { CSVExportButton } from 'adminUsersV2/users/components/CSVExportButton';

describe('components/CSVExportButton', () => {
  const defaultProps = {
    I18n: I18nJS,
    href: '/users.csv'
  };

  it('renders a button', () => {
    const component = shallow(<CSVExportButton {...defaultProps} />);
    const anchor = component.find('a');
    expect(anchor).to.have.length(1);
    expect(anchor.prop('href')).to.equal('/users.csv');
  });
});

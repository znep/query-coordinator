import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import HomePaneSidebar from 'components/HomePaneSidebar/HomePaneSidebar';

describe('components/HomePaneSidebar', () => {
  it('renders', () => {
    const component = shallow(<HomePaneSidebar />);

    assert.equal(component.find('h2').first().text(), 'Recent Actions');
  });
});

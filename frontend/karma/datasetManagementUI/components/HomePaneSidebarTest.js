import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import HomePaneSidebar from 'components/HomePaneSidebar/HomePaneSidebar';

describe('components/HomePaneSidebar', () => {
  it('shows the RecentActions tab by default', () => {
    const component = shallow(<HomePaneSidebar />);

    assert.equal(
      component.find('withRouter(Connect(RecentActions))').length,
      1
    );
  });

  it('allows you to override the default tab via props', () => {
    const component = shallow(<HomePaneSidebar defaultTab="manageData" />);

    assert.equal(component.find('withRouter(Connect(ManageData))').length, 1);
  });

  it('shows the ManageData content when you click the corresponding tab', () => {
    const component = shallow(<HomePaneSidebar />);

    const manageDataTab = component.find('button').at(1);

    manageDataTab.simulate('click');

    assert.equal(component.find('withRouter(Connect(ManageData))').length, 1);
  });

  it('shows the RecentActions content when you click the corresponding tab', () => {
    const component = shallow(<HomePaneSidebar defaultTab="manageData" />);

    const manageRecentActionsTab = component.find('button').at(0);

    manageRecentActionsTab.simulate('click');

    assert.equal(
      component.find('withRouter(Connect(RecentActions))').length,
      1
    );
  });
});

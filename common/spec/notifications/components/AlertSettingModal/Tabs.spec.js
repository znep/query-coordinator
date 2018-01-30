import _ from 'lodash';
import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import Tabs from 'common/notifications/components/AlertSettingModal/Tabs';

describe('Tabs', () => {

  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);

    assert.isDefined(element);
  });

  it('should renders notification, my_alerts tabs', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} showMyAlertsTab />);
    const liTabs = element.find('li');

    assert.lengthOf(liTabs, 2);
  });

  it('should call tab change function on click', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);

    element.find('li a').first().simulate('click');

    sinon.assert.calledOnce(spy);
  });

  it('should hide my alerts tab if showMyAlertsTab props is false', () => {
    const props = { showMyAlertsTab: false, selectedTab: 'notification', onTabChange: _.noop };
    const element = mount(<Tabs {...props} />);
    const liTabs = element.find('li');

    assert.lengthOf(liTabs, 1);
  });
});

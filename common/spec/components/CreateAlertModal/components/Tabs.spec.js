import TestUtils from 'react-dom/test-utils';
import React, { Component } from 'react';
import { mount } from 'enzyme';

import Tabs from 'common/components/CreateAlertModal/components/Tabs';

describe('Tabs', () => {

  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);
    assert.isDefined(element);
  });

  it('should renders custom_alert, advance_alert tabs', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);
    const liTabs = element.find('li');
    assert.equal(liTabs.length, 2);
  });

  it('should call tab change function on click', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);
    element.find('li').first().simulate('click');
    sinon.assert.calledOnce(spy);
  });

  it('should hide non active tab in edit mode', () => {
    const spy = sinon.spy();
    const props = { editMode: true, selectedTab: 'customAlert', onTabChange: spy };
    const element = mount(<Tabs {...props} />);
    const liTabs = element.find('li');
    assert.equal(liTabs.length, 1);
  });

});

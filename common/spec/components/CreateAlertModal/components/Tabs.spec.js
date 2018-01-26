import { mount } from 'enzyme';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';

import Tabs from 'common/components/CreateAlertModal/components/Tabs';

describe('Tabs', () => {

  it('renders an element', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);

    assert.isDefined(element);
  });

  it('should render custom_alert & advance_alert tabs', () => {
    const spy = sinon.spy();
    const element = mount(<Tabs onTabChange={spy} />);
    const liTabs = element.find('li');

    assert.lengthOf(liTabs, 2);
  });

  it('should call onTabChange function on click', () => {
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

    assert.lengthOf(liTabs, 1);
  });
});

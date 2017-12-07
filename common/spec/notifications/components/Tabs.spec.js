import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';

import renderLocalizationElement from '../renderLocalizationComponent';
import Tabs from 'common/notifications/components/Tabs/Tabs';

describe('Tabs', () => {
  const defaultProps = {
    children: <div>Moo</div>,
    filterNotifications: () => {},
    hasSecondaryPanel: false,
    selectedTab: ''
  };

  it('should render user notifications filter tabs', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(Tabs, { ...defaultProps, tabs: [] });

    assert.isNotNull(element);
  });

  it('should filter user notifications on tab change', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(Tabs, {
      ...defaultProps,
      tabs: ['alert'],
      filterNotifications: spy
    });
    const tab = element.querySelector('.notification-tab');

    assert.isNotNull(tab);
    Simulate.click(tab);
    sinon.assert.calledOnce(spy);
  });
});

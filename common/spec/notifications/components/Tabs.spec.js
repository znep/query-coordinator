import { Simulate } from 'react-dom/test-utils';

import renderLocalizationElement from '../renderLocalizationComponent'
import Tabs from 'common/notifications/components/Tabs/Tabs';

describe('Tabs', () => {
  function getProps(props) {
    return {
      ...props
    };
  }

  it('should render user notifications filter tabs', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(Tabs, getProps({ tabs: [] }));

    assert.isNotNull(element);
  });

  it('should filter user notifications on tab change', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(Tabs,
      getProps({
        tabs: ['alert'],
        filterNotifications: spy
      })
    );
    const tab = element.querySelector('.notification-tab');

    assert.isNotNull(tab);
    Simulate.click(tab);
    sinon.assert.calledOnce(spy);
  });
});

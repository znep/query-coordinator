import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import { NotificationList } from 'components/Notifications/NotificationList';

describe('components/NotificationList/NotificationList', () => {
  const defaultProps = {
    notifications: [
      {
        id: '75973bf0-0cf0-450f-ad88-40e2050dad7b',
        kind: 'upload',
        callId: 'cb2fe2fe-52c3-4812-a951-51ec5a9e77b6',
        sourceId: 121
      },
      {
        id: '75973bf0-0cf0-450f-ad88-40e2050d333b',
        kind: 'upload',
        callId: 'cb2fe2fe-52c3-4812-a951-51ec5a9e7333',
        sourceId: 122
      }
    ]
  };

  const component = shallow(<NotificationList {...defaultProps} />);

  it('renders a css animation', () => {
    assert.equal(component.find('ReactCSSTransitionGroup').length, 1);
  });

  it('renders the correct number of notifications', () => {
    assert.equal(component.find('Connect(UploadNotification)').length, 2);
  });
});

import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import NotificationList from 'components/NotificationList/NotificationList';

describe('components/NotificationList', () => {
  const defaultProps = {
    notifications: [
      {
        kind: 'source',
        subject: 121
      },
      {
        kind: 'source',
        subject: 122
      }
    ]
  };

  const component = shallow(<NotificationList {...defaultProps} />);

  it('renders a css animation', () => {

    assert.equal(component.find('TransitionGroup').length, 1);
  });

  it('renders the correct number of notifications', () => {
    assert.equal(component.find('Connect(UploadNotification)').length, 2);
  });
});

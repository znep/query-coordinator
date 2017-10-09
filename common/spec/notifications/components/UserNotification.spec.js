import { Simulate } from 'react-dom/test-utils';

import renderLocalizationElement from '../renderLocalizationComponent'
import UserNotification from 'common/notifications/components/UserNotifications/UserNotification';

describe('UserNotification', () => {

  it('should render user notification item', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotification, {
      message_body: 'test-body',
      activity_type: 'test-title',
      dataset_name: 'WORKFLOWTEST',
      dataset_uid: 'binx-cnrq',
      domain_cname: 'elumitas.test-socrata.com',
      acting_user_name: 'Vinu',
      acting_user_id: 'gbyy-925e',
      created_at: 1484888755016
    });

    assert.isNotNull(element);
  });

  it('should render notification title, body, and timestamp', () => {
    var element = renderLocalizationElement(UserNotification, {
      message_body: 'test-body',
      activity_type: 'test-title',
      dataset_name: 'WORKFLOWTEST',
      created_at: 1484888755016
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.user-notification-title'));
    assert.isNotNull(element.querySelector('.notification-body'));
    assert.isNotNull(element.querySelector('.notification-timestamp'));
  });

  it('should mark the notification as read when clicked on checkmark link of a unread notification', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotification, {
      message_body: 'test-body',
      activity_type: 'test-title',
      dataset_name: 'WORKFLOWTEST',
      created_at: 1484888755016,
      onToggleReadUserNotification: spy
    });
    const markAsReadLink = element.querySelector('.toggle-notification-read-state');

    assert.isNotNull(markAsReadLink);
    Simulate.click(markAsReadLink);
    sinon.assert.calledOnce(spy);
  });

  it('should clear the notification from notification list when clicked on "clear notification link"', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotification, {
      message_body: 'test-body',
      activity_type: 'test-title',
      dataset_name: 'WORKFLOWTEST',
      created_at: 1484888755016,
      onClearUserNotification: spy
    });
    const clearNotificationLink = element.querySelector('.user-notification-clear-icon');

    assert.isNotNull(clearNotificationLink);
    Simulate.click(clearNotificationLink);
    sinon.assert.calledOnce(spy);
  });
});

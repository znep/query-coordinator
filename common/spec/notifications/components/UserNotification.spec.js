import { Simulate } from 'react-dom/test-utils';

import renderLocalizationElement from '../renderLocalizationComponent';
import UserNotification from 'common/notifications/components/UserNotifications/UserNotification';

describe('UserNotification', () => {
  const defaultProps = {
    id: 1234,
    isRead: false,
    isTransientNotification: false,
    onClearUserNotification: () => {},
    onToggleReadUserNotification: () => {},
    type: 'alert',
    activityUniqueKey: 'activity unique key',
    userName: 'someone who sets default prop types yo',
    userProfileLink: ''
  };

  it('should render user notification item', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotification, {
      ...defaultProps,
      messageBody: 'test-body',
      activityType: 'test-title',
      datasetName: 'WORKFLOWTEST',
      datasetUid: 'binx-cnrq',
      domainCname: 'elumitas.test-socrata.com',
      actingUserName: 'Vinu',
      actingUserId: 'gbyy-925e',
      createdAt: '2013-02-04T18:35:24+00:00'
    });

    assert.isNotNull(element);
  });

  it('should render notification title, body, and timestamp', () => {
    var element = renderLocalizationElement(UserNotification, {
      ...defaultProps,
      messageBody: 'test-body',
      activityType: 'test-title',
      datasetName: 'WORKFLOWTEST',
      createdAt: '2013-02-04T18:35:24+00:00'
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.user-notification-title'));
    assert.isNotNull(element.querySelector('.notification-body'));
    assert.isNotNull(element.querySelector('.notification-timestamp'));
  });

  it('should mark the notification as read when clicked on checkmark link of a unread notification', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotification, {
      ...defaultProps,
      messageBody: 'test-body',
      activityType: 'test-title',
      datasetName: 'WORKFLOWTEST',
      createdAt: '2013-02-04T18:35:24+00:00',
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
      ...defaultProps,
      messageBody: 'test-body',
      activityType: 'test-title',
      datasetName: 'WORKFLOWTEST',
      createdAt: '2013-02-04T18:35:24+00:00',
      onClearUserNotification: spy
    });
    const clearNotificationLink = element.querySelector('.user-notification-clear-icon');

    assert.isNotNull(clearNotificationLink);
    Simulate.click(clearNotificationLink);
    sinon.assert.calledOnce(spy);
  });
});

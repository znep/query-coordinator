import renderLocalizationElement from '../renderLocalizationComponent';
import UserNotificationList from 'common/notifications/components/UserNotifications/UserNotificationList';

describe('UserNotificationList', () => {
  const defaultProps = {
    filterNotificationsBy: 'activity',
    hasEnqueuedUserNotifications: () => {},
    onClearUserNotification: () => {},
    onLoadMoreUserNotifications: () => {},
    onSeeNewUserNotifications: () => {},
    onToggleReadUserNotification: () => {}
  };

  it('should render a list of user notifications', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotificationList, {
      ...defaultProps,
      userNotifications: [{
        activityType: 'CollaboratorRemoved',
        createdAt: '2017-10-03T08:20:35.042',
        id: 167,
        link: '//elumitas.test-socrata.com/dataset/TESTprivate/ckdr-r2rz',
        messageBody: 'TESTprivate',
        read: false,
        title: 'Collaborator Removed',
        type: 'status',
        userName: 'Vinu',
        userProfileLink: '//elumitas.test-socrata.com/profile/Vinu/gbyy-925e',
        activityUniqueKey: 'activity unique key'
      }]
    });

    assert.isNotNull(element);
  });

  it('should render a list of user alert notifications ', () => {
    const element = renderLocalizationElement(UserNotificationList, {
      ...defaultProps,
      userNotifications: [{
        alertName: 'mock Alert',
        createdAt: '2017-10-03T08:20:35.042',
        id: 167,
        link: '//elumitas.test-socrata.com/dataset/TESTprivate/ckdr-r2rz',
        messageBody: 'TESTprivate',
        read: false,
        type: 'alert',
        userName: 'testUser',
        activityUniqueKey: 'activity unique key'
      }]
    });

    assert.isNotNull(element);
  });

  it('should show no user notification message if notification list is empty', () => {
    const element = renderLocalizationElement(UserNotificationList, {
      ...defaultProps,
      userNotifications: [],
      showProductNotificationsAsSecondaryPanel: true,
      isSecondaryPanelOpen: true
    });

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.no-user-notifications-message'));
  });
});

import renderLocalizationElement from '../renderLocalizationComponent'
import UserNotificationList from 'common/notifications/components/UserNotifications/UserNotificationList';

describe('UserNotificationList', () => {

  function getProps(props) {
    return {
      ...props
    };
  }

  it('should render a list of user notifications', () => {
    const spy = sinon.spy();
    const element = renderLocalizationElement(UserNotificationList, getProps());
    assert.isNotNull(element);
  });

  it('should show no user notification message if notification list is empty', () => {
    const element = renderLocalizationElement(UserNotificationList,
      getProps({
        showProductNotificationsAsSecondaryPanel: true,
        isSecondaryPanelOpen: true
      })
    );

    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.no-user-notifications-message'));
  });
});

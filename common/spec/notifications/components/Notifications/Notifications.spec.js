import _ from 'lodash';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';
import { mockResponse } from '../../helpers';
import { fakeNotifications, fakeZeroNotifications } from '../../data';
import renderLocalizationElement from '../../renderLocalizationComponent';
import Notifications, { __RewireAPI__ as NotificationsAPI } from 'common/notifications/components/Notifications/Notifications';
import AlertPreferenceAPI from 'common/notifications/api/AlertPreferenceAPI';
import 'intl/locale-data/jsonp/en.js';

describe('notifications', () => {
  describe('Product Notifications', () => {
    const options = {
      inProductTransientNotificationsEnabled: false,
      isSuperAdmin: false,
      showProductNotifications: true,
      showUserNotifications: false
    };

    beforeEach(() => {
      sinon.stub(window, 'fetch');
    });

    afterEach(() => {
      window.fetch.restore();
    });

    it('should open notifications panel, show unread indicator, list all product notifications and close the panel when clicked on "X" link', (done) => {
      window.fetch.returns(Promise.resolve(
        mockResponse(fakeNotifications, 200)
      ));

      const component = renderLocalizationElement(Notifications, { options });

      _.defer(() => {
        assert.isNotNull(component);

        // expect panel should be closed by default
        let panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        // find the bell, make sure it has the unread indicator, and click to open the panel
        let bell = component.querySelector('.notifications-bell');
        assert.isNotNull(bell);
        assert.isTrue(bell.classList.contains('has-unread-notifications'));

        // Notifications header should have new notification count label
        Simulate.click(bell);

        // after clicking the bell, the panel should open
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNotNull(panel);

        // there should be as many notifications as there are in our test data
        assert.lengthOf(panel.querySelectorAll('.notification-item'), fakeNotifications.notifications.length);

        // find colse notifications button, expect panel to close after clicking close notificaiton button
        let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
        assert.isNotNull(closeNotificationPanelLink);

        // after clicking the close notifications panel link panel shold be closed
        Simulate.click(closeNotificationPanelLink);
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        done();
      });
    });

    it('should open notifications panel, check for unread product notifications, show "N New" label, and mark all the product notifications as read when clicked on "Mark As Read" button and hide "N New" label', (done) => {
      window.fetch.returns(Promise.resolve(
        mockResponse(fakeNotifications, 200)
      ));

      const component = renderLocalizationElement(Notifications, { options });

      _.defer(() => {
        assert.isNotNull(component);
        // find the bell, make sure it has the unread indicator, and click to open the panel
        let bell = component.querySelector('.notifications-bell');
        assert.isNotNull(bell);
        assert.isTrue(bell.classList.contains('has-unread-notifications'));

        // Notifications header should have new notification count label
        Simulate.click(bell);

        // after clicking the bell, the panel should open
        let panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNotNull(panel);

        // Panel header should render new notifications label
        let newNotificationsLabel = component.querySelector('.new-notifications-label');
        assert.isNotNull(newNotificationsLabel);

        // there should be as many notifications as there are in our test data
        assert.lengthOf(panel.querySelectorAll('.notification-item'), fakeNotifications.notifications.length);
        assert.lengthOf(panel.querySelectorAll('.is-unread-notification'), 2);

        // find mark as read button, click to mark all the notificaitons as read
        let markAsReadButton = component.querySelector('.mark-all-as-read-button');
        assert.isNotNull(markAsReadButton);
        Simulate.click(markAsReadButton);

        // expect unread indicator for bell to not exist, disable the mark as read button, new notifications label not to exist
        assert.isFalse(bell.classList.contains('has-unread-notifications'));
        assert.isTrue(markAsReadButton.hasAttribute('disabled'));

        assert.isNull(component.querySelector('.new-notifications-label'));
        assert.lengthOf(panel.querySelectorAll('.notification-item'), fakeNotifications.notifications.length);
        assert.lengthOf(panel.querySelectorAll('.is-unread-notification'), 0);

        // find colse notifications button, expect panel to close after clicking close notificaiton button
        let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
        assert.isNotNull(closeNotificationPanelLink);

        // after clicking the close notifications panel link panel shold be closed
        Simulate.click(closeNotificationPanelLink);
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        done();
      });
    });

    it('should sill render notifications panel on empty product notifications fetch, and show no notificaitons message', (done) => {
      window.fetch.returns(Promise.resolve(
        mockResponse(fakeZeroNotifications, 200)
      ));

      const component = renderLocalizationElement(Notifications, { options });

      _.defer(() => {
        assert.isNotNull(component);

        // expect panel should be closed by default
        let panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        // find the bell, make sure it has the unread indicator, and click to open the panel
        let bell = component.querySelector('.notifications-bell');
        assert.isNotNull(bell);
        assert.isFalse(bell.classList.contains('has-unread-notifications'));
        Simulate.click(bell);

        // after clicking the bell, the list should exist
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNotNull(panel);

        // list should have no notificaions message
        let emptyNotificationMessage = component.querySelector('.no-notifications-message-wrapper');
        assert.isNotNull(emptyNotificationMessage);

        // find colse notifications button, expect panel to close after clicking close notificaiton button
        let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
        assert.isNotNull(closeNotificationPanelLink);

        // after clicking the close notifications panel link panel shold be closed
        Simulate.click(closeNotificationPanelLink);
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        done();
      });
    });

    it('should still render notifications panel on a failed fetch, and shows error message', (done) => {
      window.fetch.returns(Promise.resolve(
        mockResponse('Error', 500)
      ));

      const component = renderLocalizationElement(Notifications, { options });

      _.defer(() => {
        assert.isNotNull(component);

        // expect panel should be closed by default
        let panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        // find the bell, make sure it has the unread indicator, and click to open the panel
        let bell = component.querySelector('.notifications-bell');
        assert.isNotNull(bell);
        assert.isFalse(bell.classList.contains('has-unread-notifications'));
        Simulate.click(bell);

        // after clicking the bell, the list should exist
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNotNull(panel);

        // list should have error message
        let emptyNotificationMessage = component.querySelector('.notifications-error-message-wrapper');
        assert.isNotNull(emptyNotificationMessage);

        // find colse notifications button, expect panel to close after clicking close notificaiton button
        let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
        assert.isNotNull(closeNotificationPanelLink);

        // after clicking the close notifications panel link panel shold be closed
        Simulate.click(closeNotificationPanelLink);
        panel = component.querySelector('.notifications-panel-wrapper');
        assert.isNull(panel);

        done();
      });
    });
  });

  describe('User Notifications', () => {
    const stubUserAPI = sinon.stub();
    const options = {
      inProductTransientNotificationsEnabled: false,
      isSuperAdmin: false,
      showProductNotifications: false,
      showUserNotifications: true
    };

    beforeEach(() => {
      NotificationsAPI.__Rewire__('UserNotificationAPI', stubUserAPI);
    });

    afterEach(() => {
      NotificationsAPI.__ResetDependency__('UserNotificationAPI');
    });

    const userid = 'tugg-ikce';

    it('should open notifications panel, show unread indicator, list all user notifications and close the panel when clicked on "X" link', () => {
      const component = renderLocalizationElement(Notifications, _.merge({}, { options }, { userid }));
      const userNotifications = {
        activity: {
          notifications: [
            {
              userProfileLink: 'foo', userName: 'bill', activityUniqueKey: 'x', type: 'activity',
              createdAt: '2017-12-06T05:00:43.019Z', activityType: 'type', read: false, id: 1, messageBody: 'asd'
            },
            {
              userProfileLink: 'foo', userName: 'bill', activityUniqueKey: 'y', type: 'activity',
              createdAt: '2017-12-06T05:00:43.019Z', activityType: 'type', read: false, id: 2, messageBody: 'def'
            }
          ],
          hasMoreNotifications: false,
          loading: false,
          total: 2,
          offset: 5,
          unread: 2
        },
        alert: {
          notifications: [
            {
              userProfileLink: 'foo', userName: 'bill', activityUniqueKey: 'x', type: 'alert',
              createdAt: '2017-12-06T05:00:43.019Z', activityType: 'type', read: false, id: 1, messageBody: 'asd'
            },
            {
              userProfileLink: 'foo', userName: 'bill', activityUniqueKey: 'y', type: 'alert',
              createdAt: '2017-12-06T05:00:43.019Z', activityType: 'type', read: false, id: 2, messageBody: 'def'
            }
          ],
          hasMoreNotifications: false,
          loading: false,
          total: 2,
          offset: 5,
          unread: 2
        }
      };

      stubUserAPI.args[0][1](userNotifications, []);
      assert.isNotNull(component);

      // expect panel should be closed by default
      let panel = component.querySelector('.notifications-panel-wrapper');
      assert.isNull(panel);

      // find the bell, make sure it has the unread indicator, and click to open the panel
      let bell = component.querySelector('.notifications-bell');
      assert.isNotNull(bell);
      assert.isTrue(bell.classList.contains('has-unread-notifications'));

      // Notifications header should have new notification count label
      Simulate.click(bell);

      // after clicking the bell, the panel should open
      panel = component.querySelector('.notifications-panel-wrapper');
      assert.isNotNull(panel);

      // there should be as many notifications as there are in our test data
      assert.lengthOf(panel.querySelectorAll('.user-notification-item'), userNotifications.alert.notifications.length);

      let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
      assert.isNotNull(closeNotificationPanelLink);

      // after clicking the close notifications panel link panel shold be closed
      Simulate.click(closeNotificationPanelLink);
      panel = component.querySelector('.notifications-panel-wrapper');
      assert.isNull(panel);

    });
  });
});

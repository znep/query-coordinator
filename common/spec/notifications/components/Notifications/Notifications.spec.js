import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { mockResponse } from '../../helpers';
import { fakeNotifications, fakeZeroNotifications, fakeUserNotifications } from '../../data';
import renderLocalizationElement from '../../renderLocalizationComponent';
import Notifications from 'common/notifications/components/Notifications/Notifications';
import 'intl/locale-data/jsonp/en.js';

describe('Product Notifications', () => {
  const options = {
    inProductTransientNotificationsEnabled: true,
    isSuperAdmin: false,
    lockScrollbar: false,
    scrollTop: 0,
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
      expect(component).to.exist;

      // expect panel should be closed by default
      let panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      // find the bell, make sure it has the unread indicator, and click to open the panel
      let bell = component.querySelector('.notifications-bell');
      expect(bell).to.exist;
      expect(bell).to.have.class('has-unread-notifications');

      // Notifications header should have new notification count label
      Simulate.click(bell);

      // after clicking the bell, the panel should open
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.exist;

      // there should be as many notifications as there are in our test data
      expect(panel.querySelectorAll('.notification-item').length).to.eq(fakeNotifications.notifications.length);

      // find colse notifications button, expect panel to close after clicking close notificaiton button
      let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
      expect(closeNotificationPanelLink).to.exist;

      // after clicking the close notifications panel link panel shold be closed
      Simulate.click(closeNotificationPanelLink);
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      done();
    });
  });

  it('should open notifications panel, check for unread product notifications, show "N New" label, and mark all the product notifications as read when clicked on "Mark As Read" button and hide "N New" label', (done) => {
    window.fetch.returns(Promise.resolve(
      mockResponse(fakeNotifications, 200)
    ));

    const component = renderLocalizationElement(Notifications, { options });

    _.defer(() => {
      expect(component).to.exist;
      // find the bell, make sure it has the unread indicator, and click to open the panel
      let bell = component.querySelector('.notifications-bell');
      expect(bell).to.exist;
      expect(bell).to.have.class('has-unread-notifications');

      // Notifications header should have new notification count label
      Simulate.click(bell);

      // after clicking the bell, the panel should open
      let panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.exist;

      // Panel header should render new notifications label
      let newNotificationsLabel = component.querySelector('.new-notifications-label');
      expect(newNotificationsLabel).to.exist;

      // there should be as many notifications as there are in our test data
      expect(panel.querySelectorAll('.notification-item').length).to.eq(fakeNotifications.notifications.length);
      expect(panel.querySelectorAll('.is-unread-notification').length).to.eq(2);

      // find mark as read button, click to mark all the notificaitons as read
      let markAsReadButton = component.querySelector('.mark-all-as-read-button');
      expect(markAsReadButton).to.exist;
      Simulate.click(markAsReadButton);

      // expect unread indicator for bell to not exist, disable the mark as read button, new notifications label not to exist
      expect(bell).to.not.have.class('has-unread-notifications');
      expect(markAsReadButton).to.have.attr('disabled');

      expect(component.querySelector('.new-notifications-label')).not.to.exist;
      expect(panel.querySelectorAll('.notification-item').length).to.eq(fakeNotifications.notifications.length);
      expect(panel.querySelectorAll('.is-unread-notification').length).to.eq(0);

      // find colse notifications button, expect panel to close after clicking close notificaiton button
      let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
      expect(closeNotificationPanelLink).to.exist;

      // after clicking the close notifications panel link panel shold be closed
      Simulate.click(closeNotificationPanelLink);
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      done();
    });
  });

  it('should sill render notifications panel on empty product notifications fetch, and show no notificaitons message', (done) => {
    window.fetch.returns(Promise.resolve(
      mockResponse(fakeZeroNotifications, 200)
    ));

    const component = renderLocalizationElement(Notifications, { options });

    _.defer(() => {
      expect(component).to.exist;

      // expect panel should be closed by default
      let panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      // find the bell, make sure it has the unread indicator, and click to open the panel
      let bell = component.querySelector('.notifications-bell');
      expect(bell).to.exist;
      expect(bell).to.not.have.class('has-unread-notifications');
      Simulate.click(bell);

      // after clicking the bell, the list should exist
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.exist;

      // list should have no notificaions message
      let emptyNotificationMessage = component.querySelector('.no-notifications-message-wrapper');
      expect(emptyNotificationMessage).to.exist;

      // find colse notifications button, expect panel to close after clicking close notificaiton button
      let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
      expect(closeNotificationPanelLink).to.exist;

      // after clicking the close notifications panel link panel shold be closed
      Simulate.click(closeNotificationPanelLink);
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      done();
    });
  });

  it('should still render notifications panel on a failed fetch, and shows error message', (done) => {
    window.fetch.returns(Promise.resolve(
      mockResponse('Error', 500)
    ));

    const component = renderLocalizationElement(Notifications, { options });

    _.defer(() => {
      expect(component).to.exist;

      // expect panel should be closed by default
      let panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      // find the bell, make sure it has the unread indicator, and click to open the panel
      let bell = component.querySelector('.notifications-bell');
      expect(bell).to.exist;
      expect(bell).to.not.have.class('has-unread-notifications');
      Simulate.click(bell);

      // after clicking the bell, the list should exist
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.exist;

      // list should have error message
      let emptyNotificationMessage = component.querySelector('.notifications-error-message-wrapper');
      expect(emptyNotificationMessage).to.exist;

      // find colse notifications button, expect panel to close after clicking close notificaiton button
      let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
      expect(closeNotificationPanelLink).to.exist;

      // after clicking the close notifications panel link panel shold be closed
      Simulate.click(closeNotificationPanelLink);
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      done();
    });
  });
});

describe('User Notifications', () => {
  const options = {
    lockScrollbar: false,
    scrollTop: 0,
    showProductNotifications: false,
    showUserNotifications: true,
    inProductTransientNotificationsEnabled: true
  };

  const userid = 'tugg-ikce';

  beforeEach(() => {
    sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    window.fetch.restore();
  });

  it('should open notifications panel, show unread indicator, list all user notifications and close the panel when clicked on "X" link', (done) => {
    window.fetch.returns(Promise.resolve(
      mockResponse(fakeUserNotifications, 200)
    ));

    const component = renderLocalizationElement(Notifications, _.merge({}, { options }, { userid }));

    _.defer(() => {
      expect(component).to.exist;

      // expect panel should be closed by default
      let panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      // find the bell, make sure it has the unread indicator, and click to open the panel
      let bell = component.querySelector('.notifications-bell');
      expect(bell).to.exist;
      expect(bell).to.have.class('has-unread-notifications');

      // Notifications header should have new notification count label
      Simulate.click(bell);

      // after clicking the bell, the panel should open
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.exist;

      // there should be as many notifications as there are in our test data
      expect(panel.querySelectorAll('.user-notification-item').length).to.eq(fakeUserNotifications.data.length);

      let closeNotificationPanelLink = component.querySelector('.close-notifications-panel-link');
      expect(closeNotificationPanelLink).to.exist;

      // after clicking the close notifications panel link panel shold be closed
      Simulate.click(closeNotificationPanelLink);
      panel = component.querySelector('.notifications-panel-wrapper');
      expect(panel).to.not.exist;

      done();
    });
  });
});

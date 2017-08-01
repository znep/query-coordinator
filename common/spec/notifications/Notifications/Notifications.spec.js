import { Simulate } from 'react-addons-test-utils';
import Notifications from 'common/notifications/Notifications';
import { renderComponent } from '../helpers';
import { fakeNotifications } from './data';

const translations = {
  errorText: 'error text',
  productUpdatesText: 'product updates',
  viewOlderText: 'view older'
};

// Disabled, see EN-17895
xdescribe('Notifications', () => {
  let server;

  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
    server.respondImmediately = true;
  });

  afterEach(() => {
    server.restore();
  });

  it('opens, hides, and marks all notifications as read', () => {
    server.respondWith('GET', '/notifications', [ 200, { 'Content-Type': 'application/json' }, JSON.stringify(fakeNotifications)]);

    const element = renderComponent(Notifications, { translations });

    // delay here so that the future resolves
    _.delay(() => {
      expect(element).to.exist;

      // list shouldn't exist yet
      let list = element.querySelector('.socrata-notifications-list');
      expect(list).to.not.exist;

      // find the bell, make sure it has the unread icon, and click it
      const bell = element.querySelector('.socrata-notifications-bell');
      expect(bell).to.exist;
      expect(bell.querySelector('.socrata-notifications-unread-icon')).to.exist;
      Simulate.click(bell);

      // after clicking the bell, the list should exist
      list = element.querySelector('.socrata-notifications-list');
      expect(list).to.exist;

      // there should be as many notifications as there are in our test data
      expect(list.querySelectorAll('.socrata-notification').length).to.eq(fakeNotifications.notifications.length);
      expect(list.querySelectorAll('.socrata-notifications-unread-indicator').length).to.eq(2);

      // clicking the bell hides the list and sets everything to read
      Simulate.click(bell);
      list = element.querySelector('.socrata-notifications-list');
      expect(list).to.not.exist;
      expect(bell.querySelector('.socrata-notifications-unread-icon')).to.not.exist;

      // clicking the bell _again_ shows the list again, but everything should be read
      Simulate.click(bell);
      list = element.querySelector('.socrata-notifications-list');
      expect(list).to.exist;
      expect(list.querySelectorAll('.socrata-notification').length).to.eq(fakeNotifications.notifications.length);
      expect(list.querySelectorAll('.socrata-notifications-unread-indicator').length).to.eq(0);
    }, 1000);
  });

  it('still renders list on failed fetch, but shows error message', () => {
    server.respondWith('GET', '/notifications', [ 500, { }, 'Error']);

    const element = renderComponent(Notifications, { translations });

    _.delay(() => {
      expect(element).to.exist;

      // list shouldn't exist yet
      let list = element.querySelector('.socrata-notifications-list');
      expect(list).to.not.exist;

      // find the bell, make sure it DOESN'T have the unread icon, and click it
      const bell = element.querySelector('.socrata-notifications-bell');
      expect(bell).to.exist;
      expect(bell.querySelector('.socrata-notifications-unread-icon')).to.not.exist;
      Simulate.click(bell);

      // after clicking the bell, the list should exist
      list = element.querySelector('.socrata-notifications-list');
      expect(list).to.exist;

      // list should have error message
      expect(list.querySelector('.socrata-notifications-error-message')).to.exist;

      // clicking the bell hides the list again
      Simulate.click(bell);
      list = element.querySelector('.socrata-notifications-list');
      expect(list).to.not.exist;
    }, 1000);
  });
});

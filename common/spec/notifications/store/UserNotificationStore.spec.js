import _ from 'lodash';

import UserNotificationStore from 'common/notifications/store/UserNotificationStore';
import { mockResponse } from '../helpers';
import { fakeUserNotifications } from '../data';

let notificationStub = null;
let userNotificationStore = null;
const userid = 'tugg-ikce';

describe('User Notification Store', () => {
  beforeEach(() => {
    notificationStub = sinon.stub(
      window,
      'fetch',
      _.constant(Promise.resolve(mockResponse(fakeUserNotifications, 200)))
    );
  });

  afterEach(() => {
    notificationStub.restore();
  });

  it('should hit get notifications api on new user notifications mount', () => {
    userNotificationStore = new UserNotificationStore(userid);
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications'
    );
  });

  it('should hit delete notification api as a DELETE method', () => {
    userNotificationStore.deleteNotification('100');
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications/100'
    );
    assert.equal(request.method, 'DELETE');
  });

  it('should hit delete all notifications api as a DELETE method', () => {
    userNotificationStore.deleteAllNotifications();
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications'
    );
    assert.equal(request.method, 'DELETE');
  });

  it('should hit mark as read notifications api as a PUT method', () => {
    userNotificationStore.markNotificationAsRead(100);
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];
    const requestParams = JSON.parse(request.body);

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications/100'
    );
    assert.equal(request.method, 'PUT');
    assert.equal(requestParams.notification.read, true);
  });

  it('should hit mark as unread notifications api as a PUT method', () => {
    userNotificationStore.markNotificationAsUnRead(100);
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];
    const requestParams = JSON.parse(request.body);

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications/100'
    );
    assert.equal(request.method, 'PUT');
    assert.equal(requestParams.notification.read, false);
  });
});

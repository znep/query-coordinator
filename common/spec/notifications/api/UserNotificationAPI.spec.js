import _ from 'lodash';

import UserNotificationAPI from 'common/notifications/api/UserNotificationAPI';
import { mockResponse } from '../helpers';
import { fakeUserNotifications } from '../data';

let notificationStub = null;
let userNotificationAPI = null;
const userId = 'tugg-ikce';

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
    userNotificationAPI = new UserNotificationAPI(userId);
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications'
    );
  });

  it('should hit delete notification api as a DELETE method', () => {
    userNotificationAPI.deleteNotification('100');
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications/100'
    );
    assert.equal(request.method, 'DELETE');
  });

  it('should hit delete all notifications api as a DELETE method', () => {
    userNotificationAPI.deleteAllNotifications();
    sinon.assert.calledOnce(notificationStub);

    const request = window.fetch.args[0][1];

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/notifications'
    );
    assert.equal(request.method, 'DELETE');
  });

  it('should hit mark as read notifications api as a PUT method', () => {
    userNotificationAPI.markNotificationAsRead(100);
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
    userNotificationAPI.markNotificationAsUnRead(100);
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

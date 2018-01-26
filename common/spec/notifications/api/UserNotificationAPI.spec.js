import _ from 'lodash';
import $ from 'jquery';

import UserNotificationAPI from 'common/notifications/api/UserNotificationAPI';
import { mockResponse } from '../helpers';
import { fakeUserNotifications } from '../data';
import { NOTIFICATIONS_PER_PAGE } from 'common/notifications/constants';

let notificationStub = null;
let userNotificationAPI = null;
const userId = 'tugg-ikce';
let offset = 0;

describe('User Notification API', () => {
  beforeEach(() => {
    notificationStub = sinon.stub(window, 'fetch').
      returns(Promise.resolve(mockResponse(fakeUserNotifications, 200)));
  });

  afterEach(() => {
    notificationStub.restore();
  });

  it('should hit get socket token api on new user notifications mount', () => {
    // TODO: Do this in a before.
    userNotificationAPI = new UserNotificationAPI(userId, null, { debugLog: false });
    sinon.assert.calledOnce(notificationStub);

    assert.equal(
      window.fetch.args[0][0],
      '/api/notifications_and_alerts/socket_token'
    );
  });

  it('should hit get notifications api after getting user socket token', async () => {
    userNotificationAPI = new UserNotificationAPI(userId, null, { debugLog: false });
    let socketTokenStub = sinon.stub(userNotificationAPI, '_getSocketToken');

    socketTokenStub.callsFake(async() => {
      return { token: 'NzU4OTdhMmUtNDNlZS00ODE5LWJkZTgtNTg0YWM3NDI5ODQ3' };
    });

    userNotificationAPI._getSocketToken().then(() => {
      userNotificationAPI._loadNotifications();
      sinon.assert.calledTwice(notificationStub);

      const params = { limit: NOTIFICATIONS_PER_PAGE, offset };
      const queryString = $.param(params);
      assert.equal(
        window.fetch.args[1][0],
        `/api/notifications_and_alerts/notifications?${queryString}`
      );
    });
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

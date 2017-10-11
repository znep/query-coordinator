import 'whatwg-fetch';
import { Socket } from 'phoenix';
import _ from 'lodash';

import { STATUS_ACTIVITY_TYPES } from 'common/notifications/constants';

class NotificationAPI {
  constructor(userId, callback) {
    if (!userId) {
      console.error('NotificationAPI called without user id');
      return;
    }

    let channelId = `user: ${userId}`;
    let socket = new Socket(`wss://${window.location.host}/api/notifications_and_alerts/socket`, {
      params: {user_id: userId},
      logger: ((kind, msg, data) => { console.log(`${kind}: ${msg}`, data) })
    });

    socket.connect();

    this._channel = socket.channel(channelId, {});

    let self = this;
    this._getExistingNotifications().then(function(response) {
      self._notifications = self._transformNotifications(_.get(response, 'data', []));
      self.update();
      self._channel.join().
        receive('ok', (resp) => {
          console.log('Joined user channel');
        }).
        receive('error', (resp) => {
          console.log('Unable to join', resp);
        });
    }, function() {});

    this._channel.on('new_notification', (msg) => this._onNewNotification(msg.notification));
    this._channel.on('delete_notification', (msg) => this._onNotificationDelete(msg.notification_id));
    this._channel.on('delete_all_notifications', (msg) => this._onDeleteAllNotifications(msg.notification_id));
    this._channel.on('mark_notification_as_read', (msg) => this._onNotificationMarkedAsRead(msg.notification_id));
    this._channel.on('mark_notification_as_unread', (msg) => this._onNotificationMarkedAsUnRead(msg.notification_id));
    this._callback = callback;
  }

  _getExistingNotifications() {
    return fetch('/api/notifications_and_alerts/notifications', { credentials: 'same-origin' })
      .then((response) => response.json());
  };

  _onNewNotification(notification) {
    this._notifications.unshift(this._transformNotification(notification));
    this.update();
  }

  _onNotificationDelete(notificationId) {
    let index = this._notifications.findIndex((n) => n.id === notificationId);
    this._notifications.splice(index, 1);
    this.update();
  }

  _onDeleteAllNotifications() {
    this._notifications = [];
    this.update();
  }

  _onNotificationMarkedAsRead(notificationId) {
    let index = this._notifications.findIndex((n) => n.id === notificationId);
    this._notifications[index].read = true;
    this.update();
  }

  _onNotificationMarkedAsUnRead(notificationId) {
    let index = this._notifications.findIndex((n) => n.id === notificationId);
    this._notifications[index].read = false;
    this.update();
  }

  deleteNotification(notificationId) {
    fetch(`/api/notifications_and_alerts/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
  }

  deleteAllNotifications() {
    fetch('/api/notifications_and_alerts/notifications', {
      method: 'DELETE',
      credentials: 'same-origin'
    });
  }

  markNotificationAsRead(notificationId) {
    this.toggleNotificationReadState(notificationId, true);
  }

  markNotificationAsUnRead(notificationId) {
    this.toggleNotificationReadState(notificationId, false);
  }

  toggleNotificationReadState(notificationId, toggle) {
    fetch(`/api/notifications_and_alerts/notifications/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        'notification': {
          'read': toggle
        }
      })
    });
  }

  _convertToUrlComponent(text) {
    let output = text.
      replace(/\s+/g, '-').
      replace(/[^a-zA-Z0-9_\-]/g, '-').
      replace(/\-+/g, '-');

    if (output.length < 1) {
      output = '-';
    }

    return output.slice(0, 50);
  }

  _getUserProfileLink(domainCname, userName, userId) {
    if(_.isEmpty(domainCname) || _.isEmpty(userName) || _.isEmpty(userId)) {
      return null;
    }

    return `//${domainCname}/profile/${this._convertToUrlComponent(userName)}/${userId}`;
  }

  _getDatasetLink(domainCname, name, uId) {
    if(_.isEmpty(domainCname) || _.isEmpty(name) || _.isEmpty(uId)) {
      return null;
    }

    return `//${domainCname}/dataset/${this._convertToUrlComponent(name)}/${uId}`;
  }

  _transformNotification(notification) {
    const transformedNotification = {};
    const userActivityTypes = ['UserAdded', 'UserRemoved', 'UserRoleChanged'];
    const activityType = _.get(notification, 'activity.activity_type', '');
    const domainCname = _.get(notification, 'activity.domain_cname', '');
    const userName = _.get(notification, 'activity.acting_user_name', '');
    const userId = _.get(notification, 'activity.acting_user_id', '');

    transformedNotification.id = _.get(notification, 'id', '');
    transformedNotification.read = _.get(notification, 'read', false);
    transformedNotification.activityType = activityType;
    transformedNotification.createdAt = _.get(notification, 'activity.created_at', '');
    transformedNotification.type = _.includes(STATUS_ACTIVITY_TYPES, activityType) ? 'status': 'alert';
    transformedNotification.title = _.startCase(activityType);

    transformedNotification.userName = userName;
    transformedNotification.userProfileLink = this._getUserProfileLink(domainCname, userName, userId);

    if (activityType === 'ViewMetadataChanged') {
      const viewId = _.get(notification, 'activity.view_uid', '');
      const viewName = _.get(notification, 'activity.view_name', '');

      transformedNotification.link = this._getDatasetLink(domainCname, viewName, viewId);
      transformedNotification.messageBody = viewName;
    } else if (_.includes(userActivityTypes, activityType)) {
      transformedNotification.link = null;
      transformedNotification.messageBody = _.get(
        JSON.parse(_.get(notification, 'activity.details', '')),
        'summary',
        ''
      );
    } else {
      const datasetId = _.get(notification, 'activity.dataset_uid', '');
      const datasetName = _.get(notification, 'activity.dataset_name', '');

      transformedNotification.link = this._getDatasetLink(domainCname, datasetName, datasetId);
      transformedNotification.messageBody = datasetName;
    }

    return transformedNotification;
  }

  _transformNotifications(notifications) {
    if (_.isEmpty(notifications)) {
      return notifications;
    }
    const transformedNotifications = [];

    _.each(notifications, (notification) => {
      transformedNotifications.push(this._transformNotification(notification));
    });

    return transformedNotifications;
  }

  update() {
    if (this._callback) {
      this._callback(this._notifications);
    }
  }
}

export default NotificationAPI;

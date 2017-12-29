import 'whatwg-fetch';
import { Socket } from 'phoenix';
import _ from 'lodash';
import $ from 'jquery';

import { STATUS_ACTIVITY_TYPES, NOTIFICATIONS_PER_PAGE } from 'common/notifications/constants';

class NotificationAPI {
  constructor(userId, callback, options = {}) {
    // TODO: This should probably default to false. Question is out to team.
    const useLogger = _.get(options, 'debugLog', true);

    if (!userId) {
      console.error('NotificationAPI called without user id');
      return;
    }

    let channelId = `user: ${userId}`;
    const socketOptions = { params: { user_id: userId } };
    if (useLogger) {
      socketOptions.logger = (kind, msg, data) => { console.info(kind, msg, data); };
    }
    let socket = new Socket(`wss://${window.location.host}/api/notifications_and_alerts/socket`, socketOptions);
    if (_.get(options, 'developmentMode') && !this._hasEverJoined) {
      socket.onError(() => {
        console.warn('User Notifications: Error connecting, disabling connection in development mode.');
        socket.disconnect();
      });
    }

    socket.connect();

    this._channel = socket.channel(channelId, {});

    let self = this;
    self._offset = 0;
    self._totalNotificationsCount = 0;
    self._enqueuedNotifications = [];
    this._loadNotifications(self._offset).then(function(response) {
      self._notifications = self._transformNotifications(_.get(response, 'data', []));
      self._totalNotificationsCount = _.get(response, 'count.total', 0);
      self._unreadNotificationsCount = _.get(response, 'count.unread', 0);
      self._offset += _.size(self._notifications);
      self.update();
      self._channel.join().
        receive('ok', (resp) => {
          self._hasEverJoined = true;
          if (useLogger) {
            console.info('Joined user channel');
          }
        }).
        receive('error', (resp) => {
          if (useLogger) {
            console.info('Unable to join', resp);
          }
        });
    }, function() {});

    this._channel.on('new_notification', (msg) => this._onNewNotification(msg.notification));
    this._channel.on('delete_notification', (msg) => this._onNotificationDelete(msg.notification_id));
    this._channel.on('delete_all_notifications', (msg) => this._onDeleteAllNotifications(msg.notification_id));
    this._channel.on('mark_notification_as_read', (msg) => this._onNotificationMarkedAsRead(msg.notification_id));
    this._channel.on('mark_notification_as_unread', (msg) => this._onNotificationMarkedAsUnRead(msg.notification_id));
    this._callback = callback;
  }

  _loadNotifications(offset) {
    const params = { limit: NOTIFICATIONS_PER_PAGE, offset };
    const queryString = $.param(params);

    return fetch(`/api/notifications_and_alerts/notifications?${queryString}`, {
      credentials: 'same-origin'
    })
    .then((response) => response.json());
  }

  _onNewNotification(notification) {
    this._enqueuedNotifications.unshift(this._transformNotification(notification));
    this._totalNotificationsCount++;
    this._unreadNotificationsCount++;
    this._offset++;
    this.update();
  }

  _onNotificationDelete(notificationId) {
    const notificationIndex = this._notifications.findIndex((n) => n.id === notificationId);

    if (notificationIndex !== -1) {
      if (this._notifications[notificationIndex].read === false) {
        this._unreadNotificationsCount--;
      }

      this._notifications.splice(notificationIndex, 1);
    } else {
      const enqueuedNotificationIndex = this._enqueuedNotifications.findIndex((n) => n.id === notificationId);

      if (this._enqueuedNotifications[enqueuedNotificationIndex].read === false) {
        this._unreadNotificationsCount--;
      }

      this._enqueuedNotifications.splice(enqueuedNotificationIndex, 1);
    }

    this._totalNotificationsCount--;
    this._offset--;
    this.update();
  }

  _onDeleteAllNotifications() {
    this._notifications = [];
    this._enqueuedNotifications = [];
    this._totalNotificationsCount = 0;
    this._unreadNotificationsCount = 0;
    this._offset = 0;
    this.update();
  }

  _onNotificationMarkedAsRead(notificationId) {
    const notificationIndex = this._notifications.findIndex((n) => n.id === notificationId);

    if (notificationIndex !== -1) {
      this._notifications[notificationIndex].read = true;
    } else {
      const enqueuedNotificationIndex = this._enqueuedNotifications.findIndex((n) => n.id === notificationId);
      this._enqueuedNotifications[enqueuedNotificationIndex].read = true;
    }

    this._unreadNotificationsCount--;
    this.update();
  }

  _onNotificationMarkedAsUnRead(notificationId) {
    const notificationIndex = this._notifications.findIndex((n) => n.id === notificationId);

    if (notificationIndex !== -1) {
      this._notifications[notificationIndex].read = false;
    } else {
      const enqueuedNotificationIndex = this._enqueuedNotifications.findIndex((n) => n.id === notificationId);
      this._enqueuedNotifications[enqueuedNotificationIndex].read = false;
    }

    this._unreadNotificationsCount++;
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

  loadMoreNotifications() {
    let self = this;
    this._loadNotifications(self._offset).then(function(response) {
      const newNotifications = self._transformNotifications(_.get(response, 'data', []));
      self._offset += _.size(newNotifications);
      self._totalNotificationsCount = _.get(response, 'count.total', 0);
      self._unreadNotificationsCount = _.get(response, 'count.unread', 0);
      self._notifications = _.union(self._notifications, newNotifications);

      self.update();
    }, function() {});
  }

  seeNewNotifications() {
    this._notifications = this._enqueuedNotifications.concat(this._notifications);
    this._enqueuedNotifications = [];
    this.update();
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
    if (_.isEmpty(domainCname) || _.isEmpty(userName) || _.isEmpty(userId)) {
      return null;
    }

    return `//${domainCname}/profile/${this._convertToUrlComponent(userName)}/${userId}`;
  }

  _getDatasetLink(domainCname, name, uId) {
    if (_.isEmpty(domainCname) || _.isEmpty(name) || _.isEmpty(uId)) {
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
    const notificationType = _.includes(STATUS_ACTIVITY_TYPES, activityType) ? 'status' : 'alert';

    transformedNotification.id = _.get(notification, 'id', '');
    transformedNotification.read = _.get(notification, 'read', false);
    transformedNotification.activityType = activityType;
    transformedNotification.createdAt = _.get(notification, 'activity.created_at', '');
    transformedNotification.type = notificationType;
    transformedNotification.activityUniqueKey = _.get(notification, 'activity_unique_key', '');
    transformedNotification.userName = userName;
    transformedNotification.userProfileLink = this._getUserProfileLink(domainCname, userName, userId);

    if (notificationType === 'alert') {
      const domainName = _.get(notification, 'alert.domain', '');
      const datasetId = _.get(notification, 'alert.dataset_uid', '');
      const datasetName = _.get(notification, 'alert.dataset_name', '');
      transformedNotification.alertName = _.get(notification, 'alert.name', '');

      transformedNotification.messageBody = datasetName;
      transformedNotification.link = this._getDatasetLink(domainName, datasetName, datasetId);
      transformedNotification.createdAt = _.get(notification, 'alert_triggered_at', '');
    } else {
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
      const hasMoreNotifications = this._offset < this._totalNotificationsCount;
      this._callback(this._notifications, this._enqueuedNotifications, hasMoreNotifications, this._unreadNotificationsCount);
    }
  }
}

export default NotificationAPI;

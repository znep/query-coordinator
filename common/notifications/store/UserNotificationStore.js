import 'whatwg-fetch';
import { Socket } from 'phoenix';
import _ from 'lodash';

import { STATUS_ACTIVITY_TYPES } from 'common/notifications/constants';

class NotificationStore {
  constructor(user_id, callback) {
    if (!user_id) {
      console.error("NotificationStore called without user id");
      return;
    }

    let channel_id = "user:" + user_id;
    let socket = new Socket("wss://" + window.location.host + "/api/notifications_and_alerts/socket", {
      params: {user_id: user_id},
      logger: ((kind, msg, data) => { console.log(`${kind}: ${msg}`, data) })
    });

    socket.connect();

    this._channel = socket.channel(channel_id, {});

    let that = this;
    this._getExistingNotifications().then(function(response) {
      that._notifications = that._transformNotifications(_.get(response, 'data', []));
      that.update();
      that._channel.join().
        receive('ok', (resp) => {
          console.log("Joined user channel");
        }).
        receive("error", resp => {
          console.log("Unable to join", resp);
        });
    }, function() {});

    this._channel.on("new_notification", msg => this._onNewNotification(msg.notification));
    this._channel.on("delete_notification", msg => this._onNotificationDelete(msg.notification_id));
    this._channel.on("delete_all_notifications", msg => this._onDeleteAllNotifications(msg.notification_id));
    this._channel.on("mark_notification_as_read", msg => this._onNotificationMarkedAsRead(msg.notification_id));
    this._channel.on("mark_notification_as_unread", msg => this._onNotificationMarkedAsUnRead(msg.notification_id));
    this._callback = callback;
  }

  _getExistingNotifications() {
    return fetch("/api/notifications_and_alerts/notifications", { credentials: 'same-origin' })
      .then(response => response.json());
  };

  _onNewNotification(notification) {
    this._notifications.unshift(this._transformNotification(notification));
    this.update();
  }

  _onNotificationDelete(notificationId) {
    let index = this._notifications.findIndex(n => n.id === notificationId);
    this._notifications.splice(index, 1);
    this.update();
  }

  _onDeleteAllNotifications() {
    this._notifications = [];
    this.update();
  }

  _onNotificationMarkedAsRead(notificationId) {
    let index = this._notifications.findIndex(n => n.id === notificationId);
    this._notifications[index].read = true;
    this.update();
  }

  _onNotificationMarkedAsUnRead(notificationId) {
    let index = this._notifications.findIndex(n => n.id === notificationId);
    this._notifications[index].read = false;
    this.update();
  }

  deleteNotification(notification_id) {
    fetch(`/api/notifications_and_alerts/notifications/${notification_id}`, {
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

  markNotificationAsRead(notification_id) {
    this.toggleNotificationReadState(notification_id, true);
  }

  markNotificationAsUnRead(notification_id) {
    this.toggleNotificationReadState(notification_id, false);
  }

  toggleNotificationReadState(notification_id, toggle) {
    fetch(`/api/notifications_and_alerts/notifications/${notification_id}`, {
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

  _getUserProfileLink(domain_cname, user_name, user_id) {
    if(_.isEmpty(domain_cname) || _.isEmpty(user_name) || _.isEmpty(user_id)) {
      return null;
    } else {
      return '//' + domain_cname + '/profile/' + this._convertToUrlComponent(user_name) + '/' + user_id;
    }
  }

  _getDatasetLink(domain_cname, name, uid) {
    if(_.isEmpty(domain_cname) || _.isEmpty(name) || _.isEmpty(uid)) {
      return null;
    } else {
      return '//' + domain_cname + '/dataset/' + this._convertToUrlComponent(name) + '/' + uid;
    }
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
    transformedNotification.activity_type = activityType;
    transformedNotification.created_at = _.get(notification, 'activity.created_at', '');
    transformedNotification.type = _.includes(STATUS_ACTIVITY_TYPES, activityType) ? 'status': 'alert';
    transformedNotification.title = _.startCase(activityType);

    transformedNotification.user_name = userName;
    transformedNotification.user_profile_link = this._getUserProfileLink(domainCname, userName, userId);

    if (activityType === 'ViewMetadataChanged') {
      const viewId = _.get(notification, 'activity.view_uid', '');
      const viewName = _.get(notification, 'activity.view_name', '');

      transformedNotification.link = this._getDatasetLink(domainCname, viewName, viewId);
      transformedNotification.message_body = viewName;
    } else if (_.includes(userActivityTypes, activityType)) {
      transformedNotification.link = null;
      transformedNotification.message_body = _.get(
        JSON.parse(_.get(notification, 'activity.details', '')),
        'summary',
        ''
      );
    } else {
      const datasetId = _.get(notification, 'activity.dataset_uid', '');
      const datasetName = _.get(notification, 'activity.dataset_name', '');

      transformedNotification.link = this._getDatasetLink(domainCname, datasetName, datasetId);
      transformedNotification.message_body = datasetName;
    }

    return transformedNotification;
  }

  _transformNotifications(notifications) {
    if (_.isEmpty(notifications)) {
      return notifications;
    } else {
      const transformedNotifications = [];

      _.each(notifications, (notification) => {
        transformedNotifications.push(this._transformNotification(notification));
      });

      return transformedNotifications;
    }
  }

  update() {
    if (this._callback) {
      this._callback(this._notifications);
    }
  }
}

export default NotificationStore;

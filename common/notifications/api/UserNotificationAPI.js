import _ from 'lodash';
import $ from 'jquery';
import { Socket } from 'phoenix';
import utils from 'common/js_utils';
import 'whatwg-fetch';

import { NOTIFICATIONS_PER_PAGE, VIEW_METADATA_CHANGED } from 'common/notifications/constants';
import { checkStatus } from 'common/notifications/api/helper';

/**
 * NotificationAPI is event mediator that opens socket connection and
 * listens to all asynchronous notification channel live events and
 * updates the data to keep it in sync with all the active sessions
 *
 * It connect notification actions with notifications_and_alerts api services,
 * to handles delete, clear all, mark as read, mark as unread actions on notifications, and
 * to fetch new notifications
 */
class NotificationAPI {
  constructor(userId, callback, options = {}) {
    _.defaults(options, {
      debugLog: true,
      loadAlerts: false
    });

    if (!userId) {
      console.error('NotificationAPI called without user id');

      return;
    }

    let channelId = `user: ${userId}`;

    this.getSocketToken().then((response) => {
      this.useLogger = options.debugLog;
      const socketOptions = { params: { user_id: userId, token: response.token } };

      socketOptions.logger = this.logDebugInfo;

      let socket = new Socket(`wss://${window.location.host}/api/notifications_and_alerts/socket`, socketOptions);

      if (_.get(options, 'developmentMode') && !this._hasEverJoined) {
        socket.onError(() => {
          console.warn('User Notifications: Error connecting, disabling connection in development mode.');
          socket.disconnect();
        });
      }

      socket.connect();

      this.channel = socket.channel(channelId, {});
      this.enqueuedNotifications = [];
      this.userNotifications = { activity: this.setNotificationObject() };

      if (options.loadAlerts) {
        this.userNotifications.alert = this.setNotificationObject();
      }

      _.each(this.userNotifications, (userNotificationObject, type) => {
        this.loadNotifications(type, userNotificationObject.offset);
      });

      this.channel.join().receive('ok', (resp) => {
        this._hasEverJoined = true;
        this.logDebugInfo('Joined user channel');
      }).receive('error', (resp) => {
        this.logDebugInfo('Unable to join', resp);
      });

      this.channel.on('new_notification', this.onNewNotification);
      this.channel.on('delete_notification', this.onNotificationDelete);
      this.channel.on('delete_all_notifications', this.onDeleteAllNotifications);
      this.channel.on('mark_notification_as_read', this.onNotificationMarkedAsRead);
      this.channel.on('mark_notification_as_unread', this.onNotificationMarkedAsUnRead);
      this.callback = callback;
    });
  }

  logDebugInfo = (...options) => {
    if (this.useLogger) {
      console.info(...options);
    }
  }

  getSocketToken = () => {
    return fetch('/api/notifications_and_alerts/socket_token', {
      method: 'POST',
      credentials: 'same-origin'
    }).
    then((response) => checkStatus(response, 'Error while getting socket token')).
    then((response) => response.json());
  }

  setNotificationObject = (options) => {
    return _.defaults(options, {
      hasMoreNotifications: false,
      loading: false,
      notifications: [],
      total: 0,
      offset: 0,
      unread: 0
    });
  }

  loadNotifications = (type, offset) => {
    this.userNotifications[type].loading = true;
    this.update();

    const params = { limit: NOTIFICATIONS_PER_PAGE, offset, type };
    const loadNotificationsUrl = `/api/notifications_and_alerts/notifications?${$.param(params)}`;

    return fetch(loadNotificationsUrl, {
      credentials: 'same-origin'
    }).
    then((response) => {
      return response.json();
    }).then(response => {
      offset += NOTIFICATIONS_PER_PAGE;
      const { total, unread } = response.count;
      const notifications = _.union(
        this.userNotifications[type].notifications,
        this.transformNotifications(_.get(response, 'data', []))
      );
      const hasMoreNotifications = offset < total;

      this.userNotifications[type] = this.setNotificationObject({
        hasMoreNotifications,
        notifications,
        total,
        offset,
        unread
      });

      this.update();
    });
  }

  onNewNotification = (response) => {
    if (_.isUndefined(response.notification) || !_.isObject(response.notification)) {
      this.logDebugInfo('invalid response', response);
      return;
    }

    const { notification } = response;
    const { type } = notification;

    this.enqueuedNotifications.unshift(this.transformNotification(notification));
    this.userNotifications[type].total++;
    this.userNotifications[type].unread++;
    this.userNotifications[type].offset++;
    this.update();
  }

  onNotificationDelete = (response) => {
    if (!_.isNumber(response.notification_id) || !_.isString(response.type)) {
      this.logDebugInfo('invalid response', response);
      return;
    }

    const { notification_id: notificationId, type } = response;
    const notificationIndex = this.getNotificationIndex(
      this.userNotifications[type].notifications,
      notificationId
    );

    if (notificationIndex !== -1) {
      if (this.userNotifications[type].notifications[notificationIndex].read === false) {
        this.userNotifications[type].unread--;
      }

      this.userNotifications[type].notifications.splice(notificationIndex, 1);
    } else {
      const enqueuedNotificationIndex = this.getNotificationIndex(
        this.enqueuedNotifications,
        notificationId
      );

      if (this.enqueuedNotifications[enqueuedNotificationIndex].read === false) {
        this.userNotifications[type].unread--;
      }

      this.enqueuedNotifications.splice(enqueuedNotificationIndex, 1);
    }

    this.userNotifications[type].total--;
    this.userNotifications[type].offset--;
    this.update();
  }

  onDeleteAllNotifications = () => {
    this.enqueuedNotifications = [];
    this.userNotifications.activity = this.setNotificationObject();

    if (this.userNotifications.alert) {
      this.userNotifications.alert = this.setNotificationObject();
    }

    this.update();
  }

  onNotificationMarkedAsRead = (response) => {
    if (!_.isNumber(response.notification_id) || !_.isString(response.type)) {
      this.logDebugInfo('invalid response', response);
      return;
    }

    const { notification_id: notificationId, type } = response;

    this.updateNotificationReadState(notificationId, type, true);
  }

  onNotificationMarkedAsUnRead = (response) => {
    if (!_.isNumber(response.notification_id) || !_.isString(response.type)) {
      this.logDebugInfo('invalid response', response);
      return;
    }

    const { notification_id: notificationId, type } = response;

    this.updateNotificationReadState(notificationId, type, false);
  }

  updateNotificationReadState = (notificationId, type, toggle) => {
    const notificationIndex = this.getNotificationIndex(
      this.userNotifications[type].notifications,
      notificationId
    );

    if (notificationIndex !== -1) {
      this.userNotifications[type].notifications[notificationIndex].read = toggle;
    } else {
      const enqueuedNotificationIndex = this.getNotificationIndex(
        this.enqueuedNotifications,
        notificationId
      );

      this.enqueuedNotifications[enqueuedNotificationIndex].read = toggle;
    }

    if (toggle) {
      this.userNotifications[type].unread--;
    } else {
      this.userNotifications[type].unread++;
    }

    this.update();
  }

  getNotificationIndex = (notifications, notificationId) => {
    return _.findIndex(notifications, { id: notificationId });
  }

  deleteNotification = (notificationId) => {
    fetch(`/api/notifications_and_alerts/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
  }

  deleteAllNotifications = () => {
    fetch('/api/notifications_and_alerts/notifications', {
      method: 'DELETE',
      credentials: 'same-origin'
    });
  }

  loadMoreNotifications = (type) => {
    this.loadNotifications(type, this.userNotifications[type].offset);
  }

  seeNewNotifications = (type) => {
    this.userNotifications[type].notifications = _.filter(this.enqueuedNotifications, (notification) => {
      return type === notification.type;
    }).concat(this.userNotifications[type].notifications);
    this.enqueuedNotifications = _.reject(this.enqueuedNotifications, (notification) => {
      return type === notification.type;
    });
    this.update();
  }

  markNotificationAsRead = (notificationId) => {
    this.toggleNotificationReadState(notificationId, true);
  }

  markNotificationAsUnRead = (notificationId) => {
    this.toggleNotificationReadState(notificationId, false);
  }

  toggleNotificationReadState = (notificationId, toggle) => {
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

  getUserProfileLink = (domainCname, userName, userId) => {
    if (_.isEmpty(domainCname) || _.isEmpty(userName) || _.isEmpty(userId)) {
      return null;
    }

    return `//${domainCname}/profile/${utils.convertToUrlComponent(userName)}/${userId}`;
  }

  getDatasetLink = (domainCname, name, uId) => {
    if (_.isEmpty(domainCname) || _.isEmpty(name) || _.isEmpty(uId)) {
      return null;
    }

    return `//${domainCname}/dataset/${utils.convertToUrlComponent(name)}/${uId}`;
  }

  //
  transformNotification = (notification) => {
    const userActivityTypes = ['UserAdded', 'UserRemoved', 'UserRoleChanged'];
    const activityType = _.get(notification, 'activity.activity_type', '');
    const domainCname = _.get(notification, 'activity.domain_cname', '');
    const userName = _.get(notification, 'activity.acting_user_name', '');
    const userId = _.get(notification, 'activity.acting_user_id', '');
    const type = _.get(notification, 'type', '');

    const transformedNotification = {
      id: _.get(notification, 'id', ''),
      read: _.get(notification, 'read', false),
      activityType: activityType,
      createdAt: _.get(notification, 'activity.created_at', ''),
      type: type,
      activityUniqueKey: _.get(notification, 'activity_unique_key', ''),
      userName: userName,
      userProfileLink: this.getUserProfileLink(domainCname, userName, userId)
    };

    if (type === 'alert') {
      const domainName = _.get(notification, 'alert.domain', '');
      const datasetId = _.get(notification, 'alert.dataset_uid', '');
      const datasetName = _.get(notification, 'alert.dataset_name', '');

      _.assignIn(transformedNotification, {
        alertName: _.get(notification, 'alert.name', ''),
        messageBody: datasetName,
        link: this.getDatasetLink(domainName, datasetName, datasetId),
        createdAt: _.get(notification, 'alert_triggered_at', '')
      });

    } else {
      if (activityType === VIEW_METADATA_CHANGED) {
        const viewId = _.get(notification, 'activity.view_uid', '');
        const viewName = _.get(notification, 'activity.view_name', '');

        _.assignIn(transformedNotification, {
          link: this.getDatasetLink(domainCname, viewName, viewId),
          messageBody: viewName
        });
      } else if (_.includes(userActivityTypes, activityType)) {
        let activityDetails = {};

        try {
          activityDetails = JSON.parse(_.get(notification, 'activity.details', {}));
        } catch (err) {
          this.logDebugInfo('malformed data', _.get(notification, 'activity.details', {}));
        }

        _.assignIn(transformedNotification, {
          link: null,
          messageBody: _.get(activityDetails, 'summary', '')
        });
      } else {
        const datasetId = _.get(notification, 'activity.dataset_uid', '');
        const datasetName = _.get(notification, 'activity.dataset_name', '');

        _.assignIn(transformedNotification, {
          link: this.getDatasetLink(domainCname, datasetName, datasetId),
          messageBody: datasetName
        });
      }
    }

    return transformedNotification;
  }

  transformNotifications = (notifications) => {
    if (_.isEmpty(notifications)) {
      return notifications;
    }

    const transformedNotifications = [];

    _.each(notifications, (notification) => {
      transformedNotifications.push(this.transformNotification(notification));
    });

    return transformedNotifications;
  }

  update = () => {
    if (_.isFunction(this.callback)) {
      this.callback(this.userNotifications, this.enqueuedNotifications);
    }
  }
}

export default NotificationAPI;

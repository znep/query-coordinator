import 'whatwg-fetch';
import { Socket } from 'phoenix';

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
      that._notifications = response.data || [];
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
    this._notifications.push(notification);
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

  update() {
    if (this._callback) {
      this._callback(this._notifications);
    }
  }
}

export default NotificationStore;

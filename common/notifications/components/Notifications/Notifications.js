import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import 'babel-polyfill-safe';
import _ from 'lodash';
import { getProductNotifications, updateProductNotificationLastSeen } from 'common/notifications/store/ProductNotificationStore';
import NotificationList from 'common/notifications/components/NotificationList/NotificationList';
import Bell from 'common/notifications/components/Bell/Bell';
import styles from './notifications.scss';

class Notifications extends Component {
  constructor(props) {
    super(props);

    this.state = {
      areNotificationsLoading: false,
      hasError: false,
      notifications: [],
      showNotificationPanel: false,
      unreadNotificationCount: 0
    }

    this.addKeyboardEvents = this.addKeyboardEvents.bind(this);
    this.removeKeyboardEvents = this.removeKeyboardEvents.bind(this);
    this.hidePanelOnOutsideClick = this.hidePanelOnOutsideClick.bind(this);
    this.hidePanelOnEscapeKeypress = this.hidePanelOnEscapeKeypress.bind(this);
    this.toggleNotificationPanel = this.toggleNotificationPanel.bind(this);
    this.hasUnreadNotifications = this.hasUnreadNotifications.bind(this);
    this.getUnreadNotificationsCount = this.getUnreadNotificationsCount.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.renderNotificationPanel = this.renderNotificationPanel.bind(this);
  }

  componentDidMount() {
    this.setState({ areNotificationsLoading: true });

    getProductNotifications((response) => {
      if (response.notifications && response.viewOlderLink) {
        this.setState({
          notifications: response.notifications,
          viewOlderLink: response.viewOlderLink || null,
          areNotificationsLoading: false,
          unreadNotificationCount: this.getUnreadNotificationsCount(response.notifications)
        });
      } else {
        this.setState({
          hasError: true,
          areNotificationsLoading: false
        });
      }
    });
  }

  componentWillUnmount() {
    this.removeKeyboardEvents();
  }

  addKeyboardEvents() {
    // add an event listener to hide when clicking somewhere
    window.addEventListener('mouseup', this.hidePanelOnOutsideClick);

    // add an event listened to hide when ESC is pressed
    window.addEventListener('keyup', this.hidePanelOnEscapeKeypress);
  }

  removeKeyboardEvents() {
    window.removeEventListener('mouseup', this.hidePanelOnOutsideClick);
    window.removeEventListener('keyup', this.hidePanelOnEscapeKeypress);
  }

  hidePanelOnOutsideClick(event) {
    if (event.target &&
      event.target.closest &&
      !event.target.closest('#socrata-notifications-container')) {
      this.toggleNotificationPanel();
    }
  }

  hidePanelOnEscapeKeypress(event) {
    if (event.keyCode === 27) {
      this.toggleNotificationPanel();
    }
  }

  toggleNotificationPanel() {
    const showNotificationPanel = !this.state.showNotificationPanel;

    if (showNotificationPanel) {
      this.addKeyboardEvents();
    } else {
      this.removeKeyboardEvents();
    }

    this.setState({showNotificationPanel});
  }

  hasUnreadNotifications() {
    return this.state.unreadNotificationCount > 0;
  }

  getUnreadNotificationsCount(notifications) {
    return notifications.filter((notification) => {
      return _.isUndefined(notification.isUnread) || notification.isUnread == true;
    }).length;
  }

  markAllAsRead() {
    if (this.hasUnreadNotifications()) {
      const readNotifications = this.state.notifications.map((notification) => ({
        ...notification,
        isUnread: false
      }));

      this.setState({ notifications: readNotifications, unreadNotificationCount: 0 });

      updateProductNotificationLastSeen(new Date());
    }
  }

  renderNotificationPanel() {
    const { showNotificationPanel } = this.state;

    if (showNotificationPanel) {
      const {
        errorText,
        newNotificationsLabelText,
        markAsReadText,
        productUpdatesText,
        viewOlderText,
        currentUserRole,
        isAdmin
      } = this.props.translations;

      const {
        areNotificationsLoading,
        hasError,
        notifications,
        unreadNotificationCount,
        viewOlderLink
      } = this.state;

      return (
        <div className='notifications-panel-wrapper'>
          <NotificationList
            errorText={errorText}
            hasError={hasError}
            markAllAsRead={this.markAllAsRead}
            notifications={notifications}
            newNotificationsLabelText={newNotificationsLabelText}
            panelHeaderText={productUpdatesText}
            toggleNotificationPanel={this.toggleNotificationPanel}
            unreadNotificationCount={unreadNotificationCount}
            viewOlderLink={viewOlderLink}
            viewOlderText={viewOlderText}
            currentUserRole={currentUserRole}
            isAdmin={isAdmin}
            areNotificationsLoading={areNotificationsLoading} />
        </div>
      );
    }

    return null;
  }

  render() {
    const { unreadNotificationCount } = this.state;

    const {
      hasUnreadNotificationsText,
      noUnreadNotificationsText
    } = this.props.translations;

    return (
      <div styleName='container'>
        <div id='socrata-notifications-container'>
          <Bell unreadNotificationCount={unreadNotificationCount}
            toggleNotificationPanel={this.toggleNotificationPanel}
            hasUnreadNotificationsText={hasUnreadNotificationsText}
            noUnreadNotificationsText={noUnreadNotificationsText} />

          {this.renderNotificationPanel()}
        </div>
      </div>
    );
  }
}

Notifications.propTypes = {
  translations: PropTypes.shape({
    errorText: PropTypes.string.isRequired,
    hasUnreadNotificationsText: PropTypes.string.isRequired,
    newNotificationsLabelText: PropTypes.string.isRequired,
    noUnreadNotificationsText: PropTypes.string.isRequired,
    productUpdatesText: PropTypes.string.isRequired,
    viewOlderText: PropTypes.string.isRequired
  }).isRequired
};

export default cssModules(Notifications, styles);

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import 'babel-polyfill-safe';
import { getNotifications, updateNotificationLastSeen } from 'common/notifications/Util';
import Bell from 'common/notifications/Bell';
import NotificationList from 'common/notifications/NotificationList';
import styles from 'common/notifications/notifications.scss';

class Notifications extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showNotifications: false,
      hasError: false
    };

    this.hasUnread = this.hasUnread.bind(this);
    this.hideOnEscapeKeypress = this.hideOnEscapeKeypress.bind(this);
    this.hideOnOutsideClick = this.hideOnOutsideClick.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.renderNotificationsList = this.renderNotificationsList.bind(this);
    this.toggleList = this.toggleList.bind(this);
  }

  componentDidMount() {
    getNotifications((response) => {
      if (response.notifications && response.viewOlderLink) {
        this.setState({
          notifications: response.notifications,
          viewOlderLink: response.viewOlderLink
        });
      } else {
        this.setState({ hasError: true });
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.hideOnOutsideClick);
    window.removeEventListener('keyup', this.hideOnEscapeKeypress);
  }

  hideOnOutsideClick(event) {
    if (event.target && event.target.closest && !event.target.closest('#socrata-notifications-container')) {
      this.toggleList();
    }
  }

  hideOnEscapeKeypress(event) {
    if (event.keyCode === 27) {
      this.toggleList();
    }
  }

  toggleList() {
    // note that since we default to NOT showing notifications,
    // this will only hide them after closing and then opening them
    const showNotifications = !this.state.showNotifications;

    if (!showNotifications) {
      this.markAllAsRead();
      window.removeEventListener('mouseup', this.hideOnOutsideClick);
      window.removeEventListener('keyup', this.hideOnEscapeKeypress);
    } else {
      // add an event listener to hide when clicking somewhere
      window.addEventListener('mouseup', this.hideOnOutsideClick);

      // add an event listened to hide when ESC is pressed
      window.addEventListener('keyup', this.hideOnEscapeKeypress);
    }

    this.setState({ showNotifications });
  }

  hasUnread() {
    const { notifications } = this.state;

    if (!notifications) {
      return false;
    }

    for (let i = 0; i < notifications.length; i += 1) {
      if (notifications[i].isUnread) {
        return true;
      }
    }
  }

  markAllAsRead() {
    if (this.hasUnread()) {
      const readNotifications = this.state.notifications.map(
        notification => ({
          ...notification,
          isUnread: false
        })
      );

      this.setState({ notifications: readNotifications });

      updateNotificationLastSeen(new Date());
    }
  }

  renderNotificationsList() {
    const { showNotifications, notifications, viewOlderLink, hasError } = this.state;
    const { errorText, productUpdatesText, viewOlderText } = this.props.translations;

    if (showNotifications) {
      return (
        <NotificationList
          hasError={hasError}
          errorText={errorText}
          notifications={notifications}
          viewOlderLink={viewOlderLink}
          productUpdatesText={productUpdatesText}
          viewOlderText={viewOlderText} />
      );
    }

    return null;
  }

  render() {
    const { productUpdatesText } = this.props.translations;
    return (
      <div id="socrata-notifications-container" styleName="container">
        <Bell
          onClick={this.toggleList}
          hasUnread={this.hasUnread()}
          label={productUpdatesText} />
        {this.renderNotificationsList()}
      </div>
    );
  }
}

Notifications.propTypes = {
  translations: PropTypes.shape({
    errorText: PropTypes.string.isRequired,
    productUpdatesText: PropTypes.string.isRequired,
    viewOlderText: PropTypes.string.isRequired
  }).isRequired
};

export default cssModules(Notifications, styles);

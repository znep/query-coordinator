import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import { getNotifications, updateNotificationLastSeen } from './Util';
import Bell from './Bell';
import NotificationList from './NotificationList';
import styles from './notifications.scss';

require('element-closest');

class Notifications extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showNotifications: false,
      hasError: false
    };

    _.bindAll(this, [
      'hasUnread',
      'hideOnOutsideClick',
      'markAllAsRead',
      'renderNotificationsList',
      'toggleList'
    ]);
  }

  componentDidMount() {
    getNotifications((response) => {
      if (_.isEmpty(response)) {
        this.setState({ hasError: true });
      } else {
        this.setState({
          notifications: response.notifications,
          viewOlderLink: response.viewOlderLink
        });
      }
    });
  }

  hideOnOutsideClick(event) {
    if (!event.target.closest('#socrata-notifications-list')) {
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
    } else {
      // add an event listener to hide when clicking somewhere
      window.addEventListener('mouseup', this.hideOnOutsideClick);
    }

    this.setState({ showNotifications });
  }

  hasUnread() {
    return _.some(this.state.notifications, { isUnread: true });
  }

  markAllAsRead() {
    if (this.hasUnread()) {
      const readNotifications = this.state.notifications.map(
        notification => ({
          ...notification,
          isUnread: false
        }),
      );

      this.setState({ notifications: readNotifications });

      updateNotificationLastSeen(new Date());
    }
  }

  renderNotificationsList() {
    const { showNotifications, notifications, viewOlderLink, hasError } = this.state;
    const { errorText, productUpdatesText, viewOlderText } = this.props.options;

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
    return (
      <div id="socrata-notifications-list" styleName="container">
        <Bell theme="light" onClick={this.toggleList} hasUnread={this.hasUnread()} />
        {this.renderNotificationsList()}
      </div>
    );
  }
}

Notifications.propTypes = {
  options: PropTypes.shape({
    errorText: PropTypes.string.isRequired,
    productUpdatesText: PropTypes.string.isRequired,
    viewOlderText: PropTypes.string.isRequired
  }).isRequired
};

export default cssModules(Notifications, styles);

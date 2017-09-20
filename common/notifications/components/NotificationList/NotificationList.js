import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import PanelHeader from './PanelHeader';
import ProductNotificationList from 'common/notifications/components/ProductNotificationList/ProductNotificationList';
import PanelFooter from './PanelFooter';
import styles from './notification-list.scss';

class NotificationList extends Component {
  renderPanelHeader() {
    const {
      panelHeaderText,
      toggleNotificationPanel,
      unreadNotificationCount
    } = this.props;

    return (
      <PanelHeader panelHeaderText={panelHeaderText}
        onClosePanel={toggleNotificationPanel}
        unreadCount={unreadNotificationCount} />
    );
  }

  renderPanelFooter() {
    const {
      notifications,
      markAllAsRead,
      unreadNotificationCount
    } = this.props;

    let hasUnreadNotifications = unreadNotificationCount > 0;

    if (!_.isEmpty(notifications)) {
      return <PanelFooter markAllAsRead={markAllAsRead} hasUnreadNotifications={hasUnreadNotifications} />;
    }
  }

  render() {
    const {
      areNotificationsLoading,
      errorText,
      hasError,
      notifications,
      viewOlderLink,
      viewOlderText
    } = this.props;

    return (
      <div styleName='notifications-panel' className='clearfix'>
        {this.renderPanelHeader()}

        <ProductNotificationList
          notifications={notifications}
          hasError={hasError}
          errorText={errorText}
          viewOlderLink={viewOlderLink}
          viewOlderText={viewOlderText}
          areNotificationsLoading={areNotificationsLoading} />

        {this.renderPanelFooter()}
      </div>
    );
  }
}

NotificationList.propTypes = {
  areNotificationsLoading: PropTypes.bool.isRequired,
  errorText: PropTypes.string.isRequired,
  hasError: PropTypes.bool.isRequired,
  markAllAsRead: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired,
  panelHeaderText: PropTypes.string.isRequired,
  toggleNotificationPanel: PropTypes.func.isRequired,
  unreadNotificationCount: PropTypes.number.isRequired,
  viewOlderLink: PropTypes.string,
  viewOlderText: PropTypes.string.isRequired
};

export default cssModules(NotificationList, styles, { allowMultiple: true });

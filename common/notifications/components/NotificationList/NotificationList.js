import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import classNames from 'classnames';

import connectLocalization from 'common/i18n/components/connectLocalization';

import PanelHeader from './PanelHeader';
import ProductNotificationList from 'common/notifications/components/ProductNotificationList/ProductNotificationList';
import PanelFooter from './PanelFooter';
import UserNotificationList from 'common/notifications/components/UserNotifications/UserNotificationList';
import Tabs from 'common/notifications/components/Tabs/Tabs';
import styles from './notification-list.scss';

class NotificationList extends Component {
  renderPanelHeader() {
    const {
      showUserNotifications,
      toggleNotificationPanel,
      I18n
    } = this.props;

    if (showUserNotifications) {
      const { unreadUserNotificationCount } = this.props;
      const panelHeaderText = I18n.t('user_notifications');

      return (
        <PanelHeader panelHeaderText={panelHeaderText}
          onClosePanel={toggleNotificationPanel}
          unreadCount={unreadUserNotificationCount} />
      );
    } else {
      const { unreadProductNotificationCount } = this.props;
      const panelHeaderText = I18n.t('product_updates');

      return (
        <PanelHeader panelHeaderText={panelHeaderText}
          onClosePanel={toggleNotificationPanel}
          unreadCount={unreadProductNotificationCount} />
      );
    }
  }

  renderUserNotifications() {
    const { showUserNotifications } = this.props;

    if (showUserNotifications) {
      const {
        filterUserNotifications,
        filterUserNotificationsBy,
        I18n,
        onClearUserNotification,
        onToggleReadUserNotification,
        userNotifications,
        showProductNotifications
      } = this.props;
      const filterTabs = [
        I18n.t('filter_all_notifications_tab_text'),
        I18n.t('filter_status_notifications_tab_text'),
        I18n.t('filter_alert_notifications_tab_text')
      ];

      return (
        <Tabs filterNotifications={filterUserNotifications}
          hasSecondaryPanel={showProductNotifications}
          selectedTab={filterUserNotificationsBy}
          tablist={filterTabs}>
          <UserNotificationList filterNotificationsBy={filterUserNotificationsBy}
            onClearUserNotification={onClearUserNotification}
            onToggleReadUserNotification={onToggleReadUserNotification}
            userNotifications={userNotifications} />
        </Tabs>
      );
    }
  }

  renderProductNotifications() {
    const {
      areNotificationsLoading,
      hasError,
      isSecondaryPanelOpen,
      productNotifications,
      showProductNotificationsAsSecondaryPanel,
      showProductNotifications,
      unreadProductNotificationCount,
      toggleProductNotificationsSecondaryPanel,
      viewOlderLink
    } = this.props;

    if (showProductNotifications) {
      return (
        <ProductNotificationList areNotificationsLoading={areNotificationsLoading}
          hasError={hasError}
          isSecondaryPanelOpen={isSecondaryPanelOpen}
          notifications={productNotifications}
          showProductNotificationsAsSecondaryPanel={showProductNotificationsAsSecondaryPanel}
          toggleProductNotificationsSecondaryPanel={toggleProductNotificationsSecondaryPanel}
          unreadProductNotificationCount={unreadProductNotificationCount}
          viewOlderLink={viewOlderLink} />
      );
    }
  }

  renderPanelFooter() {
    const {
      currentUserRole,
      isAdmin,
      isSecondaryPanelOpen,
      showProductNotificationsAsSecondaryPanel,
      showProductNotifications,
      showUserNotifications
    } = this.props;

    if ((showProductNotifications && !showUserNotifications) || (showProductNotificationsAsSecondaryPanel && isSecondaryPanelOpen)) {
      const {
        markAllProductNotificationsAsRead,
        unreadProductNotificationCount
      } = this.props;

      return <PanelFooter markAllProductNotificationsAsRead={markAllProductNotificationsAsRead}
        hasUnreadNotifications={unreadProductNotificationCount > 0}
        forUserNotifications={false}
        currentUserRole={currentUserRole}
        isAdmin={isAdmin} />;
    } else if (showUserNotifications) {
      const {
        clearAllUserNotifications,
        openClearAllUserNotificationsPrompt,
        toggleClearAllUserNotificationsPrompt,
        userNotifications
      } = this.props;

      return <PanelFooter clearAllUserNotifications={clearAllUserNotifications}
        forUserNotifications={true}
        hasUserNotifications={userNotifications.length > 0}
        openClearAllUserNotificationsPrompt={openClearAllUserNotificationsPrompt}
        toggleClearAllUserNotificationsPrompt={toggleClearAllUserNotificationsPrompt}
        currentUserRole={currentUserRole}
        isAdmin={isAdmin} />;
    }
  }

  render() {
    const { showUserNotifications } = this.props;

    return (
      <div styleName='notifications-panel'
        className={classNames('clearfix', { 'socrata-notifications-sidebar': showUserNotifications })}>
        {this.renderPanelHeader()}
        {this.renderUserNotifications()}
        {this.renderProductNotifications()}
        {this.renderPanelFooter()}
      </div>
    );
  }
}

NotificationList.propTypes = {
  areNotificationsLoading: PropTypes.bool.isRequired,
  clearAllUserNotifications: PropTypes.func.isRequired,
  currentUserRole: PropTypes.string,
  filterUserNotificationsBy: PropTypes.string.isRequired,
  hasError: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  isSecondaryPanelOpen: PropTypes.bool.isRequired,
  markAllProductNotificationsAsRead: PropTypes.func.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  openClearAllUserNotificationsPrompt: PropTypes.bool.isRequired,
  productNotifications: PropTypes.array.isRequired,
  showProductNotifications: PropTypes.bool.isRequired,
  showUserNotifications: PropTypes.bool.isRequired,
  showProductNotificationsAsSecondaryPanel: PropTypes.bool.isRequired,
  toggleNotificationPanel: PropTypes.func.isRequired,
  toggleClearAllUserNotificationsPrompt: PropTypes.func.isRequired,
  toggleProductNotificationsSecondaryPanel: PropTypes.func.isRequired,
  userNotifications: PropTypes.array.isRequired,
  unreadProductNotificationCount: PropTypes.number.isRequired,
  unreadUserNotificationCount: PropTypes.number.isRequired,
  viewOlderLink: PropTypes.string
};

export default connectLocalization(cssModules(NotificationList, styles, { allowMultiple: true }));

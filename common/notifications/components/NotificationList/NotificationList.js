import $ from 'jquery';
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
import { FILTER_TABS } from 'common/notifications/constants';
import styles from './notification-list.module.scss';

class NotificationList extends Component {
  componentWillMount() {
    const { lockScrollbar, scrollTop } = this.props.renderingOptions;

    if (lockScrollbar) {
      // disable page scrolling for non admins as the
      // notification panel won't be docked to header
      document.querySelector('html').scrollTop = scrollTop;
      document.querySelector('body').style.overflow = 'hidden';
    }
  }

  componentDidMount() {
    // if the view port height is less than combined height of sidebar and rally header
    // it cause the header icons/links to overlap on notification panel
    // reposition the notification panel with respect to the header bar

    const $siteChromeHeader = $('#site-chrome-header');
    const $siteChromeAdminHeader = $('#site-chrome-admin-header');

    if (!$siteChromeAdminHeader.is(':visible') && $siteChromeHeader.attr('template') === 'rally') {
      const $notificationsSidebar = $('#notifications-sidebar');
      const siteChromeHeaderHeight = $siteChromeHeader.outerHeight();
      const notificationsSidebarHeight = $notificationsSidebar.outerHeight();
      const pageContentHeight = document.querySelector('.siteOuterWrapper').clientHeight +
        document.querySelector('#site-chrome-footer').clientHeight;

      if ((notificationsSidebarHeight + siteChromeHeaderHeight) >= pageContentHeight) {
        $notificationsSidebar.css('top', siteChromeHeaderHeight);
      }
    }
  }

  componentWillUnmount() {
    // enable page scrolling once the notification panel is closed
    if (this.props.renderingOptions.lockScrollbar) {
      document.querySelector('body').style.overflow = '';
    }
  }

  renderPanelHeader() {
    const {
      showUserNotifications,
      toggleNotificationPanel,
      I18n
    } = this.props;

    if (showUserNotifications) {
      const { unreadUserNotificationCount } = this.props;
      const panelHeaderText = I18n.t('shared_site_chrome_notifications.user_notifications');

      return (
        <PanelHeader
          panelHeaderText={panelHeaderText}
          onClosePanel={toggleNotificationPanel}
          unreadCount={unreadUserNotificationCount} />
      );
    }

    const { unreadProductNotificationCount } = this.props;
    const panelHeaderText = I18n.t('shared_site_chrome_notifications.product_updates');

    return (
      <PanelHeader
        panelHeaderText={panelHeaderText}
        onClosePanel={toggleNotificationPanel}
        unreadCount={unreadProductNotificationCount} />
    );
  }

  renderUserNotifications() {
    const { showUserNotifications } = this.props;

    if (showUserNotifications) {
      const {
        filterUserNotifications,
        filterUserNotificationsBy,
        hasMoreNotifications,
        hasEnqueuedUserNotifications,
        onClearUserNotification,
        onLoadMoreUserNotifications,
        onSeeNewUserNotifications,
        onToggleReadUserNotification,
        userNotifications,
        showProductNotifications
      } = this.props;

      return (
        <Tabs
          filterNotifications={filterUserNotifications}
          hasSecondaryPanel={showProductNotifications}
          selectedTab={filterUserNotificationsBy}
          tabs={FILTER_TABS}>
          <UserNotificationList
            filterNotificationsBy={filterUserNotificationsBy}
            hasMoreNotifications={hasMoreNotifications}
            hasEnqueuedUserNotifications={hasEnqueuedUserNotifications}
            onClearUserNotification={onClearUserNotification}
            onLoadMoreUserNotifications={onLoadMoreUserNotifications}
            onSeeNewUserNotifications={onSeeNewUserNotifications}
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
        <ProductNotificationList
          areNotificationsLoading={areNotificationsLoading}
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
      isSuperAdmin,
      isSecondaryPanelOpen,
      showProductNotificationsAsSecondaryPanel,
      showProductNotifications,
      showUserNotifications,
      currentDomainFeatures,
      showMyAlertPreference,
      inProductTransientNotificationsEnabled,
      onShowTransientNotificationsChange,
      mapboxAccessToken
    } = this.props;

    if ((showProductNotifications && !showUserNotifications) || (showProductNotificationsAsSecondaryPanel && isSecondaryPanelOpen)) {
      const {
        markAllProductNotificationsAsRead,
        unreadProductNotificationCount
      } = this.props;

      return (<PanelFooter
        markAllProductNotificationsAsRead={markAllProductNotificationsAsRead}
        hasUnreadNotifications={unreadProductNotificationCount > 0}
        forUserNotifications={false}
        currentUserRole={currentUserRole}
        showUserNotifications={showUserNotifications}
        currentDomainFeatures={currentDomainFeatures}
        showMyAlertPreference={showMyAlertPreference}
        inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
        onShowTransientNotificationsChange={onShowTransientNotificationsChange}
        mapboxAccessToken={mapboxAccessToken}
        isSuperAdmin={isSuperAdmin} />);
    } else if (showUserNotifications) {
      const {
        clearAllUserNotifications,
        openClearAllUserNotificationsPrompt,
        toggleClearAllUserNotificationsPrompt,
        userNotifications
      } = this.props;

      return (<PanelFooter
        clearAllUserNotifications={clearAllUserNotifications}
        forUserNotifications
        hasUserNotifications={userNotifications.length > 0}
        openClearAllUserNotificationsPrompt={openClearAllUserNotificationsPrompt}
        toggleClearAllUserNotificationsPrompt={toggleClearAllUserNotificationsPrompt}
        showUserNotifications={showUserNotifications}
        currentUserRole={currentUserRole}
        currentDomainFeatures={currentDomainFeatures}
        showMyAlertPreference={showMyAlertPreference}
        inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
        onShowTransientNotificationsChange={onShowTransientNotificationsChange}
        mapboxAccessToken={mapboxAccessToken}
        isSuperAdmin={isSuperAdmin} />);
    }
  }

  render() {
    const { showUserNotifications } = this.props;
    const className = classNames('clearfix', { 'socrata-notifications-sidebar': showUserNotifications });

    return (
      <div className={className} id="notifications-sidebar" styleName="notifications-panel">
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
  hasMoreNotifications: PropTypes.bool.isRequired,
  hasEnqueuedUserNotifications: PropTypes.bool.isRequired,
  isSuperAdmin: PropTypes.bool.isRequired,
  isSecondaryPanelOpen: PropTypes.bool.isRequired,
  markAllProductNotificationsAsRead: PropTypes.func.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onLoadMoreUserNotifications: PropTypes.func.isRequired,
  onSeeNewUserNotifications: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  openClearAllUserNotificationsPrompt: PropTypes.bool.isRequired,
  productNotifications: PropTypes.array.isRequired,
  renderingOptions: PropTypes.object.isRequired,
  showProductNotifications: PropTypes.bool.isRequired,
  showUserNotifications: PropTypes.bool.isRequired,
  showProductNotificationsAsSecondaryPanel: PropTypes.bool.isRequired,
  toggleNotificationPanel: PropTypes.func.isRequired,
  toggleClearAllUserNotificationsPrompt: PropTypes.func.isRequired,
  toggleProductNotificationsSecondaryPanel: PropTypes.func.isRequired,
  userNotifications: PropTypes.array.isRequired,
  unreadProductNotificationCount: PropTypes.number.isRequired,
  unreadUserNotificationCount: PropTypes.number.isRequired,
  viewOlderLink: PropTypes.string,
  showMyAlertPreference: PropTypes.bool,
  inProductTransientNotificationsEnabled: PropTypes.bool,
  onShowTransientNotificationsChange: PropTypes.func.isRequired
};

export default connectLocalization(cssModules(NotificationList, styles, { allowMultiple: true }));

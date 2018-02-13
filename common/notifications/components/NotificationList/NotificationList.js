import _ from 'lodash';
import $ from 'jquery';
import classNames from 'classnames';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import connectLocalization from 'common/i18n/components/connectLocalization';
import Tabs from 'common/notifications/components/Tabs/Tabs';

import PanelHeader from './PanelHeader';
import ProductNotificationList from 'common/notifications/components/ProductNotificationList/ProductNotificationList';
import PanelFooter from './PanelFooter';
import styles from './notification-list.module.scss';
import UserNotificationList from 'common/notifications/components/UserNotifications/UserNotificationList';

const scope = 'shared_site_chrome_notifications';

class NotificationList extends Component {
  componentWillMount() {
    if (this.isNotSiteChromeAdminHeader) {
      // disable page scrolling when site chrome admin header is not present

      $('html').scrollTop(0);
      $('body').css('overflow', 'hidden');
    }
  }

  componentDidMount() {
    if (this.isNotSiteChromeAdminHeader) {
      // reposition the notification panel below the site chrome header

      $('#notifications-sidebar').css('top', $('#site-chrome-header').outerHeight());
    }
  }

  componentWillUnmount() {
    if (this.isNotSiteChromeAdminHeader) {
      // enable page scrolling once the notification panel is closed

      $('body').css('overflow', '');
    }
  }

  isNotSiteChromeAdminHeader = !$('#site-chrome-admin-header').is(':visible');

  renderPanelHeader = () => {
    const {
      I18n,
      showUserNotifications,
      toggleNotificationPanel
    } = this.props;
    let panelHeaderText;
    let unreadCount;

    if (showUserNotifications) {
      unreadCount = this.props.unreadUserNotificationCount;
      panelHeaderText = I18n.t('user_notifications', { scope });
    } else {
      unreadCount = this.props.unreadProductNotificationCount;
      panelHeaderText = I18n.t('product_updates', { scope });
    }

    return (
      <PanelHeader
        onClosePanel={toggleNotificationPanel}
        panelHeaderText={panelHeaderText}
        unreadCount={unreadCount} />
    );
  }

  renderUserNotifications = () => {
    const { showUserNotifications } = this.props;

    if (showUserNotifications) {
      const {
        filterUserNotifications,
        filterUserNotificationsBy,
        hasEnqueuedUserNotifications,
        onClearUserNotification,
        onLoadMoreUserNotifications,
        onSeeNewUserNotifications,
        onToggleReadUserNotification,
        showProductNotifications,
        userNotifications
      } = this.props;
      const filterTabs = _.keys(userNotifications);

      return (
        <Tabs
          filterNotifications={filterUserNotifications}
          hasSecondaryPanel={showProductNotifications}
          selectedTab={filterUserNotificationsBy}
          tabs={filterTabs}>
          <UserNotificationList
            filterNotificationsBy={filterUserNotificationsBy}
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

  renderProductNotifications = () => {
    const {
      areProductNotificationsLoading,
      hasError,
      isSecondaryPanelOpen,
      productNotifications,
      showProductNotificationsAsSecondaryPanel,
      showProductNotifications,
      toggleProductNotificationsSecondaryPanel,
      unreadProductNotificationCount,
      viewOlderLink
    } = this.props;

    if (showProductNotifications) {
      return (
        <ProductNotificationList
          areProductNotificationsLoading={areProductNotificationsLoading}
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

  renderPanelFooter = () => {
    const {
      currentDomainFeatures,
      currentUserRole,
      inProductTransientNotificationsEnabled,
      isSecondaryPanelOpen,
      isSuperAdmin,
      onShowTransientNotificationsChange,
      showMyAlertPreference,
      showProductNotifications,
      showProductNotificationsAsSecondaryPanel,
      showUserNotifications,
      mapboxAccessToken
    } = this.props;

    if ((showProductNotifications && !showUserNotifications) ||
      (showProductNotificationsAsSecondaryPanel && isSecondaryPanelOpen)) {
      const {
        markAllProductNotificationsAsRead,
        unreadProductNotificationCount
      } = this.props;

      return (<PanelFooter
        currentDomainFeatures={currentDomainFeatures}
        currentUserRole={currentUserRole}
        forUserNotifications={false}
        hasUnreadNotifications={unreadProductNotificationCount > 0}
        inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
        isSuperAdmin={isSuperAdmin}
        mapboxAccessToken={mapboxAccessToken}
        markAllProductNotificationsAsRead={markAllProductNotificationsAsRead}
        onShowTransientNotificationsChange={onShowTransientNotificationsChange}
        showMyAlertPreference={showMyAlertPreference}
        showUserNotifications={showUserNotifications} />);
    } else if (showUserNotifications) {
      const {
        clearAllUserNotifications,
        openClearAllUserNotificationsPrompt,
        toggleClearAllUserNotificationsPrompt,
        userNotifications
      } = this.props;

      const hasUserNotifications = userNotifications.activity.notifications.length > 0 ||
        (!_.isUndefined(userNotifications.alert) && userNotifications.alert.notifications.length > 0);

      return (<PanelFooter
        clearAllUserNotifications={clearAllUserNotifications}
        currentDomainFeatures={currentDomainFeatures}
        currentUserRole={currentUserRole}
        forUserNotifications
        hasUserNotifications={hasUserNotifications}
        inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
        isSuperAdmin={isSuperAdmin}
        mapboxAccessToken={mapboxAccessToken}
        onShowTransientNotificationsChange={onShowTransientNotificationsChange}
        openClearAllUserNotificationsPrompt={openClearAllUserNotificationsPrompt}
        showMyAlertPreference={showMyAlertPreference}
        showUserNotifications={showUserNotifications}
        toggleClearAllUserNotificationsPrompt={toggleClearAllUserNotificationsPrompt} />);
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
  areProductNotificationsLoading: PropTypes.bool.isRequired,
  clearAllUserNotifications: PropTypes.func.isRequired,
  currentUserRole: PropTypes.string,
  filterUserNotificationsBy: PropTypes.string.isRequired,
  hasEnqueuedUserNotifications: PropTypes.func.isRequired,
  hasError: PropTypes.bool.isRequired,
  inProductTransientNotificationsEnabled: PropTypes.bool,
  isSecondaryPanelOpen: PropTypes.bool.isRequired,
  isSuperAdmin: PropTypes.bool.isRequired,
  markAllProductNotificationsAsRead: PropTypes.func.isRequired,
  onClearUserNotification: PropTypes.func.isRequired,
  onLoadMoreUserNotifications: PropTypes.func.isRequired,
  onSeeNewUserNotifications: PropTypes.func.isRequired,
  onShowTransientNotificationsChange: PropTypes.func.isRequired,
  onToggleReadUserNotification: PropTypes.func.isRequired,
  openClearAllUserNotificationsPrompt: PropTypes.bool.isRequired,
  productNotifications: PropTypes.array.isRequired,
  showMyAlertPreference: PropTypes.bool,
  showProductNotifications: PropTypes.bool.isRequired,
  showProductNotificationsAsSecondaryPanel: PropTypes.bool.isRequired,
  showUserNotifications: PropTypes.bool.isRequired,
  toggleClearAllUserNotificationsPrompt: PropTypes.func.isRequired,
  toggleNotificationPanel: PropTypes.func.isRequired,
  toggleProductNotificationsSecondaryPanel: PropTypes.func.isRequired,
  unreadProductNotificationCount: PropTypes.number.isRequired,
  unreadUserNotificationCount: PropTypes.number.isRequired,
  userNotifications: PropTypes.object.isRequired,
  viewOlderLink: PropTypes.string
};

export default connectLocalization(cssModules(NotificationList, styles, { allowMultiple: true }));
